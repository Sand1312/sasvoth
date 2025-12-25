"use client";

import { useState } from "react";
import { createWalletClient, createPublicClient, custom, http } from "viem";
import { arbitrumSepolia } from "viem/chains";

import { VERIFY_VOTE_ABI } from "@sasvoth/contracts";
import { VERIFY_VOTE } from "@sasvoth/contracts";
export function useVerifyVote() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>("");

    const getWalletClient = async () => {
        if (!window.ethereum) throw new Error("No wallet found");

        return createWalletClient({
            chain: arbitrumSepolia,
            transport: custom(window.ethereum),
        });
    };

    const getPublicClient = () => {
        // const rpcUrl = process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL!;
        const rpcUrl = 'https://sepolia-rollup.arbitrum.io/rpc';
        return createPublicClient({
            chain: arbitrumSepolia,
            transport: http(rpcUrl, {
                batch: true,
            }),
        });
    };

    const verifyVote = async (
        pollId: number | bigint,
        voterIndex: number | bigint,
        proof: readonly [
            bigint,
            bigint,
            bigint,
            bigint,
            bigint,
            bigint,
            bigint,
            bigint
        ],
        publicInputs: readonly [bigint, bigint, bigint]
    ) => {
        setLoading(true);
        setStatus("Verifying vote...");
        try {
            const walletClient = await getWalletClient();
            const [account] = await walletClient.getAddresses();
            if (!account) throw new Error("No account connected");


            const hash = await walletClient.writeContract({
                address: VERIFY_VOTE,
                abi: VERIFY_VOTE_ABI,
                functionName: "verifyVote",
                args: [BigInt(pollId), BigInt(voterIndex), proof, publicInputs],
                account,
            });

            console.log("Verification tx submitted:", hash);
            setStatus("Verification transaction submitted!");

            return { hash };
        } catch (error: any) {
            console.error("Verify vote error:", error);
            setStatus("Error: " + (error.shortMessage || error.message));
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        verifyVote,
        loading,
        status,
    };
}
