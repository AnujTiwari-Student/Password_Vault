// import React, { useState, useEffect } from 'react';
// import { AlertTriangle, Users, User, Shield, Building } from 'lucide-react';
// import { Vault, User as UserType } from '@/types/vault';
// import { toast } from 'sonner';

// interface VaultTypeConverterProps {
//   vault: Vault;
//   user: UserType;
// }

// export const VaultTypeConverter: React.FC<VaultTypeConverterProps> = ({ vault, user }) => {
//   const [showConverter, setShowConverter] = useState<boolean>(false);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [memberCount, setMemberCount] = useState<number>(0);

//   useEffect(() => {
//     const fetchMemberCount = async (): Promise<void> => {
//       if (!vault.org_id) return;
      
//       try {
//         const response = await fetch(`/api/org/${vault.org_id}/members/count`);
//         if (response.ok) {
//           const data = await response.json();
//           setMemberCount(data.count || 0);
//         }
//       } catch (error) {
//         console.error('Failed to fetch member count:', error);
//       }
//     };

//     if (vault.type === 'org' && vault.org_id) {
//       fetchMemberCount();
//     } else {
//       setMemberCount(1);
//     }
//   }, [vault.org_id, vault.type]);

//   const handleConvert = async (): Promise<void> => {
//     const targetType = vault.type === 'personal' ? 'org' : 'personal';
    
//     if (vault.type === 'org' && memberCount > 1) {
//       toast.error('Please remove all members except yourself before converting to personal vault');
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await fetch(`/api/vault/${vault.id}/convert`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ targetType })
//       });

//       const data = await response.json();

//       if (response.ok) {
//         toast.success(data.message || `Vault converted to ${targetType} successfully`);
//         setTimeout(() => window.location.reload(), 1500);
//       } else {
//         throw new Error(data.error || 'Failed to convert vault');
//       }
//     } catch (error: any) {
//       console.error('Error converting vault:', error);
//       toast.error(error.message || 'Failed to convert vault');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const canConvert = vault.type === 'personal' || (vault.type === 'org' && memberCount <= 1);
//   const targetType = vault.type === 'personal' ? 'Organization' : 'Personal';
//   const targetIcon = vault.type === 'personal' ? Building : User;
//   const TargetIcon = targetIcon;

//   return (
//     <div className="bg-gray-800/30 rounded-xl p-4 md:p-6 border border-gray-700/30">
//       <h3 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
//         <Shield className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
//         Vault Type Conversion
//       </h3>
      
//       <div className="space-y-4">
//         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 md:p-4 bg-gray-700/30 rounded-lg">
//           <div className="flex items-center gap-3 min-w-0 flex-shrink">
//             {vault.type === 'org' ? (
//               <Users className="w-4 h-4 md:w-5 md:h-5 text-purple-400 flex-shrink-0" />
//             ) : (
//               <User className="w-4 h-4 md:w-5 md:h-5 text-blue-400 flex-shrink-0" />
//             )}
//             <div className="min-w-0">
//               <p className="font-medium text-white text-sm md:text-base">
//                 {vault.type === 'org' ? 'Organization Vault' : 'Personal Vault'}
//               </p>
//               <p className="text-xs md:text-sm text-gray-400">
//                 {vault.type === 'org' 
//                   ? `Shared with ${memberCount} member${memberCount !== 1 ? 's' : ''}`
//                   : 'Private vault for personal use'}
//               </p>
//             </div>
//           </div>
//           <button
//             onClick={() => setShowConverter(!showConverter)}
//             className="px-3 md:px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-lg transition-colors text-sm md:text-base flex-shrink-0 flex items-center gap-2"
//           >
//             <TargetIcon className="w-4 h-4" />
//             Convert to {targetType}
//           </button>
//         </div>

//         {showConverter && (
//           <div className="p-3 md:p-6 bg-yellow-900/10 border border-yellow-700/30 rounded-lg space-y-4">
//             <div className="flex items-start gap-3">
//               <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
//               <div className="space-y-2 min-w-0">
//                 <p className="text-yellow-300 font-medium text-sm md:text-base">
//                   Warning: Convert to {targetType} Vault
//                 </p>
//                 <p className="text-xs md:text-sm text-gray-300">
//                   {vault.type === 'personal' 
//                     ? 'Converting to an organization vault will create a new organization and allow you to invite team members to collaborate. You can share credentials and manage permissions.'
//                     : 'Converting to a personal vault will remove all organization members and transfer ownership to you personally. This action cannot be undone easily.'}
//                 </p>
//               </div>
//             </div>

//             {vault.type === 'org' && !canConvert && (
//               <div className="bg-red-900/20 border border-red-700/30 rounded p-3">
//                 <p className="text-red-300 text-xs md:text-sm">
//                   <strong>Cannot convert:</strong> Please remove {memberCount - 1} other member{memberCount - 1 !== 1 ? 's' : ''} 
//                   from the organization before converting to personal vault.
//                 </p>
//               </div>
//             )}

//             <div className="space-y-2">
//               <p className="text-xs md:text-sm text-gray-300 font-medium">
//                 {vault.type === 'personal' ? 'What will happen:' : 'Requirements:'}
//               </p>
//               <ul className="text-xs md:text-sm text-gray-400 space-y-1 ml-4">
//                 {vault.type === 'personal' ? (
//                   <>
//                     <li className="flex items-center gap-2 text-gray-300">
//                       ✓ A new organization will be created
//                     </li>
//                     <li className="flex items-center gap-2 text-gray-300">
//                       ✓ You will become the organization owner
//                     </li>
//                     <li className="flex items-center gap-2 text-gray-300">
//                       ✓ You can invite team members after conversion
//                     </li>
//                     <li className="flex items-center gap-2 text-gray-300">
//                       ✓ All your existing items will be preserved
//                     </li>
//                   </>
//                 ) : (
//                   <>
//                     <li className={`flex items-center gap-2 ${canConvert ? 'text-green-400' : 'text-red-400'}`}>
//                       {canConvert ? '✓' : '✗'} Only you should be a member (currently: {memberCount} member{memberCount !== 1 ? 's' : ''})
//                     </li>
//                     <li className="flex items-center gap-2 text-green-400">
//                       ✓ You are the vault owner
//                     </li>
//                     <li className="flex items-center gap-2 text-gray-300">
//                       • All items will be transferred to your personal vault
//                     </li>
//                   </>
//                 )}
//               </ul>
//             </div>

//             <div className="flex flex-col sm:flex-row gap-3">
//               <button
//                 onClick={handleConvert}
//                 disabled={!canConvert || loading}
//                 className="px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800/50 disabled:cursor-not-allowed disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
//               >
//                 {loading ? (
//                   <>
//                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
//                     Converting...
//                   </>
//                 ) : (
//                   <>
//                     <TargetIcon className="w-4 h-4" />
//                     Convert to {targetType}
//                   </>
//                 )}
//               </button>
//               <button
//                 onClick={() => setShowConverter(false)}
//                 disabled={loading}
//                 className="px-3 md:px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg transition-colors text-sm md:text-base"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };
