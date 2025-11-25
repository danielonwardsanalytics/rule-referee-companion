import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useGameSuggestions } from "@/hooks/useGameSuggestions";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";

const GameRequests = () => {
  const { suggestions, isLoading, submitSuggestion, isSubmitting } = useGameSuggestions();
  const [gameName, setGameName] = useState("");
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gameName.trim()) return;

    submitSuggestion({
      game_name: gameName.trim(),
      description: description.trim() || undefined,
      reason: reason.trim() || undefined,
    });

    // Reset form
    setGameName("");
    setDescription("");
    setReason("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading game requests..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Request a Game</h1>
          <p className="text-muted-foreground mt-1">
            Don't see your favorite game? Request it here and we'll consider adding it!
          </p>
        </div>

        {/* Submit Form */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Submit a Game Request</CardTitle>
            <CardDescription>
              Tell us about the card game you'd like to see added to the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="game-name">Game Name *</Label>
                <Input
                  id="game-name"
                  placeholder="e.g., Wizard, Exploding Kittens, Unstable Unicorns"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the game..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Why should we add this game? (Optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Tell us why you'd like to see this game added..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={isSubmitting || !gameName.trim()} className="hover-scale">
                <Plus className="h-4 w-4 mr-2" />
                Submit Request
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* User's Requests */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Your Requests</h2>
          
          {suggestions && suggestions.length === 0 ? (
            <EmptyState
              icon={Plus}
              title="No requests yet"
              description="You haven't submitted any game requests. Use the form above to suggest a new game!"
            />
          ) : (
            <div className="space-y-3">
              {suggestions?.map((suggestion) => (
                <Card key={suggestion.id} className="animate-fade-in hover-scale">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-lg">{suggestion.game_name}</h3>
                          {getStatusBadge(suggestion.status)}
                        </div>
                        
                        {suggestion.description && (
                          <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                        )}
                        
                        {suggestion.reason && (
                          <div className="pt-2">
                            <p className="text-xs font-medium text-muted-foreground">Your reason:</p>
                            <p className="text-sm">{suggestion.reason}</p>
                          </div>
                        )}

                        {suggestion.admin_notes && (
                          <div className="pt-2 border-t">
                            <p className="text-xs font-medium text-muted-foreground">Admin response:</p>
                            <p className="text-sm">{suggestion.admin_notes}</p>
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground">
                          Submitted {new Date(suggestion.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameRequests;
