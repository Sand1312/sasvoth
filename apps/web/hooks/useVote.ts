// // hooks/useVote.ts
// import { usePoll } from "./usePollMaci";
// import { useState } from "react";

// interface UseVoteReturn {
//   // From usePoll
//   pollInfo: ReturnType<typeof usePoll>["pollInfo"];
//   publishMessage: ReturnType<typeof usePoll>["publishMessage"];
//   publishMessageBatch: ReturnType<typeof usePoll>["publishMessageBatch"];
//   isPublishing: boolean;
//   isPublishSuccess: boolean;
  
//   // Vote-specific functions
//   castVote: (
//     voteOption: number,
//     voteWeight: number,
//     nonce: number
//   ) => void;
//   castVoteBatch: (
//     votes: Array<{
//       voteOption: number;
//       voteWeight: number;
//       nonce: number;
//     }>
//   ) => void;
  
//   // State
//   userNonce: number;
//   refetchPollInfo: () => void;
// }

// export function useVote(pollAddress: `0x${string}` | null): UseVoteReturn {
//   const {
//     pollInfo,
//     publishMessage,
//     publishMessageBatch,
//     isPublishing,
//     isPublishSuccess,
//     refetchPollInfo,
//   } = usePoll(pollAddress);

//   const [userNonce, setUserNonce] = useState<number>(1);

//   const castVote = (
//     voteOption: number,
//     voteWeight: number,
//     nonce: number
//   ) => {
//     if (!pollInfo.coordinatorPublicKey) {
//       console.error("❌ Coordinator public key not available");
//       return;
//     }

//     // Tạo message data theo định dạng MACI
//     const messageData = [
//       BigInt(voteOption),    // voteOptionIndex
//       BigInt(0),             // second vote option
//       BigInt(voteWeight),    // vote weight
//       BigInt(nonce),         // nonce
//       BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0) // padding
//     ];

//     const message = {
//       data: messageData
//     };

//     console.log("🗳️ Casting vote:", {
//       voteOption,
//       voteWeight,
//       nonce,
//       messageData
//     });

//     publishMessage(message, pollInfo.coordinatorPublicKey);
//     setUserNonce(prev => prev + 1);
//   };

//   const castVoteBatch = (
//     votes: Array<{
//       voteOption: number;
//       voteWeight: number;
//       nonce: number;
//     }>
//   ) => {
//     if (!pollInfo.coordinatorPublicKey) {
//       console.error("❌ Coordinator public key not available");
//       return;
//     }

//     const messages = votes.map(vote => ({
//       data: [
//         BigInt(vote.voteOption),
//         BigInt(0),
//         BigInt(vote.voteWeight),
//         BigInt(vote.nonce),
//         BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)
//       ]
//     }));

//     const encryptionPublicKeys = Array(votes.length).fill(pollInfo.coordinatorPublicKey);

//     console.log("🗳️ Casting batch votes:", {
//       voteCount: votes.length,
//       messages
//     });

//     publishMessageBatch(messages, encryptionPublicKeys);
//     setUserNonce(prev => prev + votes.length);
//   };

//   return {
//     // From usePoll
//     pollInfo,
//     publishMessage,
//     publishMessageBatch,
//     isPublishing,
//     isPublishSuccess,
    
//     // Vote-specific functions
//     castVote,
//     castVoteBatch,
    
//     // State
//     userNonce,
//     refetchPollInfo,
//   };
// }