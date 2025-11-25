import { Loader2, Users, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePublicHouseRuleSets } from "@/hooks/usePublicHouseRuleSets";
import { useAllGames } from "@/hooks/useAllGames";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function PublicHouseRules() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: ruleSets, isLoading } = usePublicHouseRuleSets();
  const { games } = useAllGames();

  const handleFork = async (ruleSetId: string, ruleSetName: string, gameId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to fork house rules",
        variant: "destructive",
      });
      return;
    }

    try {
      // Fetch the original rule set with its rules
      const { data: originalRuleSet, error: fetchError } = await supabase
        .from("house_rule_sets")
        .select(`
          *,
          house_rules (*)
        `)
        .eq("id", ruleSetId)
        .single();

      if (fetchError) throw fetchError;

      // Create new rule set
      const { data: newRuleSet, error: createError } = await supabase
        .from("house_rule_sets")
        .insert({
          user_id: user.id,
          game_id: gameId,
          name: `${ruleSetName} (Copy)`,
          is_public: false,
          is_active: false,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Copy all rules
      if (originalRuleSet.house_rules && originalRuleSet.house_rules.length > 0) {
        const rulesToInsert = originalRuleSet.house_rules.map((rule: any) => ({
          rule_set_id: newRuleSet.id,
          rule_text: rule.rule_text,
          sort_order: rule.sort_order,
        }));

        const { error: rulesError } = await supabase
          .from("house_rules")
          .insert(rulesToInsert);

        if (rulesError) throw rulesError;
      }

      // Increment save count on original
      const { error: updateError } = await supabase
        .from("house_rule_sets")
        .update({ save_count: (originalRuleSet.save_count || 0) + 1 })
        .eq("id", ruleSetId);

      if (updateError) throw updateError;

      toast({
        title: "House rules forked!",
        description: "You can now customize your copy",
      });

      navigate(`/house-rules/${newRuleSet.id}`);
    } catch (error) {
      console.error("Error forking house rules:", error);
      toast({
        title: "Error",
        description: "Failed to fork house rules",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const ruleSetsByGame = ruleSets?.reduce((acc: any, ruleSet: any) => {
    const gameId = ruleSet.game_id;
    if (!acc[gameId]) acc[gameId] = [];
    acc[gameId].push(ruleSet);
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Public House Rules</h1>
        <p className="text-muted-foreground">
          Browse and fork popular house rules created by the community (50+ saves)
        </p>
      </div>

      {!ruleSets || ruleSets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground mb-2">No public house rules yet</p>
            <p className="text-sm text-muted-foreground">
              Be the first to create and share popular house rules!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(ruleSetsByGame || {}).map(([gameId, sets]: [string, any]) => {
            const game = games?.find((g) => g.id === gameId);
            return (
              <div key={gameId}>
                <div className="flex items-center gap-3 mb-4">
                  {game?.image_url && (
                    <img
                      src={game.image_url}
                      alt={game.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <h2 className="text-2xl font-semibold">{game?.name || "Unknown Game"}</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sets.map((ruleSet: any) => (
                    <Card key={ruleSet.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{ruleSet.name}</CardTitle>
                            <CardDescription className="mt-1">
                              Created {new Date(ruleSet.created_at).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="gap-1">
                            <Users className="h-3 w-3" />
                            {ruleSet.save_count || 0}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => handleFork(ruleSet.id, ruleSet.name, ruleSet.game_id)}
                          className="w-full gap-2"
                          variant="outline"
                        >
                          <Copy className="h-4 w-4" />
                          Fork to My Rules
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
