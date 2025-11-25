import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Search, Star, Clock } from "lucide-react";
import { usePublicHouseRuleSets } from "@/hooks/usePublicHouseRuleSets";
import { useAllGames } from "@/hooks/useAllGames";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { PublicRuleSetCard } from "@/components/house-rules/PublicRuleSetCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PublicHouseRules = () => {
  const { data: ruleSets = [], isLoading, refetch } = usePublicHouseRuleSets();
  const { games } = useAllGames();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"popular" | "recent" | "alphabetical">("popular");
  const [savingRuleSetId, setSavingRuleSetId] = useState<string | null>(null);

  const handleSaveRuleSet = async (ruleSetId: string) => {
    setSavingRuleSetId(ruleSetId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the original rule set with rules
      const { data: originalRuleSet, error: fetchError } = await supabase
        .from("house_rule_sets")
        .select(`
          *,
          house_rules (*)
        `)
        .eq("id", ruleSetId)
        .single();

      if (fetchError) throw fetchError;

      // Create a copy in user's house rules
      const { data: newRuleSet, error: ruleSetError } = await supabase
        .from("house_rule_sets")
        .insert({
          user_id: user.id,
          game_id: originalRuleSet.game_id,
          name: `${originalRuleSet.name} (Copy)`,
          is_public: false,
          is_active: false,
        })
        .select()
        .single();

      if (ruleSetError) throw ruleSetError;

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
        title: "Rule Set Saved",
        description: "The rule set has been added to your house rules",
      });

      refetch();
    } catch (error) {
      console.error("Error saving rule set:", error);
      toast({
        title: "Error",
        description: "Failed to save rule set. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingRuleSetId(null);
    }
  };

  // Filter and sort rule sets
  const filteredAndSortedRuleSets = ruleSets
    .filter((ruleSet: any) => {
      const matchesSearch = ruleSet.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGame = selectedGame === "all" || ruleSet.game_id === selectedGame;
      return matchesSearch && matchesGame;
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case "popular":
          return (b.save_count || 0) - (a.save_count || 0);
        case "recent":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "alphabetical":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  // Categorize for tabs
  const popularRuleSets = [...filteredAndSortedRuleSets]
    .sort((a: any, b: any) => (b.save_count || 0) - (a.save_count || 0))
    .slice(0, 12);

  const recentRuleSets = [...filteredAndSortedRuleSets]
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 12);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Public House Rules</h1>
            <p className="text-muted-foreground mt-1">
              Discover and save community-created rule sets
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rule sets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedGame} onValueChange={setSelectedGame}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by game" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Games</SelectItem>
              {games?.map((game) => (
                <SelectItem key={game.id} value={game.id}>
                  {game.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSpinner size="lg" text="Loading public rules..." />
        ) : ruleSets.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No public rules yet"
            description="Be the first to share your house rules with the community"
          />
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">
                <BookOpen className="h-4 w-4 mr-2" />
                All ({filteredAndSortedRuleSets.length})
              </TabsTrigger>
              <TabsTrigger value="popular">
                <Star className="h-4 w-4 mr-2" />
                Popular
              </TabsTrigger>
              <TabsTrigger value="recent">
                <Clock className="h-4 w-4 mr-2" />
                Recent
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {filteredAndSortedRuleSets.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="No results found"
                  description="Try adjusting your search or filters"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAndSortedRuleSets.map((ruleSet: any) => (
                    <PublicRuleSetCard
                      key={ruleSet.id}
                      ruleSet={ruleSet}
                      onSave={handleSaveRuleSet}
                      isSaving={savingRuleSetId === ruleSet.id}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="popular" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularRuleSets.map((ruleSet: any) => (
                  <PublicRuleSetCard
                    key={ruleSet.id}
                    ruleSet={ruleSet}
                    onSave={handleSaveRuleSet}
                    isSaving={savingRuleSetId === ruleSet.id}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="recent" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentRuleSets.map((ruleSet: any) => (
                  <PublicRuleSetCard
                    key={ruleSet.id}
                    ruleSet={ruleSet}
                    onSave={handleSaveRuleSet}
                    isSaving={savingRuleSetId === ruleSet.id}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default PublicHouseRules;
