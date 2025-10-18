import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import VoiceHeroButton from "@/components/VoiceHeroButton";
import TextChatInput from "@/components/TextChatInput";
import HouseRuleList from "@/components/HouseRuleList";
import ChatInterface from "@/components/ChatInterface";
import { Menu, Grid3x3 } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleVoiceClick = () => {
    setIsChatOpen(true);
    setVoiceState("listening");
  };

  const handleSendMessage = (message: string) => {
    setIsChatOpen(true);
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    setIsChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
            <Menu className="h-6 w-6" />
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/library")}
            className="p-2 hover:bg-accent rounded-lg"
          >
            <Grid3x3 className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center gap-8 mb-16">
          <VoiceHeroButton state={voiceState} onClick={handleVoiceClick} />
          <TextChatInput
            onSend={handleSendMessage}
            onVoiceToggle={handleVoiceToggle}
            isRecording={isRecording}
          />
        </div>

        <section>
          <h2 className="text-3xl font-bold text-foreground mb-6">House Rules</h2>
          <HouseRuleList />
        </section>
      </main>

      <ChatInterface
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setVoiceState("idle");
        }}
      />
    </div>
  );
};

export default Home;
