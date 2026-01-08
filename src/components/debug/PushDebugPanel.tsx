import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bug, RefreshCw, Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const PushDebugPanel = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [lastUpsertResult, setLastUpsertResult] = useState<{
    success: boolean;
    message: string;
    timestamp: string;
  } | null>(null);
  
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
  useState(() => {
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
  });

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
  });

  const handleForceRegister = async () => {
    console.log("[PushDebugPanel] Force registering push token...");
    setLastUpsertResult(null);
    
    try {
      const success = await requestPermissionAndRegister();
      const result = {
        success,
        message: success 
          ? "Token registered successfully" 
          : error || "Registration failed - check if running in Natively",
        timestamp: new Date().toISOString(),
      };
      setLastUpsertResult(result);
      console.log("[PushDebugPanel] Registration result:", result);
    } catch (err) {
      const result = {
        success: false,
        message: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
      setLastUpsertResult(result);
      console.error("[PushDebugPanel] Registration error:", result);
    }
  };

  return (
    <Card className="border-dashed border-2 border-yellow-500/50 bg-yellow-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bug className="h-4 w-4" />
          Push Notification Debug Panel
          <Badge variant="outline" className="ml-auto text-xs">
            {debugMode ? "?debug=1" : "admin"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* Status Grid */}
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
            <div>
              <div className="font-medium">
                {lastUpsertResult.success ? "Success" : "Failed"}
              </div>
              <div className="text-xs opacity-80">{lastUpsertResult.message}</div>
              <div className="text-xs opacity-50 mt-1">
                {new Date(lastUpsertResult.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* Force Register Button */}
        <Button
          onClick={handleForceRegister}
          disabled={isLoading}
          size="sm"
          className="w-full"
          variant="outline"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Force Register Push Token
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          {isNatively 
            ? "Running in Natively - registration should work" 
            : "Not running in Natively - registration will be skipped"}
        </p>
      </CardContent>
    </Card>
  );
};
