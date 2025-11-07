// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import ERC20 từ OpenZeppelin
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol";

contract HIDROToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("HIDRO", "HD") {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
}
