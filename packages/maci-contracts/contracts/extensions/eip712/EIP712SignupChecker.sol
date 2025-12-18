// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EIP712SignupChecker
 * @notice EIP-712 signature verification for MACI signup
 * @dev Implements the Excubiae Checker pattern for signature verification
 */
contract EIP712SignupChecker is EIP712, Ownable {
    using ECDSA for bytes32;

    // ============ State Variables ============

    /// @notice Mapping of user address to nonce (anti-replay)
    mapping(address => uint256) public nonces;

    /// @notice Mapping of user address to signup status (anti-double-signup)
    mapping(address => bool) public hasSignedUp;

    /// @notice Set of allowed relayer addresses
    mapping(address => bool) public relayers;

    // ============ EIP-712 Type Hash ============

    /// @notice Type hash for SignupRequest
    bytes32 public constant SIGNUP_REQUEST_TYPEHASH = 
        keccak256("SignupRequest(address subject,uint256 nonce,uint256 deadline)");

    // ============ Events ============

    event SignupChecked(address indexed subject, uint256 nonce, uint256 timestamp);
    event RelayerUpdated(address indexed relayer, bool status);

    // ============ Errors ============

    error InvalidSignature();
    error SignatureExpired();
    error InvalidNonce();
    error AlreadySignedUp();
    error NotRelayer();

    // ============ Constructor ============

    /**
     * @notice Initialize the checker
     * @param _name EIP-712 domain name
     * @param _version EIP-712 domain version
     */
    constructor(
        string memory _name,
        string memory _version
    ) EIP712(_name, _version) Ownable(msg.sender) {
        relayers[msg.sender] = true;
    }

    // ============ Checker Function ============

    /**
     * @notice Check if a signup request is valid
     * @dev Called by the policy contract
     * @param _subject The user address to check
     * @param _evidence Encoded signature data (signature, deadline)
     * @return valid Whether the signature is valid
     */
    function check(address _subject, bytes calldata _evidence) external returns (bool valid) {
        // Decode evidence: (signature, deadline)
        (bytes memory signature, uint256 deadline) = abi.decode(_evidence, (bytes, uint256));

        // 1. Check deadline
        if (block.timestamp > deadline) revert SignatureExpired();

        // 2. Check not already signed up
        if (hasSignedUp[_subject]) revert AlreadySignedUp();

        // 3. Get expected nonce
        uint256 expectedNonce = nonces[_subject];

        // 4. Reconstruct and verify signature
        bytes32 structHash = keccak256(
            abi.encode(SIGNUP_REQUEST_TYPEHASH, _subject, expectedNonce, deadline)
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);

        // 5. Verify signer matches subject
        if (signer != _subject) revert InvalidSignature();

        // 6. Update state (CEI pattern - but this is a check, state updated in policy)
        // Note: State updates moved to markSignedUp() to be called after MACI signup succeeds
        
        emit SignupChecked(_subject, expectedNonce, block.timestamp);

        return true;
    }

    /**
     * @notice Mark a user as signed up (called by policy after successful MACI signup)
     * @param _subject The user address
     */
    function markSignedUp(address _subject) external {
        // Only callable by owner (policy contract should be set as owner or use access control)
        require(msg.sender == owner() || relayers[msg.sender], "Not authorized");
        
        nonces[_subject]++;
        hasSignedUp[_subject] = true;
    }

    // ============ View Functions ============

    /**
     * @notice Get nonce for a user
     */
    function getNonce(address _user) external view returns (uint256) {
        return nonces[_user];
    }

    /**
     * @notice Check if user has signed up
     */
    function isSignedUp(address _user) external view returns (bool) {
        return hasSignedUp[_user];
    }

    /**
     * @notice Get the EIP-712 domain separator
     */
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    // ============ Admin Functions ============

    /**
     * @notice Update relayer status
     */
    function setRelayer(address _relayer, bool _status) external onlyOwner {
        relayers[_relayer] = _status;
        emit RelayerUpdated(_relayer, _status);
    }
}
