import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mic, Send } from "lucide-react";

interface TextChatInputProps {
  onSend: (message: string) => void;
  onVoiceToggle: () => void;
  isRecording?: boolean;
  disabled?: boolean;
}

const TextChatInput = ({ onSend, onVoiceToggle, isRecording, disabled }: TextChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type instead…"
        disabled={disabled}
        className="pr-24 h-14 text-lg bg-card border-border"
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onVoiceToggle}
          className={isRecording ? "text-destructive" : ""}
        >
          <Mic className="h-5 w-5" />
        </Button>
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          disabled={!input.trim() || disabled}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
};

export default TextChatInput;
