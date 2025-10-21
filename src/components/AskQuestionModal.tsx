import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MessageSquare, X } from "lucide-react";
import ChatInterface from "./ChatInterface";

interface AskQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameName?: string;
}

const AskQuestionModal = ({ isOpen, onClose, gameName }: AskQuestionModalProps) => {
  const [selectedVoice, setSelectedVoice] = useState<string>("alloy");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2 text-primary text-2xl">
                <MessageSquare className="h-6 w-6" />
                Ask About {gameName || "the Rules"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Chat with our AI expert or use voice to get instant answers
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden px-6 pb-6">
          <div className="space-y-4 mb-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="voice-select">AI Voice</Label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger id="voice-select">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                  <SelectItem value="echo">Echo (Male)</SelectItem>
                  <SelectItem value="fable">Fable (British Male)</SelectItem>
                  <SelectItem value="onyx">Onyx (Deep Male)</SelectItem>
                  <SelectItem value="nova">Nova (Female)</SelectItem>
                  <SelectItem value="shimmer">Shimmer (Soft Female)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="h-[calc(100%-100px)]">
            <ChatInterface gameName={gameName} voice={selectedVoice} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AskQuestionModal;
