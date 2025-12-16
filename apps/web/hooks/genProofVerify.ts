"use client";

import { useState } from "react";
// @ts-ignore
import * as snarkjs from "snarkjs";

export interface VoteCircuitInput {
    privateKey: bigint;
    vote: bigint;
    voiceCredits: bigint;
    nonce: bigint;
    pollId: bigint;
    pubkeyX: bigint;
    pubkeyY: bigint;
    voiceCreditBalance: bigint;
    voterIndex: bigint;
    voteCommitment: bigint;
    outcome: bigint;
}

export interface ProofData {
    proof: any;
    publicSignals: any;
}

export function useGenProofVerify() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>("");

    const generateVoteProof = async (input: VoteCircuitInput): Promise<ProofData> => {
        setLoading(true);
        setStatus("Generating proof...");
        try {
            console.log("Starting proof generation with input:", input);

            const wasmPath = "/zkeys/VoteProof/voteProof.wasm";
            const zkeyPath = "/zkeys/VoteProof/voteProof_0001.zkey";

            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                {
                    privateKey: input.privateKey,
                    vote: input.vote,
                    voiceCredits: input.voiceCredits,
                    nonce: input.nonce,
                    pollId: input.pollId,
                    pubkeyX: input.pubkeyX,
                    pubkeyY: input.pubkeyY,
                    voiceCreditBalance: input.voiceCreditBalance,
                    voterIndex: input.voterIndex,
                    voteCommitment: input.voteCommitment,
                    outcome: input.outcome,
                },
                wasmPath,
                zkeyPath
            );

            console.log("Proof generated successfully");
            setStatus("Proof generated successfully!");

            return { proof, publicSignals };
        } catch (error: any) {
            console.error("Proof generation failed:", error);
            setStatus("Proof generation failed: " + (error.message || String(error)));
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const verifyProof = async (proof: any, publicSignals: string[]): Promise<boolean> => {
        setLoading(true);
        setStatus("Verifying proof...");
        try {
            const vkeyResponse = await fetch("/zkeys/VoteProof/verification_key.json");
            if (!vkeyResponse.ok) {
                throw new Error("Failed to fetch verification key");
            }
            const vkey = await vkeyResponse.json();

            const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);

            console.log("Proof verification:", isValid ? "VALID" : "INVALID");
            setStatus(isValid ? "Proof verified: VALID" : "Proof verified: INVALID");

            return isValid;
        } catch (error: any) {
            console.error("Proof verification failed:", error);
            setStatus("Proof verification failed: " + (error.message || String(error)));
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        generateVoteProof,
        verifyProof,
        loading,
        status,
    };
}
