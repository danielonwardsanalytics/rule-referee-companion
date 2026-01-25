import { useState, useCallback, useRef } from 'react';

export type GuidedStatus = 'idle' | 'planning' | 'in_step' | 'answering_question' | 'complete';

export interface GuidedStep {
  title: string;
  summary: string;      // Short text for Next Step card (max 80 chars)
  detail: string;       // Full instruction for transcript
  speakText?: string;   // Optional TTS text
  upNext?: string;
}

export interface TranscriptMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface GuidedState {
  status: GuidedStatus;
  game: string | null;
  steps: GuidedStep[];
  stepIndex: number;
  transcript: TranscriptMessage[];
}

interface UseGuidedWalkthroughReturn {
  // State
  status: GuidedStatus;
  game: string | null;
  steps: GuidedStep[];
  stepIndex: number;
  currentStep: GuidedStep | null;
  transcript: TranscriptMessage[];
  
  // Tracking spoken messages to prevent double TTS
  markAsSpoken: (messageId: string) => void;
  hasBeenSpoken: (messageId: string) => boolean;
  
  // Transcript management
  addToTranscript: (role: 'user' | 'assistant' | 'system', content: string) => string;
  clearTranscript: () => void;
  
  // Actions
  startWalkthrough: (gameName: string) => void;
  setPlanning: () => void;
  setInStep: () => void;
  addStep: (step: GuidedStep) => void;
  setSteps: (steps: GuidedStep[]) => void;
  nextStep: () => boolean; // returns false if already at end
  prevStep: () => boolean; // returns false if already at start
  setAnsweringQuestion: () => void;
  returnToStep: () => void;
  complete: () => void;
  reset: () => void;
}

const initialState: GuidedState = {
  status: 'idle',
  game: null,
  steps: [],
  stepIndex: 0,
  transcript: [],
};

/**
 * Extracts a short summary (max 80 chars) from a longer instruction.
 */
function extractSummary(instruction: string): string {
  // Take first sentence or line
  const firstSentence = instruction.split(/[.!?]\s/)[0];
  const cleaned = firstSentence.replace(/^\*+|\*+$/g, '').trim();
  
  if (cleaned.length <= 80) {
    return cleaned;
  }
  
  // Truncate and add ellipsis
  return cleaned.substring(0, 77) + "...";
}

/**
 * Parses AI response into structured step format.
 * Looks for "DO THIS NOW:" and "UP NEXT:" patterns.
 * Returns step with separate summary and detail.
 */
export function parseStepFromResponse(content: string): GuidedStep | null {
  // Try to find "DO THIS NOW:" pattern
  const doThisMatch = content.match(/\*\*DO THIS NOW:\*\*\s*([^\n]+(?:\n(?!\*\*UP NEXT|\*\*\[)[^\n]*)*)/i);
  const upNextMatch = content.match(/\*\*UP NEXT:\*\*\s*([^\n]+)/i);
  
  // Try to find step title like "**Setup – Shuffle & Deal**" or "**First Turn**"
  const titleMatch = content.match(/\*\*([^*]+(?:–|-)[^*]+)\*\*/);
  const simpleTitleMatch = content.match(/\*\*([A-Z][^*]{3,40})\*\*/);
  
  if (doThisMatch) {
    const fullInstruction = doThisMatch[1].trim();
    const title = titleMatch?.[1]?.trim() || simpleTitleMatch?.[1]?.trim() || "Current Step";
    const upNext = upNextMatch?.[1]?.trim();
    
    return {
      title,
      summary: extractSummary(fullInstruction),
      detail: fullInstruction,
      speakText: fullInstruction,
      upNext,
    };
  }
  
  // Fallback: Try to extract meaningful step info from any structured response
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length > 0) {
    // Get first meaningful line as title
    const firstLine = lines[0].replace(/^\*+|\*+$/g, '').replace(/^#+\s*/, '').trim();
    const title = firstLine.length > 50 ? firstLine.substring(0, 47) + "..." : firstLine;
    
    // Get a fuller summary from multiple lines
    const fullDetail = lines.slice(0, 5).join(' ').replace(/\*+/g, '').trim();
    
    return {
      title: title || "Follow Instructions",
      summary: extractSummary(fullDetail),
      detail: fullDetail || "See the instructions above",
      speakText: fullDetail,
      upNext: undefined,
    };
  }
  
  return null;
}

/**
 * Hook to manage guided walkthrough state.
 * Single source of truth for step progression and transcript.
 */
export function useGuidedWalkthrough(): UseGuidedWalkthroughReturn {
  const [state, setState] = useState<GuidedState>(initialState);
  const spokenIdsRef = useRef<Set<string>>(new Set());
  
  const startWalkthrough = useCallback((gameName: string) => {
    setState({
      status: 'planning',
      game: gameName,
      steps: [],
      stepIndex: 0,
      transcript: [],
    });
    spokenIdsRef.current.clear();
  }, []);
  
  const setPlanning = useCallback(() => {
    setState(prev => ({ ...prev, status: 'planning' }));
  }, []);
  
  const setInStep = useCallback(() => {
    setState(prev => ({ ...prev, status: 'in_step' }));
  }, []);
  
  const addStep = useCallback((step: GuidedStep) => {
    setState(prev => ({
      ...prev,
      steps: [...prev.steps, step],
      status: 'in_step',
    }));
  }, []);
  
  const setSteps = useCallback((steps: GuidedStep[]) => {
    setState(prev => ({
      ...prev,
      steps,
      status: 'in_step',
    }));
  }, []);
  
  const nextStep = useCallback((): boolean => {
    let advanced = false;
    setState(prev => {
      if (prev.stepIndex < prev.steps.length - 1) {
        advanced = true;
        return { ...prev, stepIndex: prev.stepIndex + 1, status: 'in_step' };
      } else if (prev.steps.length > 0) {
        // Already at last step, could mark complete
        return { ...prev, status: 'complete' };
      }
      return prev;
    });
    return advanced;
  }, []);
  
  const prevStep = useCallback((): boolean => {
    let movedBack = false;
    setState(prev => {
      if (prev.stepIndex > 0) {
        movedBack = true;
        return { ...prev, stepIndex: prev.stepIndex - 1, status: 'in_step' };
      }
      return prev;
    });
    return movedBack;
  }, []);
  
  const setAnsweringQuestion = useCallback(() => {
    setState(prev => ({ ...prev, status: 'answering_question' }));
  }, []);
  
  const returnToStep = useCallback(() => {
    setState(prev => ({ ...prev, status: 'in_step' }));
  }, []);
  
  const complete = useCallback(() => {
    setState(prev => ({ ...prev, status: 'complete' }));
  }, []);
  
  const reset = useCallback(() => {
    setState(initialState);
    spokenIdsRef.current.clear();
  }, []);
  
  // TTS tracking methods
  const markAsSpoken = useCallback((messageId: string) => {
    spokenIdsRef.current.add(messageId);
  }, []);
  
  const hasBeenSpoken = useCallback((messageId: string): boolean => {
    return spokenIdsRef.current.has(messageId);
  }, []);
  
  // Transcript management
  const addToTranscript = useCallback((role: 'user' | 'assistant' | 'system', content: string): string => {
    const id = `transcript-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setState(prev => ({
      ...prev,
      transcript: [...prev.transcript, { id, role, content, timestamp: Date.now() }],
    }));
    return id;
  }, []);
  
  const clearTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: [] }));
  }, []);
  
  const currentStep = state.steps[state.stepIndex] || null;
  
  return {
    status: state.status,
    game: state.game,
    steps: state.steps,
    stepIndex: state.stepIndex,
    currentStep,
    transcript: state.transcript,
    markAsSpoken,
    hasBeenSpoken,
    addToTranscript,
    clearTranscript,
    startWalkthrough,
    setPlanning,
    setInStep,
    addStep,
    setSteps,
    nextStep,
    prevStep,
    setAnsweringQuestion,
    returnToStep,
    complete,
    reset,
  };
}
