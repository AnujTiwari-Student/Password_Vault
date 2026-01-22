import React, { useState, useEffect } from "react";
import axios from "axios";

export const NotificationIndicator: React.FC = () => {
  const [hasNotifications, setHasNotifications] = useState<boolean>(false);

  useEffect(() => {
    checkNotifications();
    const interval = setInterval(checkNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkNotifications = async (): Promise<void> => {
    try {
      const response = await axios.get("/api/invites");
      if (response.data.success) {
        const invitations = response.data.data.invitations || [];
        setHasNotifications(invitations.length > 0);
      }
    } catch (error) {
      console.error("Failed to check notifications:", error);
    }
  };

  if (!hasNotifications) {
    return null;
  }

  return (
    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm animate-pulse"></span>
  );
};