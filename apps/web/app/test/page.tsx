// 'use client';
// import { useState } from 'react';
// import { useVoteProof } from './useHook'; // đường dẫn tới hook của bạn
// import type { VoteCircuitInput } from '../../../../packages/circuits/src/types';

// export default function VoteTest() {
//   const { proof, publicSignals, loading, generateProof } = useVoteProof();
//   const [formData, setFormData] = useState<VoteCircuitInput>({
//     privateKey: '',
//     vote: '0',
//     voiceCredits: '0',
//     nonce: '0',
//     pollId: '0',
//     pubkeyX: '0',
//     pubkeyY: '0',
//     voiceCreditBalance: '0',
//     voterIndex: '0',
//     voteCommitment: '0',
//     outcome: '0'
//   });

//   const handleChange = (field: keyof VoteCircuitInput, value: string) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//   };

//   return (
//     <div className="p-6 max-w-2xl mx-auto">
//       <h1 className="text-2xl font-bold mb-6">Vote Proof Generator Test</h1>

//       <div className="grid grid-cols-2 gap-4 mb-6">
//         {(Object.keys(formData) as (keyof VoteCircuitInput)[]).map((field) => (
//           <div key={String(field)}>
//             <label className="block text-sm font-medium mb-1 capitalize">{String(field)}</label>
//             <input
//               type="text"
//               value={String(formData[field] ?? '')}
//               onChange={e => handleChange(field, e.target.value)}
//               className="w-full p-2 border rounded"
//             />
//           </div>
//         ))}
//       </div>

//       <button
//         onClick={() => generateProof(formData)}
//         disabled={loading}
//         className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
//       >
//         {loading ? 'Generating...' : 'Generate Proof'}
//       </button>

//       {proof && (
//         <div className="mt-6">
//           <h2 className="text-xl font-semibold mb-3">Proof Generated Successfully!</h2>
//           <div className="bg-gray-100 p-4 rounded">
//             <pre className="text-sm overflow-auto">{JSON.stringify({ proof, publicSignals }, null, 2)}</pre>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
