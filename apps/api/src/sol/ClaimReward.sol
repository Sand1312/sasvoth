// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Strings.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol";

contract Claiming_Contract {
    address public owner;
    mapping(uint256 => string) public rewardedR;
    uint256 public orderingClaiming = 0;
    IERC20 public token;
    bool public allowToClaim = true;

    uint256 public rate = 10000;        
    uint256 public creditRate = 10;   
    mapping(address => uint256) public voiceCredits;

    event HDBought(address indexed buyer, uint256 ethSpent, uint256 tokenAmount);
    event HDSold(address indexed seller, uint256 tokenSold, uint256 ethReturned);
    event VoiceCreditsPurchased(address indexed buyer, uint256 tokenAmount, uint256 credits);

    constructor(address tokenAddress) {
        owner = msg.sender;
        token = IERC20(tokenAddress);
    }

    modifier checkOwner() {
        require(msg.sender == owner, "Sorry, you are not owner");
        _;
    }

    // --- Các hàm quản trị ---
    function changeowner(address addressMaster) public checkOwner {
        require(addressMaster != address(0), "Wrong address");
        owner = addressMaster;
    }

    function changeClaimingStatus(bool newStatus) public checkOwner {
        allowToClaim = newStatus;
    }

    function withdrawToken() public checkOwner {
        require(token.balanceOf(address(this)) > 0, "Sorry, balance is Zero.");
        token.transfer(owner, token.balanceOf(address(this)));
    }

    function withdrawETH() public checkOwner {
        require(address(this).balance > 0, "ETH balance is zero");
        payable(owner).transfer(address(this).balance);
    }

    // --- Các hàm giao dịch HD ---
    function buy_HD() public payable {
        require(msg.value > 0, "Send ETH to buy HD");

        uint256 tokenBuy = msg.value * rate;
        require(token.balanceOf(address(this)) >= tokenBuy, "Not enough HD in contract");

        token.transfer(msg.sender, tokenBuy);
        emit HDBought(msg.sender, msg.value, tokenBuy);
    }

    function sell_HD(uint256 tokenSell) public {
        require(tokenSell > 0, "Amount must be > 0");
        uint256 ethAmount = tokenSell / rate;

        require(token.allowance(msg.sender, address(this)) >= tokenSell, "Approve HD first");
        require(address(this).balance >= ethAmount, "Contract has not enough ETH");

        bool success = token.transferFrom(msg.sender, address(this), tokenSell);
        require(success, "HD transferFrom failed");

        payable(msg.sender).transfer(ethAmount);
        emit HDSold(msg.sender, tokenSell, ethAmount);
    }

    function buyVoiceCredits(uint256 credits) external {
        require(credits > 0, "Amount must be > 0");

        uint256 tokenAmount = credits * creditRate;
        require(token.allowance(msg.sender, address(this)) >= tokenAmount, "Approve HD first");

        bool success = token.transferFrom(msg.sender, address(this), tokenAmount);
        require(success, "Token transfer failed");

        voiceCredits[msg.sender] += credits;
        emit VoiceCreditsPurchased(msg.sender, tokenAmount, credits);
    }

   
    function ClaimReward(
        string memory _idClaim,
        uint256 rewardAmount,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public {
        require(allowToClaim == true, "Not allowed to claim at this momment");
        require(
            token.balanceOf(address(this)) > rewardAmount,
            "Sorry, not enough tokens to claim now."
        );

        string memory stringR = _toLower(_idClaim);
        require(
            checkHashIsClaimed(stringR) == false,
            "Sorry, hash has been claimed already."
        );

        string memory firstString = concatenateStrings(
            _toLower(Strings.toHexString(uint160(msg.sender), 20)),
            "_"
        );
        string memory secondString = concatenateStrings(
            firstString,
            Strings.toString(rewardAmount)
        );
        string memory thirdString = concatenateStrings(secondString, "_");
        string memory fourthString = concatenateStrings(thirdString, _idClaim);
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 _hashedMessage = returnHashedMessage(fourthString);
        bytes32 prefixedHashMessage = keccak256(
            abi.encodePacked(prefix, _hashedMessage)
        );
        address signer = ecrecover(prefixedHashMessage, _v, _r, _s);

        require(signer == owner, "Sorry, wrong hashed.");
        token.transfer(msg.sender, rewardAmount);
        rewardedR[orderingClaiming] = stringR;
        orderingClaiming++;
    }

    function getClaimedTotal() public view returns (uint256) {
        return orderingClaiming;
    }

    function checkHashIsClaimed(
        string memory stringR
    ) public view returns (bool) {
        bool found = false;
        for (uint256 r = 0; r < orderingClaiming; r++) {
            if (
                keccak256(bytes(rewardedR[r])) ==
                keccak256(bytes(_toLower(stringR)))
            ) {
                found = true;
                break;
            }
        }
        return found;
    }

    function convert2Hash(
        bytes32 _r,
        bytes32 _s
    ) public pure returns (string memory) {
        string memory secretHash = _toLower(
            concatenateStrings(bytes32ToString(_r), bytes32ToString(_s))
        );
        return secretHash;
    }

    function bytes32ToString(
        bytes32 _bytes32
    ) public pure returns (string memory) {
        uint8 i = 0;
        while (i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }

    function _toLower(string memory str) internal pure returns (string memory) {
        bytes memory bStr = bytes(str);
        bytes memory bLower = new bytes(bStr.length);
        for (uint i = 0; i < bStr.length; i++) {
            if ((uint8(bStr[i]) >= 65) && (uint8(bStr[i]) <= 90)) {
                bLower[i] = bytes1(uint8(bStr[i]) + 32);
            } else {
                bLower[i] = bStr[i];
            }
        }
        return string(bLower);
    }

    function returnHashedMessage(
        string memory rootString
    ) public pure returns (bytes32) {
        string memory len = Strings.toString(bytes(rootString).length);
        bytes32 messageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n", len, rootString)
        );
        return messageHash;
    }

    function VerifyMessage(
        bytes32 _hashedMessage,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public pure returns (address) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHashMessage = keccak256(
            abi.encodePacked(prefix, _hashedMessage)
        );
        address signer = ecrecover(prefixedHashMessage, _v, _r, _s);
        return signer;
    }

    function returnHashedMsg(
        string memory message
    ) public pure returns (bytes32) {
        string memory len = Strings.toString(bytes(message).length);
        bytes32 messageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n", len, message)
        );
        return messageHash;
    }

    function concatenateStrings(
        string memory a,
        string memory b
    ) public pure returns (string memory) {
        bytes memory concatenatedBytes = abi.encodePacked(a, b);
        return string(concatenatedBytes);
    }

    function stringToAddress(
        string memory _address
    ) public pure returns (address) {
        string memory cleanAddress = remove0xPrefix(_address);
        bytes20 _addressBytes = parseHexStringToBytes20(cleanAddress);
        return address(_addressBytes);
    }

    function remove0xPrefix(
        string memory _hexString
    ) internal pure returns (string memory) {
        if (
            bytes(_hexString).length >= 2 &&
            bytes(_hexString)[0] == "0" &&
            (bytes(_hexString)[1] == "x" || bytes(_hexString)[1] == "X")
        ) {
            return substring(_hexString, 2, bytes(_hexString).length);
        }
        return _hexString;
    }

    function substring(
        string memory _str,
        uint256 _start,
        uint256 _end
    ) internal pure returns (string memory) {
        bytes memory _strBytes = bytes(_str);
        bytes memory _result = new bytes(_end - _start);
        for (uint256 i = _start; i < _end; i++) {
            _result[i - _start] = _strBytes[i];
        }
        return string(_result);
    }

    function parseHexStringToBytes20(
        string memory _hexString
    ) internal pure returns (bytes20) {
        bytes memory _bytesString = bytes(_hexString);
        uint160 _parsedBytes = 0;
        for (uint256 i = 0; i < _bytesString.length; i += 2) {
            _parsedBytes *= 256;
            uint8 _byteValue = parseByteToUint8(_bytesString[i]);
            _byteValue *= 16;
            _byteValue += parseByteToUint8(_bytesString[i + 1]);
            _parsedBytes += _byteValue;
        }
        return bytes20(_parsedBytes);
    }

    function parseByteToUint8(bytes1 _byte) internal pure returns (uint8) {
        if (uint8(_byte) >= 48 && uint8(_byte) <= 57) {
            return uint8(_byte) - 48;
        } else if (uint8(_byte) >= 65 && uint8(_byte) <= 70) {
            return uint8(_byte) - 55;
        } else if (uint8(_byte) >= 97 && uint8(_byte) <= 102) {
            return uint8(_byte) - 87;
        } else {
            revert(string(abi.encodePacked("Bytes value is wrong: ", _byte)));
        }
    }
}
