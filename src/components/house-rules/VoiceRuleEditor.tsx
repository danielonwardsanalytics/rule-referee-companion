import { useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic } from "lucide-react";

interface VoiceRuleEditorProps {
  ruleSetId: string;
  gameName: string;
  currentRules: Array<{ id: string; rule_text: string; sort_order: number }>;
}

export const VoiceRuleEditor = ({ ruleSetId, gameName, currentRules }: VoiceRuleEditorProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVoiceCommand = async (command: string) => {
    if (!command.trim()) return;

    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-rule-command`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            command,
            ruleSetId,
            currentRules,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: "Premium Feature",
            description: result.message,
            variant: "destructive",
          });
          return result.message;
        }
        throw new Error(result.error || "Failed to process command");
      }

      // Invalidate queries to refresh the rules list
      queryClient.invalidateQueries({ queryKey: ["house-rules", ruleSetId] });
      queryClient.invalidateQueries({ queryKey: ["house-rule-sets"] });

      toast({
        title: "Success",
        description: result.message,
      });

      return result.message;
    } catch (error) {
      console.error("Voice command error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process voice command";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return "Sorry, I couldn't process that command. Please try again.";
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PremiumGate 
      feature="Voice Rule Editor"
      fallback={
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              <CardTitle>Voice Rule Editor</CardTitle>
            </div>
            <CardDescription>
              Create and edit house rules using voice commands
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Premium users can use natural language to manage their house rules:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>"Add a rule: no skipping turns"</li>
              <li>"Change rule 2 to draw 4 cards"</li>
              <li>"Remove rule 3"</li>
              <li>"Move rule 1 to position 3"</li>
            </ul>
          </CardContent>
        </Card>
      }
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            <CardTitle>Voice Rule Editor</CardTitle>
          </div>
          <CardDescription>
            Use voice commands to create and edit rules for {gameName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChatInterface 
            gameName={gameName}
            onVoiceCommand={handleVoiceCommand}
            isProcessingCommand={isProcessing}
            contextType="house-rules"
            contextId={ruleSetId}
          />
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs font-medium mb-2">Try these commands:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• "Add a rule: [your rule]"</li>
              <li>• "Change rule [number] to [new text]"</li>
              <li>• "Remove rule [number]"</li>
              <li>• "Move rule [number] to position [new position]"</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </PremiumGate>
  );
};
