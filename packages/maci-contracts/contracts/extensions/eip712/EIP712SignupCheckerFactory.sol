// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { EIP712SignupChecker } from "./EIP712SignupChecker.sol";

/**
 * @title EIP712SignupCheckerFactory
 * @notice Factory for deploying EIP712SignupChecker instances
 */
contract EIP712SignupCheckerFactory {
    
    /// @notice Deploy a new EIP712SignupChecker
    /// @param _name EIP-712 domain name
    /// @param _version EIP-712 domain version
    /// @return checker The deployed checker address
    function deploy(
        string memory _name,
        string memory _version
    ) external returns (address checker) {
        EIP712SignupChecker instance = new EIP712SignupChecker(_name, _version);
        
        // Transfer ownership to caller
        instance.transferOwnership(msg.sender);
        
        return address(instance);
    }
}
