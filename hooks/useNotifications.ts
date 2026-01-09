import { useState, useEffect } from "react";
import axios from "axios";

export const useNotifications = () => {
  const [hasNotifications, setHasNotifications] = useState<boolean>(false);
  const [notificationCount, setNotificationCount] = useState<number>(0);

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
        setNotificationCount(invitations.length);
      }
    } catch (error) {
      console.error("Failed to check notifications:", error);
    }
  };

  return { hasNotifications, notificationCount, refresh: checkNotifications };
};