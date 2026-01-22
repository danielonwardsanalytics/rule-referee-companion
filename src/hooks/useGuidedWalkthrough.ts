import { useState, useCallback, useRef } from 'react';

export type GuidedStatus = 'idle' | 'planning' | 'in_step' | 'answering_question' | 'complete';

export interface GuidedStep {
  title: string;
  instruction: string;
  upNext?: string;
}

interface GuidedState {
  status: GuidedStatus;
  game: string | null;
  steps: GuidedStep[];
  stepIndex: number;
}

interface UseGuidedWalkthroughReturn {
  // State
  status: GuidedStatus;
  game: string | null;
  steps: GuidedStep[];
  stepIndex: number;
  currentStep: GuidedStep | null;
  
  // Tracking spoken messages to prevent double TTS
  spokenMessageIds: Set<string>;
  markAsSpoken: (messageId: string) => void;
  hasBeenSpoken: (messageId: string) => boolean;
  
  // Actions
  startWalkthrough: (gameName: string) => void;
  setPlanning: () => void;
  setInStep: () => void;
  addStep: (step: GuidedStep) => void;
  setSteps: (steps: GuidedStep[]) => void;
  nextStep: () => boolean; // returns false if already at end
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
};

/**
 * Parses AI response into structured step format.
 * Looks for "DO THIS NOW:" and "UP NEXT:" patterns.
 */
export function parseStepFromResponse(content: string): GuidedStep | null {
  // Try to find "DO THIS NOW:" pattern
  const doThisMatch = content.match(/\*\*DO THIS NOW:\*\*\s*([^\n]+(?:\n(?!\*\*UP NEXT|\*\*\[)[^\n]*)*)/i);
  const upNextMatch = content.match(/\*\*UP NEXT:\*\*\s*([^\n]+)/i);
  
  // Try to find step title like "**Setup – Shuffle & Deal**" or "**First Turn**"
  const titleMatch = content.match(/\*\*([^*]+(?:–|-)[^*]+)\*\*/);
  const simpleTitleMatch = content.match(/\*\*([A-Z][^*]{3,40})\*\*/);
  
  if (doThisMatch) {
    const instruction = doThisMatch[1].trim();
    const title = titleMatch?.[1]?.trim() || simpleTitleMatch?.[1]?.trim() || "Current Step";
    const upNext = upNextMatch?.[1]?.trim();
    
    return {
      title,
      instruction: instruction.length > 150 ? instruction.substring(0, 147) + "..." : instruction,
      upNext,
    };
  }
  
  // Fallback: Try to extract meaningful step info from any structured response
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length > 0) {
    // Get first meaningful line as title
    const firstLine = lines[0].replace(/^\*+|\*+$/g, '').trim();
    const title = firstLine.length > 50 ? firstLine.substring(0, 47) + "..." : firstLine;
    
    // Get a summary as instruction
    const summary = lines.slice(0, 2).join(' ').substring(0, 150);
    
    return {
      title: title || "Follow Instructions",
      instruction: summary || "See the instructions above",
      upNext: undefined,
    };
  }
  
  return null;
}

/**
 * Hook to manage guided walkthrough state.
 * Single source of truth for step progression.
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
  
  const currentStep = state.steps[state.stepIndex] || null;
  
  return {
    status: state.status,
    game: state.game,
    steps: state.steps,
    stepIndex: state.stepIndex,
    currentStep,
    spokenMessageIds: spokenIdsRef.current,
    markAsSpoken,
    hasBeenSpoken,
    startWalkthrough,
    setPlanning,
    setInStep,
    addStep,
    setSteps,
    nextStep,
    setAnsweringQuestion,
    returnToStep,
    complete,
    reset,
  };
}
