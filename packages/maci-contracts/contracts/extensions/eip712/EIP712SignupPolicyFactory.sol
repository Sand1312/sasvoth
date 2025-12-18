// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { EIP712SignupPolicy } from "./EIP712SignupPolicy.sol";

/**
 * @title EIP712SignupPolicyFactory
 * @notice Factory for deploying EIP712SignupPolicy instances
 */
contract EIP712SignupPolicyFactory {
    
    /// @notice Deploy a new EIP712SignupPolicy
    /// @param _checker Address of the EIP712SignupChecker
    /// @return policy The deployed policy address
    function deploy(address _checker) external returns (address policy) {
        EIP712SignupPolicy instance = new EIP712SignupPolicy(_checker);
        
        // Transfer ownership to caller
        instance.transferOwnership(msg.sender);
        
        return address(instance);
    }
}
