import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// Natively SDK interface - v2.20.0
declare global {
  interface Window {
    natively?: {
      isNativeApp: boolean;
    };
    NativelyNotifications?: new () => {
      getOneSignalId: (callback: (response: { player_id: string | null }) => void) => void;
      requestPermission: (fallbackToSettings: boolean, callback: (response: { status: string }) => void) => void;
      getPermissionStatus: (callback: (response: { status: string }) => void) => void;
    };
    NativelyInfo?: new () => {
      getDeviceData: (callback: (response: { 
        platform: string; 
        model: string; 
        os_version: string;
        app_version?: string;
      }) => void) => void;
    };
  }
}

interface PushNotificationData {
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}

interface PushTokenState {
  playerId: string | null;
  platform: 'ios' | 'android' | 'web' | null;
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
}

// Check if running in Natively environment
const checkIsNatively = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.natively?.isNativeApp === true || typeof window.NativelyNotifications !== 'undefined';
};

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [state, setState] = useState<PushTokenState>({
    playerId: null,
    platform: null,
    isRegistered: false,
    isLoading: false,
    error: null,
  });
  
  const hasRegisteredRef = useRef(false);
  const isNatively = checkIsNatively();

  // Register push token with Supabase
  const registerToken = useCallback(async (
    playerId: string,
    platform: 'ios' | 'android' | 'web',
    deviceInfo?: {
      model?: string;
      osVersion?: string;
      appVersion?: string;
    }
  ) => {
    if (!user?.id) {
      console.log("[PushNotifications] No user, skipping token registration");
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Upsert the token (update if exists, insert if not)
      const { error } = await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: user.id,
          player_id: playerId,
          platform,
          device_model: deviceInfo?.model,
          os_version: deviceInfo?.osVersion,
          app_version: deviceInfo?.appVersion,
          is_active: true,
          last_seen_at: new Date().toISOString(),
          environment: import.meta.env.MODE === 'production' ? 'production' : 'development',
        }, {
          onConflict: 'user_id,player_id',
        });

      if (error) throw error;

      console.log("[PushNotifications] Token registered successfully:", playerId);
      setState(prev => ({
        ...prev,
        playerId,
        platform,
        isRegistered: true,
        isLoading: false,
      }));
      
      hasRegisteredRef.current = true;
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to register push token';
      console.error("[PushNotifications] Registration error:", message);
      setState(prev => ({ ...prev, error: message, isLoading: false }));
      return false;
    }
  }, [user?.id]);

  // Deactivate token on logout
  const deactivateToken = useCallback(async () => {
    if (!state.playerId || !user?.id) return;

    try {
      await supabase
        .from('user_push_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('player_id', state.playerId);

      console.log("[PushNotifications] Token deactivated");
      setState(prev => ({ ...prev, isRegistered: false }));
      hasRegisteredRef.current = false;
    } catch (err) {
      console.error("[PushNotifications] Deactivation error:", err);
    }
  }, [state.playerId, user?.id]);

  // Request permission and get OneSignal ID from Natively SDK
  const requestPermissionAndRegister = useCallback(async (): Promise<{ 
    success: boolean; 
    rawOneSignalId?: string | null;
    rawPermissionStatus?: string;
    rawDeviceData?: object;
  }> => {
    const currentIsNatively = checkIsNatively();
    
    if (!currentIsNatively) {
      console.log("[PushNotifications] Not running in Natively, skipping");
      return { success: false };
    }

    if (!user?.id) {
      console.log("[PushNotifications] No authenticated user, skipping");
      return { success: false };
    }

    if (hasRegisteredRef.current) {
      console.log("[PushNotifications] Already registered, skipping");
      return { success: true };
    }

    if (!window.NativelyNotifications) {
      console.log("[PushNotifications] NativelyNotifications not available");
      setState(prev => ({ ...prev, error: 'NativelyNotifications class not found' }));
      return { success: false };
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const notifications = new window.NativelyNotifications();

      // Request permission using callback-based API
      const permResult = await new Promise<{ status: string }>((resolve) => {
        notifications.requestPermission(true, (response) => {
          console.log("[PushNotifications] Permission response:", response);
          resolve(response);
        });
      });

      if (permResult.status !== 'granted' && permResult.status !== 'authorized') {
        console.log("[PushNotifications] Permission denied:", permResult.status);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: `Push permission: ${permResult.status}` 
        }));
        return { success: false, rawPermissionStatus: permResult.status };
      }

      // Get OneSignal player ID
      const oneSignalResult = await new Promise<{ player_id: string | null }>((resolve) => {
        notifications.getOneSignalId((response) => {
          console.log("[PushNotifications] OneSignal ID response:", response);
          resolve(response);
        });
      });

      if (!oneSignalResult.player_id) {
        console.log("[PushNotifications] No OneSignal player ID received");
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Failed to get OneSignal player ID' 
        }));
        return { success: false, rawOneSignalId: null, rawPermissionStatus: permResult.status };
      }

      // Get device info
      let deviceData: { platform: string; model: string; os_version: string; app_version?: string } = {
        platform: 'ios',
        model: 'unknown',
        os_version: 'unknown',
      };

      if (window.NativelyInfo) {
        const info = new window.NativelyInfo();
        deviceData = await new Promise((resolve) => {
          info.getDeviceData((response) => {
            console.log("[PushNotifications] Device data response:", response);
            resolve(response);
          });
        });
      }

      // Normalize platform
      const platform = deviceData.platform?.toLowerCase() === 'android' ? 'android' : 'ios';

      // Register with Supabase
      const success = await registerToken(
        oneSignalResult.player_id,
        platform,
        {
          model: deviceData.model,
          osVersion: deviceData.os_version,
          appVersion: deviceData.app_version,
        }
      );

      return { 
        success, 
        rawOneSignalId: oneSignalResult.player_id,
        rawPermissionStatus: permResult.status,
        rawDeviceData: deviceData,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize push notifications';
      console.error("[PushNotifications] Init error:", message);
      setState(prev => ({ ...prev, error: message, isLoading: false }));
      return { success: false };
    }
  }, [user?.id, registerToken]);

  // Auto-register when user is authenticated and running in Natively
  useEffect(() => {
    if (checkIsNatively() && user?.id && !hasRegisteredRef.current) {
      // Small delay to ensure Natively bridge is ready
      const timer = setTimeout(() => {
        requestPermissionAndRegister();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user?.id, requestPermissionAndRegister]);

  // Update last_seen_at periodically when app is active
  useEffect(() => {
    if (!state.isRegistered || !user?.id || !state.playerId) return;

    const updateLastSeen = async () => {
      try {
        await supabase
          .from('user_push_tokens')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('player_id', state.playerId);
      } catch (err) {
        console.error("[PushNotifications] Failed to update last_seen:", err);
      }
    };

    // Update every 5 minutes
    const interval = setInterval(updateLastSeen, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [state.isRegistered, state.playerId, user?.id]);

  return {
    isNatively,
    playerId: state.playerId,
    platform: state.platform,
    isRegistered: state.isRegistered,
    isLoading: state.isLoading,
    error: state.error,
    requestPermissionAndRegister,
    deactivateToken,
  };
};
