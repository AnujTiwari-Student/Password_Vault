export const getRoleBadgeColor = (role: string): string => {
  switch (role) {
    case "owner":
      return "bg-yellow-900/30 text-yellow-300 border-yellow-700/30 border";
    case "admin":
      return "bg-blue-900/30 text-blue-300 border-blue-700/30 border";
    case "member":
      return "bg-gray-700/50 text-gray-400";
    case "viewer":
      return "bg-purple-900/30 text-purple-300 border-purple-700/30 border";
    default:
      return "bg-gray-700/50 text-gray-400";
  }
};