import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import ChatInterface from "./ChatInterface";

interface AskQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameName?: string;
}

const AskQuestionModal = ({ isOpen, onClose, gameName }: AskQuestionModalProps) => {
  const [isOpen2, setIsOpen2] = useState(false);

  const handleAsk = () => {
    setIsOpen2(true);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <MessageSquare className="h-5 w-5" />
              Ask About {gameName || "the Rules"}
            </DialogTitle>
            <DialogDescription>
              Chat with our AI expert or use voice to get instant answers about game rules.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <Button 
              onClick={handleAsk} 
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              Start Chat
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <ChatInterface isOpen={isOpen2} onClose={() => setIsOpen2(false)} gameName={gameName} />
    </>
  );
};

export default AskQuestionModal;
