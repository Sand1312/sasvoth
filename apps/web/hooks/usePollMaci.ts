// // hooks/usePoll.ts
// import {
//   useReadContract,
//   useWriteContract,
//   useWaitForTransactionReceipt,
//   usePublicClient,
// } from "wagmi";
// import { useState, useEffect } from "react";

// interface UsePollReturn {
//   // Poll info
//   pollInfo: {
//     startDate: bigint | null;
//     endDate: bigint | null;
//     numMessages: bigint | null;
//     totalSignups: bigint | null;
//     voteOptions: bigint | null;
//     coordinatorPublicKey: { x: bigint; y: bigint } | null;
//     isActive: boolean;
//   };
  
//   // Voting functions
//   publishMessage: (
//     message: { data: bigint[] },
//     encryptionPublicKey: { x: bigint; y: bigint }
//   ) => void;
//   isPublishing: boolean;
//   isPublishSuccess: boolean;
//   publishHash: `0x${string}` | undefined;
//   publishError: Error | null;

//   // Batch voting
//   publishMessageBatch: (
//     messages: { data: bigint[] }[],
//     encryptionPublicKeys: { x: bigint; y: bigint }[]
//   ) => void;
//   isPublishingBatch: boolean;
//   isBatchSuccess: boolean;
//   batchHash: `0x${string}` | undefined;
//   batchError: Error | null;

//   // Join poll
//   joinPoll: (
//     nullifier: bigint,
//     publicKey: { x: bigint; y: bigint },
//     stateRootIndex: bigint,
//     proof: bigint[],
//     signUpPolicyData: `0x${string}`,
//     initialVoiceCreditProxyData: `0x${string}`
//   ) => void;
//   isJoining: boolean;
//   isJoinSuccess: boolean;
//   joinHash: `0x${string}` | undefined;
//   joinError: Error | null;

//   // Utility functions
//   padAndHashMessage: (dataToPad: [bigint, bigint]) => Promise<{
//     message: { data: bigint[] };
//     padKey: { x: bigint; y: bigint };
//     msgHash: bigint;
//   }>;
//   hashMessageAndPublicKey: (
//     message: { data: bigint[] },
//     encryptionPublicKey: { x: bigint; y: bigint }
//   ) => Promise<bigint>;

//   // Refetch functions
//   refetchPollInfo: () => void;
// }

// export function usePoll(pollAddress: `0x${string}` | null): UsePollReturn {
//   const publicClient = usePublicClient();
//   const [isActive, setIsActive] = useState<boolean>(false);

//   // Read poll information
//   const { data: startDate, refetch: refetchStartDate } = useReadContract({
//     address: pollAddress!,
//     abi: [
//       {
//         inputs: [],
//         name: "startDate",
//         outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//         stateMutability: "view",
//         type: "function",
//       },
//     ],
//     functionName: "startDate",
//     query: { enabled: !!pollAddress },
//   });

//   const { data: endDate, refetch: refetchEndDate } = useReadContract({
//     address: pollAddress!,
//     abi: [
//       {
//         inputs: [],
//         name: "endDate",
//         outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//         stateMutability: "view",
//         type: "function",
//       },
//     ],
//     functionName: "endDate",
//     query: { enabled: !!pollAddress },
//   });

//   const { data: numMessages, refetch: refetchNumMessages } = useReadContract({
//     address: pollAddress!,
//     abi: [
//       {
//         inputs: [],
//         name: "numMessages",
//         outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//         stateMutability: "view",
//         type: "function",
//       },
//     ],
//     functionName: "numMessages",
//     query: { enabled: !!pollAddress },
//   });

//   const { data: totalSignups, refetch: refetchTotalSignups } = useReadContract({
//     address: pollAddress!,
//     abi: [
//       {
//         inputs: [],
//         name: "totalSignups",
//         outputs: [{ internalType: "uint256", name: "signups", type: "uint256" }],
//         stateMutability: "view",
//         type: "function",
//       },
//     ],
//     functionName: "totalSignups",
//     query: { enabled: !!pollAddress },
//   });

//   const { data: voteOptions, refetch: refetchVoteOptions } = useReadContract({
//     address: pollAddress!,
//     abi: [
//       {
//         inputs: [],
//         name: "voteOptions",
//         outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//         stateMutability: "view",
//         type: "function",
//       },
//     ],
//     functionName: "voteOptions",
//     query: { enabled: !!pollAddress },
//   });

//   const { data: coordinatorPublicKey, refetch: refetchCoordinatorKey } = useReadContract({
//     address: pollAddress!,
//     abi: [
//       {
//         inputs: [],
//         name: "coordinatorPublicKey",
//         outputs: [
//           { internalType: "uint256", name: "x", type: "uint256" },
//           { internalType: "uint256", name: "y", type: "uint256" },
//         ],
//         stateMutability: "view",
//         type: "function",
//       },
//     ],
//     functionName: "coordinatorPublicKey",
//     query: { enabled: !!pollAddress },
//   });

//   // Check if poll is active
//   useEffect(() => {
//     if (startDate && endDate) {
//       const currentTime = BigInt(Math.floor(Date.now() / 1000));
//       setIsActive(currentTime > startDate && currentTime < endDate);
//     }
//   }, [startDate, endDate]);

//   // Publish single message (vote)
//   const {
//     writeContract: writePublishMessage,
//     data: publishHash,
//     isPending: isPublishing,
//     error: publishError,
//   } = useWriteContract();

//   const { isLoading: isConfirmingPublish, isSuccess: isPublishSuccess } =
//     useWaitForTransactionReceipt({
//       hash: publishHash,
//     });

//   const publishMessage = (
//     message: { data: bigint[] },
//     encryptionPublicKey: { x: bigint; y: bigint }
//   ) => {
//     if (!pollAddress) {
//       console.error("❌ Poll address is required");
//       return;
//     }

//     console.log("📨 Publishing message:", { message, encryptionPublicKey });

//     writePublishMessage(
//       {
//         address: pollAddress,
//         abi: [
//           {
//             inputs: [
//               {
//                 components: [
//                   {
//                     internalType: "uint256[10]",
//                     name: "data",
//                     type: "uint256[10]",
//                   },
//                 ],
//                 internalType: "struct DomainObjs.Message",
//                 name: "_message",
//                 type: "tuple",
//               },
//               {
//                 components: [
//                   { internalType: "uint256", name: "x", type: "uint256" },
//                   { internalType: "uint256", name: "y", type: "uint256" },
//                 ],
//                 internalType: "struct DomainObjs.PublicKey",
//                 name: "_encryptionPublicKey",
//                 type: "tuple",
//               },
//             ],
//             name: "publishMessage",
//             outputs: [],
//             stateMutability: "nonpayable",
//             type: "function",
//           },
//         ],
//         functionName: "publishMessage",
//         args: [message, encryptionPublicKey],
//       },
//       {
//         onSuccess: (hash) => {
//           console.log("✅ Message published! Hash:", hash);
//           refetchNumMessages();
//         },
//         onError: (error) => {
//           console.error("❌ Failed to publish message:", error);
//         },
//       }
//     );
//   };

//   // Publish message batch
//   const {
//     writeContract: writePublishBatch,
//     data: batchHash,
//     isPending: isPublishingBatch,
//     error: batchError,
//   } = useWriteContract();

//   const { isLoading: isConfirmingBatch, isSuccess: isBatchSuccess } =
//     useWaitForTransactionReceipt({
//       hash: batchHash,
//     });

//   const publishMessageBatch = (
//     messages: { data: bigint[] }[],
//     encryptionPublicKeys: { x: bigint; y: bigint }[]
//   ) => {
//     if (!pollAddress) {
//       console.error("❌ Poll address is required");
//       return;
//     }

//     console.log("📨 Publishing batch messages:", { 
//       messageCount: messages.length,
//       keyCount: encryptionPublicKeys.length 
//     });

//     writePublishBatch(
//       {
//         address: pollAddress,
//         abi: [
//           {
//             inputs: [
//               {
//                 components: [
//                   {
//                     internalType: "uint256[10]",
//                     name: "data",
//                     type: "uint256[10]",
//                   },
//                 ],
//                 internalType: "struct DomainObjs.Message[]",
//                 name: "_messages",
//                 type: "tuple[]",
//               },
//               {
//                 components: [
//                   { internalType: "uint256", name: "x", type: "uint256" },
//                   { internalType: "uint256", name: "y", type: "uint256" },
//                 ],
//                 internalType: "struct DomainObjs.PublicKey[]",
//                 name: "_encryptionPublicKeys",
//                 type: "tuple[]",
//               },
//             ],
//             name: "publishMessageBatch",
//             outputs: [],
//             stateMutability: "nonpayable",
//             type: "function",
//           },
//         ],
//         functionName: "publishMessageBatch",
//         args: [messages, encryptionPublicKeys],
//       },
//       {
//         onSuccess: (hash) => {
//           console.log("✅ Batch messages published! Hash:", hash);
//           refetchNumMessages();
//         },
//         onError: (error) => {
//           console.error("❌ Failed to publish batch messages:", error);
//         },
//       }
//     );
//   };

//   // Join poll
//   const {
//     writeContract: writeJoinPoll,
//     data: joinHash,
//     isPending: isJoining,
//     error: joinError,
//   } = useWriteContract();

//   const { isLoading: isConfirmingJoin, isSuccess: isJoinSuccess } =
//     useWaitForTransactionReceipt({
//       hash: joinHash,
//     });

//   const joinPoll = (
//     nullifier: bigint,
//     publicKey: { x: bigint; y: bigint },
//     stateRootIndex: bigint,
//     proof: bigint[],
//     signUpPolicyData: `0x${string}`,
//     initialVoiceCreditProxyData: `0x${string}`
//   ) => {
//     if (!pollAddress) {
//       console.error("❌ Poll address is required");
//       return;
//     }

//     console.log("👤 Joining poll:", { nullifier, publicKey, stateRootIndex });

//     writeJoinPoll(
//       {
//         address: pollAddress,
//         abi: [
//           {
//             inputs: [
//               { internalType: "uint256", name: "_nullifier", type: "uint256" },
//               {
//                 components: [
//                   { internalType: "uint256", name: "x", type: "uint256" },
//                   { internalType: "uint256", name: "y", type: "uint256" },
//                 ],
//                 internalType: "struct DomainObjs.PublicKey",
//                 name: "_publicKey",
//                 type: "tuple",
//               },
//               { internalType: "uint256", name: "_stateRootIndex", type: "uint256" },
//               { internalType: "uint256[8]", name: "_proof", type: "uint256[8]" },
//               { internalType: "bytes", name: "_signUpPolicyData", type: "bytes" },
//               { internalType: "bytes", name: "_initialVoiceCreditProxyData", type: "bytes" },
//             ],
//             name: "joinPoll",
//             outputs: [],
//             stateMutability: "nonpayable",
//             type: "function",
//           },
//         ],
//         functionName: "joinPoll",
//         args: [
//           nullifier,
//           publicKey,
//           stateRootIndex,
//           proof,
//           signUpPolicyData,
//           initialVoiceCreditProxyData,
//         ],
//       },
//       {
//         onSuccess: (hash) => {
//           console.log("✅ Joined poll! Hash:", hash);
//           refetchTotalSignups();
//         },
//         onError: (error) => {
//           console.error("❌ Failed to join poll:", error);
//         },
//       }
//     );
//   };

//   // Utility functions
//   const padAndHashMessage = async (dataToPad: [bigint, bigint]) => {
//     if (!pollAddress || !publicClient) {
//       throw new Error("Poll address or public client not available");
//     }

//     const result = await publicClient.readContract({
//       address: pollAddress,
//       abi: [
//         {
//           inputs: [
//             { internalType: "uint256[2]", name: "dataToPad", type: "uint256[2]" },
//           ],
//           name: "padAndHashMessage",
//           outputs: [
//             {
//               components: [
//                 {
//                   internalType: "uint256[10]",
//                   name: "data",
//                   type: "uint256[10]",
//                 },
//               ],
//               internalType: "struct DomainObjs.Message",
//               name: "message",
//               type: "tuple",
//             },
//             {
//               components: [
//                 { internalType: "uint256", name: "x", type: "uint256" },
//                 { internalType: "uint256", name: "y", type: "uint256" },
//               ],
//               internalType: "struct DomainObjs.PublicKey",
//               name: "padKey",
//               type: "tuple",
//             },
//             { internalType: "uint256", name: "msgHash", type: "uint256" },
//           ],
//           stateMutability: "pure",
//           type: "function",
//         },
//       ],
//       functionName: "padAndHashMessage",
//       args: [dataToPad],
//     });

//     return {
//       message: result[0],
//       padKey: result[1],
//       msgHash: result[2],
//     };
//   };

//   const hashMessageAndPublicKey = async (
//     message: { data: bigint[] },
//     encryptionPublicKey: { x: bigint; y: bigint }
//   ) => {
//     if (!pollAddress || !publicClient) {
//       throw new Error("Poll address or public client not available");
//     }

//     const result = await publicClient.readContract({
//       address: pollAddress,
//       abi: [
//         {
//           inputs: [
//             {
//               components: [
//                 {
//                   internalType: "uint256[10]",
//                   name: "data",
//                   type: "uint256[10]",
//                 },
//               ],
//               internalType: "struct DomainObjs.Message",
//               name: "_message",
//               type: "tuple",
//             },
//             {
//               components: [
//                 { internalType: "uint256", name: "x", type: "uint256" },
//                 { internalType: "uint256", name: "y", type: "uint256" },
//               ],
//               internalType: "struct DomainObjs.PublicKey",
//               name: "_encryptionPublicKey",
//               type: "tuple",
//             },
//           ],
//           name: "hashMessageAndPublicKey",
//           outputs: [{ internalType: "uint256", name: "msgHash", type: "uint256" }],
//           stateMutability: "pure",
//           type: "function",
//         },
//       ],
//       functionName: "hashMessageAndPublicKey",
//       args: [message, encryptionPublicKey],
//     });

//     return result;
//   };

//   const refetchPollInfo = () => {
//     refetchStartDate();
//     refetchEndDate();
//     refetchNumMessages();
//     refetchTotalSignups();
//     refetchVoteOptions();
//     refetchCoordinatorKey();
//   };

//   return {
//     // Poll info
//     pollInfo: {
//       startDate: startDate || null,
//       endDate: endDate || null,
//       numMessages: numMessages || null,
//       totalSignups: totalSignups || null,
//       voteOptions: voteOptions || null,
//       coordinatorPublicKey: coordinatorPublicKey 
//         ? { x: coordinatorPublicKey[0], y: coordinatorPublicKey[1] }
//         : null,
//       isActive,
//     },
    
//     // Voting functions
//     publishMessage,
//     isPublishing: isPublishing || isConfirmingPublish,
//     isPublishSuccess,
//     publishHash,
//     publishError,

//     // Batch voting
//     publishMessageBatch,
//     isPublishingBatch: isPublishingBatch || isConfirmingBatch,
//     isBatchSuccess,
//     batchHash,
//     batchError,

//     // Join poll
//     joinPoll,
//     isJoining: isJoining || isConfirmingJoin,
//     isJoinSuccess,
//     joinHash,
//     joinError,

//     // Utility functions
//     padAndHashMessage,
//     hashMessageAndPublicKey,

//     // Refetch functions
//     refetchPollInfo,
//   };
// }