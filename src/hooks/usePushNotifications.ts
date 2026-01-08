import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

// Natively window interface
declare global {
  interface Window {
    natively?: {
      isNativeApp: boolean;
      getPushToken: () => Promise<{ token: string | null }>;
      getDeviceInfo: () => Promise<{
        platform: 'ios' | 'android';
        model?: string;
        osVersion?: string;
        appVersion?: string;
      }>;
      requestPushPermission: () => Promise<{ granted: boolean }>;
      onPushNotificationReceived?: (callback: (data: PushNotificationData) => void) => void;
      onDeepLink?: (callback: (url: string) => void) => void;
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
  const isNatively = typeof window !== 'undefined' && window.natively?.isNativeApp === true;

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

  // Request permission and get token from Natively
  const requestPermissionAndRegister = useCallback(async () => {
    if (!isNatively || !window.natively) {
      console.log("[PushNotifications] Not running in Natively, skipping");
      return false;
    }

    if (!user?.id) {
      console.log("[PushNotifications] No authenticated user, skipping");
      return false;
    }

    if (hasRegisteredRef.current) {
      console.log("[PushNotifications] Already registered, skipping");
      return true;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Request permission
      const permResult = await window.natively.requestPushPermission();
      if (!permResult.granted) {
        console.log("[PushNotifications] Permission denied");
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Push notification permission denied' 
        }));
        return false;
      }

      // Get token and device info
      const [tokenResult, deviceInfo] = await Promise.all([
        window.natively.getPushToken(),
        window.natively.getDeviceInfo(),
      ]);

      if (!tokenResult.token) {
        console.log("[PushNotifications] No token received");
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Failed to get push token' 
        }));
        return false;
      }

      // Register with Supabase
      return await registerToken(
        tokenResult.token,
        deviceInfo.platform,
        {
          model: deviceInfo.model,
          osVersion: deviceInfo.osVersion,
          appVersion: deviceInfo.appVersion,
        }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize push notifications';
      console.error("[PushNotifications] Init error:", message);
      setState(prev => ({ ...prev, error: message, isLoading: false }));
      return false;
    }
  }, [isNatively, user?.id, registerToken]);

  // Auto-register when user is authenticated and running in Natively
  useEffect(() => {
    if (isNatively && user?.id && !hasRegisteredRef.current) {
      // Small delay to ensure Natively bridge is ready
      const timer = setTimeout(() => {
        requestPermissionAndRegister();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isNatively, user?.id, requestPermissionAndRegister]);

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
