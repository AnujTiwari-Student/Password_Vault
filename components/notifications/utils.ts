export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
};

export const formatExpiresAt = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `Expires in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
  } else if (diffHours > 0) {
    return `Expires in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
  } else {
    return "Expires soon";
  }
};

export const getRoleBadgeClass = (role: string): string => {
  switch (role) {
    case "owner":
      return "bg-yellow-900/30 text-yellow-300";
    case "admin":
      return "bg-blue-900/30 text-blue-300";
    default:
      return "bg-gray-700/50 text-gray-400";
  }
};