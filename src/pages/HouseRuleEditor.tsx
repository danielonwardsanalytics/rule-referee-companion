import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useHouseRules } from "@/hooks/useHouseRules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Menu, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const games = [
  { id: "uno", name: "UNO" },
  { id: "phase-10", name: "Phase 10" },
  { id: "monopoly-deal", name: "Monopoly Deal" },
  { id: "skip-bo", name: "Skip-Bo" },
];

const HouseRuleEditor = () => {
  const navigate = useNavigate();
  const { ruleSetId } = useParams();
  const [searchParams] = useSearchParams();
  const { createRule, updateRule, getRule } = useHouseRules();
  const { toast } = useToast();

  const isEditing = !!ruleSetId;
  const preselectedGameId = searchParams.get("gameId");

  const [name, setName] = useState("");
  const [gameId, setGameId] = useState(preselectedGameId || "");
  const [sections, setSections] = useState([{ title: "", content: "" }]);

  useEffect(() => {
    if (isEditing) {
      const rule = getRule(ruleSetId);
      if (rule) {
        setName(rule.name);
        setGameId(rule.gameId);
        setSections(rule.sections.length > 0 ? rule.sections : [{ title: "", content: "" }]);
      }
    }
  }, [isEditing, ruleSetId, getRule]);

  const addSection = () => {
    setSections([...sections, { title: "", content: "" }]);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, field: "title" | "content", value: string) => {
    const newSections = [...sections];
    newSections[index][field] = value;
    setSections(newSections);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Rule set name is required", variant: "destructive" });
      return;
    }
    if (!gameId) {
      toast({ title: "Error", description: "Please select a game", variant: "destructive" });
      return;
    }
    if (sections.length === 0 || !sections.some(s => s.title.trim())) {
      toast({ title: "Error", description: "At least one section with a title is required", variant: "destructive" });
      return;
    }

    const validSections = sections.filter(s => s.title.trim());

    if (isEditing) {
      updateRule(ruleSetId, { name, gameId, sections: validSections });
      toast({ title: "Success", description: "House rules updated" });
    } else {
      const newRule = createRule({ name, gameId, sections: validSections, createdBy: "user", source: "user" });
      toast({ title: "Success", description: "House rules created" });
      navigate(`/house-rules/${newRule.gameId}/${newRule.id}`);
      return;
    }
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-foreground">
            {isEditing ? "Edit House Rules" : "Create House Rules"}
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Rule Set Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., No Stacking + Draw 2 Chain Off"
              className="bg-card border-border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Game</label>
            <Select value={gameId} onValueChange={setGameId}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Select a game" />
              </SelectTrigger>
              <SelectContent>
                {games.map((game) => (
                  <SelectItem key={game.id} value={game.id}>
                    {game.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-foreground">Sections</label>
              <Button onClick={addSection} size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            </div>

            <div className="space-y-4">
              {sections.map((section, index) => (
                <div key={index} className="border border-border rounded-lg p-4 bg-card">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <Input
                        value={section.title}
                        onChange={(e) => updateSection(index, "title", e.target.value)}
                        placeholder="Section title (e.g., Setup, Gameplay)"
                        className="bg-background border-border"
                      />
                      <Textarea
                        value={section.content}
                        onChange={(e) => updateSection(index, "content", e.target.value)}
                        placeholder="Section content..."
                        rows={4}
                        className="bg-background border-border"
                      />
                    </div>
                    {sections.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSection(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/90">
              Save
            </Button>
            <Button onClick={() => navigate(-1)} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HouseRuleEditor;
