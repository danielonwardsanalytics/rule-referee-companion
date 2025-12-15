import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface ActiveRuleSet {
  id: string;
  name: string;
  gameName: string;
  gameId: string;
}

interface ActiveTournament {
  id: string;
  name: string;
  gameName: string;
  gameId: string;
}

const STORAGE_KEY_RULESET = "active-rule-set-id";
const STORAGE_KEY_TOURNAMENT = "active-tournament-id";

export const useActiveContext = () => {
  const { user } = useAuth();
  const [activeRuleSetId, setActiveRuleSetId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_RULESET);
  });
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_TOURNAMENT);
  });

  // Fetch active rule set details
  const { data: activeRuleSet } = useQuery({
    queryKey: ["active-rule-set", activeRuleSetId],
    queryFn: async () => {
      if (!activeRuleSetId) return null;

      const { data, error } = await supabase
        .from("house_rule_sets")
        .select(`
          id,
          name,
          games:game_id (
            id,
            name
          )
        `)
        .eq("id", activeRuleSetId)
        .single();

      if (error) return null;
      return {
        id: data.id,
        name: data.name,
        gameName: data.games.name,
        gameId: data.games.id,
      } as ActiveRuleSet;
    },
    enabled: !!activeRuleSetId,
  });

  // Fetch active tournament details
  const { data: activeTournament } = useQuery({
    queryKey: ["active-tournament", activeTournamentId],
    queryFn: async () => {
      if (!activeTournamentId) return null;

      const { data, error } = await supabase
        .from("tournaments")
        .select(`
          id,
          name,
          games:game_id (
            id,
            name
          )
        `)
        .eq("id", activeTournamentId)
        .single();

      if (error) return null;
      return {
        id: data.id,
        name: data.name,
        gameName: data.games.name,
        gameId: data.games.id,
      } as ActiveTournament;
    },
    enabled: !!activeTournamentId,
  });

  // Fetch user's rule sets for selection
  const { data: userRuleSets = [] } = useQuery({
    queryKey: ["user-rule-sets-for-context", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("house_rule_sets")
        .select(`
          id,
          name,
          games:game_id (
            id,
            name
          )
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (error) return [];
      return data.map((rs) => ({
        id: rs.id,
        name: rs.name,
        gameName: rs.games.name,
        gameId: rs.games.id,
      })) as ActiveRuleSet[];
    },
    enabled: !!user,
  });

  // Fetch user's tournaments for selection
  const { data: userTournaments = [] } = useQuery({
    queryKey: ["user-tournaments-for-context", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("tournaments")
        .select(`
          id,
          name,
          games:game_id (
            id,
            name
          )
        `)
        .eq("admin_id", user.id)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (error) return [];
      return data.map((t) => ({
        id: t.id,
        name: t.name,
        gameName: t.games.name,
        gameId: t.games.id,
      })) as ActiveTournament[];
    },
    enabled: !!user,
  });

  const setActiveRuleSet = (ruleSetId: string | null) => {
    setActiveRuleSetId(ruleSetId);
    if (ruleSetId) {
      localStorage.setItem(STORAGE_KEY_RULESET, ruleSetId);
    } else {
      localStorage.removeItem(STORAGE_KEY_RULESET);
    }
  };

  const setActiveTournament = (tournamentId: string | null) => {
    setActiveTournamentId(tournamentId);
    if (tournamentId) {
      localStorage.setItem(STORAGE_KEY_TOURNAMENT, tournamentId);
    } else {
      localStorage.removeItem(STORAGE_KEY_TOURNAMENT);
    }
  };

  const clearActiveRuleSet = () => setActiveRuleSet(null);
  const clearActiveTournament = () => setActiveTournament(null);

  return {
    activeRuleSet,
    activeTournament,
    activeRuleSetId,
    activeTournamentId,
    userRuleSets,
    userTournaments,
    setActiveRuleSet,
    setActiveTournament,
    clearActiveRuleSet,
    clearActiveTournament,
  };
};
