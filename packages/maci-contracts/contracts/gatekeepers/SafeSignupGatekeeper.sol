// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IMACI } from "../interfaces/IMACI.sol";
import { DomainObjs } from "../utilities/DomainObjs.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SafeSignupGatekeeper
 * @notice EIP-712 based gatekeeper for secure, gasless MACI signups
 * @dev Protects against phishing (domain binding), replay attacks (nonce),
 *      and double signups (hasSignedUp mapping)
 */
contract SafeSignupGatekeeper is EIP712, Ownable {
    using ECDSA for bytes32;

    // ============ State Variables ============

    /// @notice MACI contract address
    IMACI public maci;

    /// @notice Mapping of user address to nonce (anti-replay)
    mapping(address => uint256) public nonces;

    /// @notice Mapping of user address to signup status (anti-double-signup)
    mapping(address => bool) public hasSignedUp;

    /// @notice Mapping of relayer addresses that can submit signups
    mapping(address => bool) public relayers;

    // ============ EIP-712 Type Hash ============

    /// @notice Type hash for SignupRequest
    /// SignupRequest(uint256 pubKeyX,uint256 pubKeyY,uint256 nonce,uint256 deadline)
    bytes32 public constant SIGNUP_REQUEST_TYPEHASH = 
        keccak256("SignupRequest(uint256 pubKeyX,uint256 pubKeyY,uint256 nonce,uint256 deadline)");

    // ============ Events ============

    event SignupRelayed(
        address indexed user,
        uint256 stateIndex,
        uint256 pubKeyX,
        uint256 pubKeyY,
        uint256 timestamp
    );

    event RelayerUpdated(address indexed relayer, bool status);
    event MaciUpdated(address indexed newMaci);

    // ============ Errors ============

    error InvalidSignature();
    error SignatureExpired();
    error InvalidNonce();
    error AlreadySignedUp();
    error NotRelayer();
    error ZeroAddress();

    // ============ Constructor ============

    /**
     * @notice Initialize the gatekeeper
     * @param _maci Address of the MACI contract
     * @param _name EIP-712 domain name
     * @param _version EIP-712 domain version
     */
    constructor(
        address _maci,
        string memory _name,
        string memory _version
    ) EIP712(_name, _version) Ownable(msg.sender) {
        if (_maci == address(0)) revert ZeroAddress();
        maci = IMACI(_maci);
        relayers[msg.sender] = true;
    }

    // ============ Modifiers ============

    modifier onlyRelayer() {
        if (!relayers[msg.sender]) revert NotRelayer();
        _;
    }

    // ============ External Functions ============

    /**
     * @notice Signup a user with an EIP-712 signature
     * @dev Called by the relayer (backend) with user's signature
     * @param _pubKeyX MACI public key X coordinate
     * @param _pubKeyY MACI public key Y coordinate
     * @param _deadline Signature expiration timestamp
     * @param _signature User's EIP-712 signature
     * @return stateIndex The user's state index in MACI
     */
    function signupWithSignature(
        uint256 _pubKeyX,
        uint256 _pubKeyY,
        uint256 _deadline,
        bytes calldata _signature
    ) external onlyRelayer returns (uint256 stateIndex) {
        // 1. Check deadline
        if (block.timestamp > _deadline) revert SignatureExpired();

        // 2. Recover and verify signer
        address signer = _verifySigner(_pubKeyX, _pubKeyY, _deadline, _signature);
        if (signer == address(0)) revert InvalidSignature();
        
        // 3. Check not already signed up (anti-double-signup)
        if (hasSignedUp[signer]) revert AlreadySignedUp();

        // 4. Update state BEFORE external call (CEI pattern)
        nonces[signer]++;
        hasSignedUp[signer] = true;

        // 5. Call MACI signup
        maci.signUp(DomainObjs.PublicKey(_pubKeyX, _pubKeyY), "");

        // 6. Get state index and emit
        stateIndex = maci.totalSignups() - 1;
        emit SignupRelayed(signer, stateIndex, _pubKeyX, _pubKeyY, block.timestamp);

        return stateIndex;
    }

    /**
     * @notice Get the nonce for a user
     * @param _user User address
     * @return Current nonce
     */
    function getNonce(address _user) external view returns (uint256) {
        return nonces[_user];
    }

    /**
     * @notice Check if a user has signed up
     * @param _user User address
     * @return Whether user has signed up
     */
    function isSignedUp(address _user) external view returns (bool) {
        return hasSignedUp[_user];
    }

    /**
     * @notice Get the EIP-712 domain separator
     * @return Domain separator hash
     */
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    // ============ Admin Functions ============

    /**
     * @notice Update relayer status
     * @param _relayer Relayer address
     * @param _status New status
     */
    function setRelayer(address _relayer, bool _status) external onlyOwner {
        relayers[_relayer] = _status;
        emit RelayerUpdated(_relayer, _status);
    }

    /**
     * @notice Update MACI contract address
     * @param _maci New MACI address
     */
    function setMaci(address _maci) external onlyOwner {
        if (_maci == address(0)) revert ZeroAddress();
        maci = IMACI(_maci);
        emit MaciUpdated(_maci);
    }

    // ============ Internal Functions ============

    /**
     * @dev Helper to verify signer and nonce from signature
     */
    function _verifySigner(
        uint256 _pubKeyX,
        uint256 _pubKeyY,
        uint256 _deadline,
        bytes calldata _signature
    ) internal view returns (address) {
        // We need to iterate to find the correct nonce
        // For simplicity, recover signer first with expected nonce
        bytes32 tempDigest = _hashTypedDataV4(
            keccak256(abi.encode(SIGNUP_REQUEST_TYPEHASH, _pubKeyX, _pubKeyY, 0, _deadline))
        );
        address tempSigner = ECDSA.recover(tempDigest, _signature);
        
        // Get actual nonce and verify
        uint256 expectedNonce = nonces[tempSigner];
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(SIGNUP_REQUEST_TYPEHASH, _pubKeyX, _pubKeyY, expectedNonce, _deadline))
        );
        return ECDSA.recover(digest, _signature);
    }
}
