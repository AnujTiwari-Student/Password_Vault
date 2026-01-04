// import React from 'react';
// import { Activity, Key, Lock, Shield } from 'lucide-react';

// interface SidebarProps {
//   activeTab: string;
//   setActiveTab: (tab: string) => void;
// }

// const navItems = [
//   { id: 'dashboard', icon: Activity, label: 'Dashboard' },
//   { id: 'vaults', icon: Lock, label: 'Vaults' },
//   { id: 'audit', icon: Shield, label: 'Audit Logs' },
//   { id: 'security', icon: Key, label: 'Security Center' }
// ];

// export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
//   return (
//     <aside className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen p-6">
//       <div className="mb-8">
//         <h1 className="text-2xl font-bold text-white flex items-center gap-2">
//           <Shield className="text-blue-400" />
//           SecureVault
//         </h1>
//       </div>

//       <nav className="space-y-2">
//         {navItems.map(item => (
//           <button
//             key={item.id}
//             onClick={() => setActiveTab(item.id)}
//             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
//               activeTab === item.id
//                 ? 'bg-blue-600 text-white'
//                 : 'text-gray-400 hover:bg-gray-700 hover:text-white'
//             }`}
//           >
//             <item.icon size={20} />
//             <span className="font-medium">{item.label}</span>
//           </button>
//         ))}
//       </nav>
//     </aside>
//   );
// };