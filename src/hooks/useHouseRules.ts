import { useState, useEffect } from "react";

export interface HouseRuleSection {
  title: string;
  content: string;
}

export interface HouseRule {
  id: string;
  gameId: string;
  name: string;
  sections: HouseRuleSection[];
  createdBy: "user" | "external";
  source: "user" | "external";
  updatedAt: string;
}

const STORAGE_KEY = "house_rules";

export const useHouseRules = () => {
  const [rules, setRules] = useState<HouseRule[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setRules(JSON.parse(stored));
    }
  }, []);

  const saveRules = (newRules: HouseRule[]) => {
    setRules(newRules);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRules));
  };

  const createRule = (rule: Omit<HouseRule, "id" | "updatedAt">) => {
    const newRule: HouseRule = {
      ...rule,
      id: `hr_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    saveRules([...rules, newRule]);
    return newRule;
  };

  const updateRule = (id: string, updates: Partial<HouseRule>) => {
    const newRules = rules.map((rule) =>
      rule.id === id
        ? { ...rule, ...updates, updatedAt: new Date().toISOString() }
        : rule
    );
    saveRules(newRules);
  };

  const deleteRule = (id: string) => {
    saveRules(rules.filter((rule) => rule.id !== id));
  };

  const getRulesByGame = (gameId: string) => {
    return rules.filter((rule) => rule.gameId === gameId);
  };

  const getRule = (id: string) => {
    return rules.find((rule) => rule.id === id);
  };

  return {
    rules,
    createRule,
    updateRule,
    deleteRule,
    getRulesByGame,
    getRule,
  };
};
