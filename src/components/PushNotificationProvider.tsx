import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePushNotifications } from "@/hooks/usePushNotifications";

/**
 * Provider component that initializes push notifications when running in Natively.
 * Also handles deep link navigation from push notifications.
 */
export const PushNotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { isNatively, isRegistered, error } = usePushNotifications();

  // Set up deep link handler for push notification taps
  useEffect(() => {
    if (!isNatively || typeof window === 'undefined' || !window.natively) return;

    const handleDeepLink = (url: string) => {
      console.log("[PushNotifications] Deep link received:", url);
      
      try {
        // Parse the deep link URL
        const parsedUrl = new URL(url);
        const path = parsedUrl.pathname;
        
        // Navigate to the path
        if (path && path !== '/') {
          navigate(path);
        }
      } catch (err) {
        console.error("[PushNotifications] Failed to parse deep link:", err);
        // Try as relative path if URL parsing fails
        if (url.startsWith('/')) {
          navigate(url);
        }
      }
    };

    // Register the deep link handler
    if (window.natively.onDeepLink) {
      window.natively.onDeepLink(handleDeepLink);
    }
  }, [isNatively, navigate]);

  // Log registration status for debugging
  useEffect(() => {
    if (isNatively) {
      if (isRegistered) {
        console.log("[PushNotifications] Successfully registered for push notifications");
      } else if (error) {
        console.warn("[PushNotifications] Registration failed:", error);
      }
    }
  }, [isNatively, isRegistered, error]);

  return <>{children}</>;
};
