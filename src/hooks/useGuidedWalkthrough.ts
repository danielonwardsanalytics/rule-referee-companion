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
 * Extracts a short summary (max 60 chars) from a longer instruction.
 * This is for the Next Step card only - must be very concise.
 */
function extractSummary(instruction: string): string {
  // Clean up markdown formatting first
  let cleaned = instruction
    .replace(/\*\*/g, '') // Remove bold markers
    .replace(/^#+\s*/gm, '') // Remove heading markers
    .replace(/^\s*[-•]\s*/gm, '') // Remove bullet points
    .trim();
  
  // Take first sentence only
  const firstSentence = cleaned.split(/[.!?]/)[0].trim();
  
  // If already short enough, return as-is
  if (firstSentence.length <= 60) {
    return firstSentence;
  }
  
  // Find a natural break point within 60 chars
  const words = firstSentence.split(' ');
  let summary = '';
  for (const word of words) {
    if ((summary + ' ' + word).trim().length > 57) break;
    summary += (summary ? ' ' : '') + word;
  }
  
  return summary.trim() + '...';
}

/**
 * Checks if an AI response contains a step (DO THIS NOW pattern)
 */
export function responseContainsStep(content: string): boolean {
  // Look for the DO THIS NOW marker in various formats
  return /\*\*DO THIS NOW:\*\*/i.test(content) || 
         /DO THIS NOW:/i.test(content) ||
         /\*\*DO THIS NOW\*\*:/i.test(content);
}

/**
 * Extracts orientation content (everything before the first step)
 * Returns null if no substantial orientation exists
 */
export function extractOrientation(content: string): string | null {
  const stepStart = content.search(/\*\*[^*]*(?:Setup|Step|First|DO THIS NOW)/i);
  if (stepStart > 100) { // Only if there's substantial content before the step
    return content.substring(0, stepStart).trim();
  }
  return null;
}

/**
 * Parses AI response into structured step format.
 * Looks for "DO THIS NOW:" and "UP NEXT:" patterns.
 * Returns step with separate summary and detail.
 * Only returns a step if the response contains the DO THIS NOW marker.
 */
export function parseStepFromResponse(content: string): GuidedStep | null {
  // Only proceed if this looks like a step response
  if (!responseContainsStep(content)) {
    console.log('[parseStepFromResponse] No step marker found in response');
    return null;
  }
  
  console.log('[parseStepFromResponse] Found step marker, parsing...');
  
  // Try to find "DO THIS NOW:" pattern - handle multiple markdown formats
  // Matches: **DO THIS NOW:** text, DO THIS NOW: text, **DO THIS NOW**: text
  const doThisMatch = content.match(/\*\*DO THIS NOW:?\*\*:?\s*([^\n]+(?:\n(?!\*\*UP NEXT|\*\*\[|Press Next)[^\n]*)*)/i) ||
                      content.match(/DO THIS NOW:\s*([^\n]+(?:\n(?!\*\*UP NEXT|\*\*\[|Press Next)[^\n]*)*)/i);
  
  const upNextMatch = content.match(/\*\*UP NEXT:?\*\*:?\s*([^\n]+)/i) ||
                      content.match(/UP NEXT:\s*([^\n]+)/i);
  
  // Try to find step title like "**Setup – Shuffle & Deal**" or "**Gameplay – First Turn**"
  const titleMatch = content.match(/\*\*([^*]+(?:–|-)[^*]+)\*\*/);
  const simpleTitleMatch = content.match(/\*\*([A-Z][^*]{3,50})\*\*/);
  
  if (doThisMatch) {
    const fullInstruction = doThisMatch[1].trim();
    const title = titleMatch?.[1]?.trim() || simpleTitleMatch?.[1]?.trim() || "Current Step";
    const upNext = upNextMatch?.[1]?.trim();
    
    console.log('[parseStepFromResponse] Parsed step:', {
      title,
      instructionLength: fullInstruction.length,
      hasUpNext: !!upNext
    });
    
    // Create the step with a clear, short summary for the card
    return {
      title: title.length > 40 ? title.substring(0, 37) + "..." : title,
      summary: extractSummary(fullInstruction),
      detail: fullInstruction,
      speakText: fullInstruction,
      upNext: upNext ? (upNext.length > 50 ? upNext.substring(0, 47) + "..." : upNext) : undefined,
    };
  }
  
  // Fallback: If we detected the marker but couldn't parse cleanly
  console.log('[parseStepFromResponse] Marker found but no clean parse, using fallback');
  
  // Find the line with "DO THIS NOW" and grab content after it
  const lines = content.split('\n');
  let foundMarker = false;
  let instruction = '';
  
  for (const line of lines) {
    if (line.includes('DO THIS NOW')) {
      foundMarker = true;
      // Get content after the marker on the same line
      const afterMarker = line.split(/DO THIS NOW:?\*?\*?:?\s*/i)[1];
      if (afterMarker) {
        instruction = afterMarker.trim();
      }
    } else if (foundMarker && instruction && !line.includes('UP NEXT') && !line.includes('Press Next')) {
      // Continue building instruction until we hit UP NEXT or Press Next
      if (line.trim()) {
        instruction += ' ' + line.trim();
      }
    } else if (foundMarker && (line.includes('UP NEXT') || line.includes('Press Next'))) {
      break;
    }
  }
  
  if (instruction) {
    const title = titleMatch?.[1]?.trim() || simpleTitleMatch?.[1]?.trim() || "Current Step";
    const upNext = upNextMatch?.[1]?.trim();
    
    return {
      title: title.length > 40 ? title.substring(0, 37) + "..." : title,
      summary: extractSummary(instruction),
      detail: instruction,
      speakText: instruction,
      upNext: upNext ? (upNext.length > 50 ? upNext.substring(0, 47) + "..." : upNext) : undefined,
    };
  }
  
  console.log('[parseStepFromResponse] Failed to extract step content');
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
