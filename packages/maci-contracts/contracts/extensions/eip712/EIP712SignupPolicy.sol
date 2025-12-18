// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { IBasePolicy } from "@excubiae/contracts/contracts/interfaces/IBasePolicy.sol";
import { EIP712SignupChecker } from "./EIP712SignupChecker.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EIP712SignupPolicy
 * @notice IBasePolicy implementation for EIP-712 based MACI signup
 * @dev Integrates with MACI's signUpPolicy pattern
 */
contract EIP712SignupPolicy is IBasePolicy, Ownable {

    // ============ State Variables ============

    /// @notice The checker contract for signature verification
    EIP712SignupChecker public immutable checker;

    /// @notice The guarded contract (MACI)
    address public guarded;

    // ============ Errors ============

    error OnlyGuarded();
    error CheckFailed();

    // ============ Constructor ============

    /**
     * @notice Initialize the policy
     * @param _checker Address of the EIP712SignupChecker contract
     */
    constructor(address _checker) Ownable(msg.sender) {
        checker = EIP712SignupChecker(_checker);
    }

    // ============ IBasePolicy Implementation ============

    /**
     * @notice Enforce the signup policy
     * @dev Called by MACI.signUp() to verify the user is allowed to sign up
     * @param _subject The user address (msg.sender from MACI)
     * @param _evidence Encoded signature data from frontend
     */
    function enforce(address _subject, bytes calldata _evidence) external override {
        // Only MACI (guarded contract) can call this
        if (msg.sender != guarded && guarded != address(0)) revert OnlyGuarded();

        // If evidence is empty, allow (for backward compatibility with tests)
        if (_evidence.length == 0) {
            emit Enforced(_subject, guarded, _evidence);
            return;
        }

        // Check signature validity
        bool valid = checker.check(_subject, _evidence);
        if (!valid) revert CheckFailed();

        // Mark user as signed up in checker
        checker.markSignedUp(_subject);

        emit Enforced(_subject, guarded, _evidence);
    }

    /**
     * @notice Set the guarded contract (MACI)
     * @param _guarded The MACI contract address
     */
    function setTarget(address _guarded) external override onlyOwner {
        guarded = _guarded;
        emit TargetSet(_guarded);
    }

    /**
     * @notice Return the policy trait
     */
    function trait() external pure override returns (string memory) {
        return "EIP712Signup";
    }
}
