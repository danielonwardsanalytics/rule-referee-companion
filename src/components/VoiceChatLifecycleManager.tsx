import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

// Global registry for active voice chat instances
export const voiceChatRegistry = {
  instance: null as { disconnect: () => void } | null,
  
  register(instance: { disconnect: () => void }) {
    console.log("[VoiceChatLifecycle] Registering voice chat instance");
    this.instance = instance;
  },
  
  unregister() {
    console.log("[VoiceChatLifecycle] Unregistering voice chat instance");
    this.instance = null;
  },
  
  disconnectAll() {
    if (this.instance) {
      console.log("[VoiceChatLifecycle] Force disconnecting active voice chat");
      try {
        this.instance.disconnect();
      } catch (e) {
        console.error("[VoiceChatLifecycle] Error during force disconnect:", e);
      }
      this.instance = null;
    }
  }
};

interface VoiceChatLifecycleManagerProps {
  children: React.ReactNode;
}

export function VoiceChatLifecycleManager({ children }: VoiceChatLifecycleManagerProps) {
  useEffect(() => {
    // Handle web browser visibility changes (tab hidden, window minimized)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        console.log("[VoiceChatLifecycle] Visibility changed to hidden, disconnecting");
        voiceChatRegistry.disconnectAll();
      }
    };

    // Handle page unload/close
    const handleBeforeUnload = () => {
      console.log("[VoiceChatLifecycle] Page unloading, disconnecting");
      voiceChatRegistry.disconnectAll();
    };

    // Handle page hide (more reliable on mobile)
    const handlePageHide = () => {
      console.log("[VoiceChatLifecycle] Page hidden, disconnecting");
      voiceChatRegistry.disconnectAll();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    // Handle native app state changes (Capacitor) - dynamically import to avoid build issues
    let appStateCleanup: (() => void) | null = null;
    
    if (Capacitor.isNativePlatform()) {
      console.log("[VoiceChatLifecycle] Setting up native app state listener");
      
      // Dynamic import to avoid build errors when @capacitor/app is not installed
      import("@capacitor/app").then(({ App }) => {
        App.addListener("appStateChange", ({ isActive }) => {
          if (!isActive) {
            console.log("[VoiceChatLifecycle] App became inactive, disconnecting");
            voiceChatRegistry.disconnectAll();
          }
        }).then(listener => {
          appStateCleanup = () => listener.remove();
        }).catch(err => {
          console.error("[VoiceChatLifecycle] Failed to add app state listener:", err);
        });
      }).catch(err => {
        console.warn("[VoiceChatLifecycle] @capacitor/app not available:", err);
      });
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
      appStateCleanup?.();
    };
  }, []);

  return <>{children}</>;
}
