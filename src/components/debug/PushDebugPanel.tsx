import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bug, RefreshCw, Check, X, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SdkGlobals {
  hasNatively: boolean;
  hasNativelyNotifications: boolean;
  hasNativelyInfo: boolean;
  rawOneSignalId: string | null;
  rawPermissionStatus: string | null;
}

export const PushDebugPanel = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [lastUpsertResult, setLastUpsertResult] = useState<{
    success: boolean;
    message: string;
    timestamp: string;
    rawData?: object;
  } | null>(null);
  
  const [sdkGlobals, setSdkGlobals] = useState<SdkGlobals>({
    hasNatively: false,
    hasNativelyNotifications: false,
    hasNativelyInfo: false,
    rawOneSignalId: null,
    rawPermissionStatus: null,
  });
  
  const {
    isNatively,
    playerId,
    platform,
    isRegistered,
    isLoading,
    error,
    requestPermissionAndRegister,
  } = usePushNotifications();

  // Check if debug mode is enabled
  const debugMode = searchParams.get("debug") === "1";

  // Check admin status on mount
  useEffect(() => {
    if (user?.id) {
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single()
        .then(({ data }) => {
          setIsAdmin(!!data);
        });
    }
  }, [user?.id]);

  // Check SDK globals
  const refreshSdkStatus = useCallback(() => {
    const globals: SdkGlobals = {
      hasNatively: typeof window !== 'undefined' && !!window.natively,
      hasNativelyNotifications: typeof window !== 'undefined' && typeof window.NativelyNotifications !== 'undefined',
      hasNativelyInfo: typeof window !== 'undefined' && typeof window.NativelyInfo !== 'undefined',
      rawOneSignalId: null,
      rawPermissionStatus: null,
    };

    // Try to get raw OneSignal ID if available
    if (globals.hasNativelyNotifications && window.NativelyNotifications) {
      try {
        const notifications = new window.NativelyNotifications();
        notifications.getOneSignalId((response) => {
          setSdkGlobals(prev => ({ ...prev, rawOneSignalId: response.player_id }));
        });
        notifications.getPermissionStatus((response) => {
          setSdkGlobals(prev => ({ ...prev, rawPermissionStatus: response.status }));
        });
      } catch (e) {
        console.error("[PushDebugPanel] Error getting SDK values:", e);
      }
    }

    setSdkGlobals(globals);
  }, []);

  // Check SDK globals on mount and when visibility changes
  useEffect(() => {
    refreshSdkStatus();
    
    // Also refresh when the page becomes visible (app foregrounded)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSdkStatus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshSdkStatus]);

  // Only show if debug=1 or user is admin
  if (!debugMode && !isAdmin) {
    return null;
  }

  // Log values to console
  console.log("[PushDebugPanel] Debug values:", {
    isNatively,
    userId: user?.id,
    playerId,
    platform,
    isRegistered,
    isLoading,
    error,
    sdkGlobals,
  });

  const handleForceRegister = async () => {
    console.log("[PushDebugPanel] Force registering push token...");
    setLastUpsertResult(null);
    
    try {
      const result = await requestPermissionAndRegister();
      const upsertResult = {
        success: result.success,
        message: result.success 
          ? `Token registered: ${result.rawOneSignalId}` 
          : error || "Registration failed - check SDK globals",
        timestamp: new Date().toISOString(),
        rawData: result,
      };
      setLastUpsertResult(upsertResult);
      console.log("[PushDebugPanel] Registration result:", upsertResult);
      
      // Refresh SDK status after registration attempt
      refreshSdkStatus();
    } catch (err) {
      const upsertResult = {
        success: false,
        message: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
      setLastUpsertResult(upsertResult);
      console.error("[PushDebugPanel] Registration error:", upsertResult);
    }
  };

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4 pointer-events-none">
      <div className="max-w-7xl mx-auto pointer-events-auto">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <Card className="border-dashed border-2 border-yellow-500/50 bg-yellow-500/10 backdrop-blur-sm shadow-lg">
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-2 cursor-pointer hover:bg-yellow-500/5 transition-colors">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  Push Notification Debug Panel
                  <Badge variant="outline" className="ml-2 text-xs">
                    {debugMode ? "?debug=1" : "admin"}
                  </Badge>
                  <span className="ml-auto">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </span>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="space-y-3 text-sm pt-0">
                {/* SDK Globals Section */}
                <div className="text-xs font-medium text-muted-foreground mb-1">SDK Globals</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">natively</span>
                    <Badge variant={sdkGlobals.hasNatively ? "default" : "secondary"} className="text-[10px]">
                      {sdkGlobals.hasNatively ? "✓" : "✗"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Notifications</span>
                    <Badge variant={sdkGlobals.hasNativelyNotifications ? "default" : "secondary"} className="text-[10px]">
                      {sdkGlobals.hasNativelyNotifications ? "✓" : "✗"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">Info</span>
                    <Badge variant={sdkGlobals.hasNativelyInfo ? "default" : "secondary"} className="text-[10px]">
                      {sdkGlobals.hasNativelyInfo ? "✓" : "✗"}
                    </Badge>
                  </div>
                </div>

                {/* Raw SDK Values */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">raw getOneSignalId</span>
                    <code className="text-[10px] font-mono truncate max-w-[80px]">
                      {sdkGlobals.rawOneSignalId || "null"}
                    </code>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">raw permStatus</span>
                    <code className="text-[10px] font-mono">
                      {sdkGlobals.rawPermissionStatus || "null"}
                    </code>
                  </div>
                </div>

                {/* Status Grid */}
                <div className="text-xs font-medium text-muted-foreground mb-1 mt-3">Hook State</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">isNatively</span>
                    <Badge variant={isNatively ? "default" : "secondary"}>
                      {isNatively ? "true" : "false"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">isRegistered</span>
                    <Badge variant={isRegistered ? "default" : "secondary"}>
                      {isRegistered ? "true" : "false"}
                    </Badge>
                  </div>
                  
                  <div className="col-span-2 flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">user.id</span>
                    <code className="text-xs font-mono truncate max-w-[200px]">
                      {user?.id || "null"}
                    </code>
                  </div>
                  
                  <div className="col-span-2 flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">playerId (OneSignal)</span>
                    <code className="text-xs font-mono truncate max-w-[200px]">
                      {playerId || "null"}
                    </code>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">platform</span>
                    <Badge variant="outline">{platform || "null"}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-muted-foreground">isLoading</span>
                    <Badge variant={isLoading ? "default" : "secondary"}>
                      {isLoading ? "true" : "false"}
                    </Badge>
                  </div>
                </div>

                {/* Error display */}
                {error && (
                  <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-xs">
                    <strong>Error:</strong> {error}
                  </div>
                )}

                {/* Last upsert result */}
                {lastUpsertResult && (
                  <div className={`p-2 rounded text-xs flex items-start gap-2 ${
                    lastUpsertResult.success 
                      ? "bg-green-500/10 border border-green-500/20 text-green-600" 
                      : "bg-destructive/10 border border-destructive/20 text-destructive"
                  }`}>
                    {lastUpsertResult.success ? (
                      <Check className="h-4 w-4 shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        {lastUpsertResult.success ? "Success" : "Failed"}
                      </div>
                      <div className="text-xs opacity-80 break-all">{lastUpsertResult.message}</div>
                      {lastUpsertResult.rawData && (
                        <details className="mt-1">
                          <summary className="text-[10px] opacity-50 cursor-pointer">Raw response</summary>
                          <pre className="text-[10px] opacity-50 mt-1 overflow-auto max-h-20">
                            {JSON.stringify(lastUpsertResult.rawData, null, 2)}
                          </pre>
                        </details>
                      )}
                      <div className="text-xs opacity-50 mt-1">
                        {new Date(lastUpsertResult.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleForceRegister}
                    disabled={isLoading}
                    size="sm"
                    className="flex-1"
                    variant="outline"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Force Register
                  </Button>
                  <Button
                    onClick={refreshSdkStatus}
                    size="sm"
                    variant="ghost"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                  {isNatively 
                    ? "Running in Natively - registration should work" 
                    : "Not running in Natively wrapper (SDK globals not detected)"}
                </p>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
};
