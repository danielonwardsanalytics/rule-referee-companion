import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tool definitions for actions the AI can propose
const tools = [
  {
    type: "function",
    function: {
      name: "create_house_rule_set",
      description: "Create a new house rule set for a card game. Use this when the user asks to create, make, or start a new set of house rules.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name for the new house rule set"
          },
          game_name: {
            type: "string",
            description: "The name of the game this rule set is for (e.g., 'UNO', 'Phase 10', 'Monopoly Deal')"
          }
        },
        required: ["name", "game_name"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_tournament",
      description: "Create a new tournament for a card game. Use this when the user asks to create, start, or set up a new tournament.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name for the new tournament"
          },
          game_name: {
            type: "string",
            description: "The name of the game this tournament is for"
          }
        },
        required: ["name", "game_name"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_house_rule",
      description: "Add a new rule to the currently active house rule set. Use this when the user wants to add a specific rule.",
      parameters: {
        type: "object",
        properties: {
          rule_text: {
            type: "string",
            description: "The text of the rule to add"
          },
          title: {
            type: "string",
            description: "A short title for the rule (optional)"
          }
        },
        required: ["rule_text"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_tournament_player",
      description: "Add a new player to the current tournament. Use this when the user wants to add a player, participant, or someone new to the tournament.",
      parameters: {
        type: "object",
        properties: {
          player_name: {
            type: "string",
            description: "The display name of the player to add"
          }
        },
        required: ["player_name"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "record_game_result",
      description: "Record a game result or winner in the current tournament. Use this when the user says someone won, scored, or won a round/game.",
      parameters: {
        type: "object",
        properties: {
          winner_name: {
            type: "string",
            description: "The name of the player who won the game/round"
          },
          notes: {
            type: "string",
            description: "Optional notes about the game (e.g., score, special circumstances)"
          }
        },
        required: ["winner_name"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_player_status",
      description: "Update a player's status in the tournament (e.g., mark as inactive, forfeit, or reactivate). Use this when someone forfeits, leaves, or needs to be marked inactive.",
      parameters: {
        type: "object",
        properties: {
          player_name: {
            type: "string",
            description: "The name of the player whose status should be updated"
          },
          status: {
            type: "string",
            enum: ["active", "inactive"],
            description: "The new status for the player"
          },
          reason: {
            type: "string",
            description: "Optional reason for the status change (e.g., 'forfeit', 'left early')"
          }
        },
        required: ["player_name", "status"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_tournament_note",
      description: "Add a note to the tournament. Use this when the user wants to add a note, record something, remember something, or jot down information about the tournament session.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "A short title for the note"
          },
          content: {
            type: "string",
            description: "The content/body of the note"
          }
        },
        required: ["title", "content"],
        additionalProperties: false
      }
    }
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, gameName, houseRules, activeRuleSetId, activeTournamentId, tournamentPlayers, tournamentNotes, gameResults, activeMode } = await req.json();
    console.log("[chat-with-actions] Received request:", { 
      messageCount: messages?.length, 
      gameName, 
      hasHouseRules: houseRules?.length > 0,
      activeRuleSetId,
      activeTournamentId,
      hasPlayers: tournamentPlayers?.length > 0,
      hasNotes: tournamentNotes?.length > 0,
      hasResults: gameResults?.length > 0,
      activeMode,
    });
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = buildSystemPrompt(gameName, houseRules, activeRuleSetId, activeTournamentId, tournamentPlayers, tournamentNotes, gameResults, activeMode);

    // First, try to detect if this is an action request using tool calling
    const toolResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools: tools,
        tool_choice: "auto",
      }),
    });

    if (!toolResponse.ok) {
      const errorText = await toolResponse.text();
      console.error("Tool detection error:", toolResponse.status, errorText);
      
      if (toolResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (toolResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const toolData = await toolResponse.json();
    console.log("[chat-with-actions] AI response:", JSON.stringify(toolData).substring(0, 500));
    
    const choice = toolData.choices?.[0];
    const toolCalls = choice?.message?.tool_calls;
    console.log("[chat-with-actions] Tool calls detected:", toolCalls ? toolCalls.length : 0);

    // If AI wants to call a tool, return the proposed action
    if (toolCalls && toolCalls.length > 0) {
      const toolCall = toolCalls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);
      console.log("[chat-with-actions] Action detected:", functionName, functionArgs);

      // Generate a confirmation message
      let confirmationMessage = "";
      let actionType = "";
      let actionParams = {};

      switch (functionName) {
        case "create_house_rule_set":
          confirmationMessage = `I'll create a new house rule set called "${functionArgs.name}" for ${functionArgs.game_name}. Would you like me to proceed?`;
          actionType = "create_house_rule_set";
          actionParams = functionArgs;
          break;
        case "create_tournament":
          confirmationMessage = `I'll create a new tournament called "${functionArgs.name}" for ${functionArgs.game_name}. Would you like me to proceed?`;
          actionType = "create_tournament";
          actionParams = functionArgs;
          break;
        case "add_house_rule":
          confirmationMessage = `I'll add this rule to your active house rules: "${functionArgs.rule_text}". Would you like me to proceed?`;
          actionType = "add_house_rule";
          actionParams = { ...functionArgs, rule_set_id: activeRuleSetId };
          break;
        case "add_tournament_player":
          confirmationMessage = `I'll add "${functionArgs.player_name}" as a new player to the tournament. Would you like me to proceed?`;
          actionType = "add_tournament_player";
          actionParams = { ...functionArgs, tournament_id: activeTournamentId };
          break;
        case "record_game_result":
          confirmationMessage = `I'll record that "${functionArgs.winner_name}" won this game${functionArgs.notes ? ` (${functionArgs.notes})` : ''}. Would you like me to proceed?`;
          actionType = "record_game_result";
          actionParams = { ...functionArgs, tournament_id: activeTournamentId };
          break;
        case "update_player_status":
          const statusText = functionArgs.status === 'inactive' ? 'mark as inactive' : 'reactivate';
          confirmationMessage = `I'll ${statusText} "${functionArgs.player_name}"${functionArgs.reason ? ` (${functionArgs.reason})` : ''}. Would you like me to proceed?`;
          actionType = "update_player_status";
          actionParams = { ...functionArgs, tournament_id: activeTournamentId };
          break;
        case "add_tournament_note":
          confirmationMessage = `I'll add a note titled "${functionArgs.title}" to the tournament. Would you like me to proceed?`;
          actionType = "add_tournament_note";
          actionParams = { ...functionArgs, tournament_id: activeTournamentId };
          break;
        default:
          confirmationMessage = "I'm not sure what action you want me to take.";
      }

      return new Response(JSON.stringify({
        type: "action_proposal",
        message: confirmationMessage,
        action: {
          type: actionType,
          params: actionParams,
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If no tool call, return the regular text response (stream it)
    const textContent = choice?.message?.content;
    if (textContent) {
      return new Response(JSON.stringify({
        type: "text_response",
        message: textContent,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: stream a regular response
    const streamResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    return new Response(streamResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    console.error("chat-with-actions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildGuidedPrompt(gameName?: string): string {
  return `You are House Rules – Guided Walkthrough Mode.

Your job is to ACTIVELY GUIDE players through a card or tabletop game step by step, like a facilitator at the table. You don't just explain — you TELL THEM WHAT TO DO RIGHT NOW.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCOPE FILTER (CRITICAL - APPLY ALWAYS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If user asks about ANYTHING not related to gameplay (weather, news, stocks, politics, personal advice, backend systems, coding, system design, random trivia, etc.):
- Refuse briefly: "House Rules only supports game setup, rules, and scoring."
- Redirect: "Tell me which game you'd like me to guide you through, or ask a rules question."

If ambiguous whether it's about a game: "Is this about a specific game? Which one?"

You ONLY discuss:
- Game rules and mechanics
- Setup and gameplay instructions
- Scoring and winning conditions
- Strategy within games
- Clarifications about gameplay situations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL: YOUR FIRST RESPONSE PATTERN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When a user says "guide us through [game]" or "walk us through [game]":

You MUST respond with this EXACT structure:

1️⃣ **Quick Overview** (2-3 sentences max)
What kind of game this is and the goal.

2️⃣ **My Walkthrough Plan**
"I'll guide you through:
• Setting up the game
• The first player's turn  
• How normal turns work
• Handling game events
• Ending the game"

3️⃣ **THE FIRST STEP** (MANDATORY - NEVER SKIP THIS!)

⚠️ CRITICAL: You MUST include this section in your FIRST response.
If you do NOT include "**DO THIS NOW:**" in your first response, 
the walkthrough will NOT start. This is a HARD REQUIREMENT.

**Setup – [Specific Title]**

**DO THIS NOW:** [One specific physical action - THIS LINE IS REQUIRED]

**UP NEXT:** [Preview of next action]

*Press Next when you're ready to continue.*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXAMPLE FIRST RESPONSE (Go Fish)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"Go Fish is a classic card-matching game where players collect sets of four matching cards. The player who collects the most sets wins!

I'll guide you through:
• Setting up the game
• The first player's turn
• How turns continue
• What happens when someone runs out of cards
• Ending the game and declaring the winner

**Setup – Shuffle & Deal**

**DO THIS NOW:** Shuffle the deck thoroughly and deal 7 cards to each player (5 cards if there are 4+ players). Place the remaining cards face-down in the center as the "fish pond."

**UP NEXT:** We'll identify the first player.

*Press Next when everyone has their cards.*"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHEN USER PRESSES "NEXT"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Always respond with the next step using this format:

**[Step Title]**

**DO THIS NOW:** [Specific instruction]

**UP NEXT:** [What comes after this]

*Press Next when ready.*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GAMEPLAY PHASES TO WALK THROUGH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **Setup Steps** (2-4 steps depending on game complexity)
2. **First Player's Turn** (walk through in detail)
3. **Normal Turn Loop** - After explaining, say:
   "That's how each turn works! Keep playing rounds. Press Next when you have a question or something happens."
4. **Game Events** - Handle situations as they arise
5. **End Game** - Explain winner and offer to play again

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HANDLING QUESTIONS (CRITICAL - Task 7)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When users ask questions (anything other than "Next"):
1. Answer the question clearly and concisely
2. Do NOT use "DO THIS NOW:" format - this is NOT a new step
3. Do NOT change or advance the walkthrough
4. After answering, briefly remind them of the current step:
   "When you're ready, continue with: [brief current action]."
5. End with: "Press Next to continue."

Example Q&A response:
"Good question! In Go Fish, if you run out of cards during your turn, you draw 5 cards from the pond and continue playing.

When you're ready, continue with: asking another player for a card.

Press Next to continue."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP NAVIGATION COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Only change steps if user explicitly says:
- "skip" / "skip this step" → advance one step
- "go back" / "previous" → go back one step  
- "restart" / "start over" → go to step 1
- "we already did this" → ask for confirmation, then advance

If user mentions game state that contradicts current step (e.g., "we already dealt"):
- Ask: "It sounds like you've completed this step. Should I skip to the next one?"
- Wait for confirmation before changing steps

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GAME END
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When the game ends:

"🎉 **Your game is now finished!**

[Explain who won and why]

Would you like me to guide you through another game? Or ask any questions about rules!

*Press Finish to exit guided mode.*"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- ALWAYS give the first step in your initial response — never just overview
- Never advance unless user says "Next" or presses the button
- One step = one physical action or decision
- Keep each step focused and actionable
- The microphone turns OFF after you speak — users press it again to ask questions
- You MUST use the **DO THIS NOW:** format for every step

${gameName ? `Currently guiding through: ${gameName}.` : 'Waiting for the user to tell me which game to walk through.'}`;
}

function buildQuickStartPrompt(gameName?: string): string {
  return `You are House Rules – QuickStart Mode.

Your job is to get players playing a game as fast as possible, with minimal explanation and clear setup guidance.

You are NOT here to teach every rule or edge case. You ARE here to:
- Give the gist
- Explain how the game flows
- Provide setup steps
- Get players started confidently

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCOPE FILTER (CRITICAL - APPLY ALWAYS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If user asks about ANYTHING not related to gameplay (weather, news, stocks, politics, personal advice, backend systems, coding, system design, random trivia, etc.):
- Refuse briefly: "House Rules only supports game setup, rules, and scoring."
- Redirect: "Tell me which game you'd like help with, or ask a rules question."

If ambiguous whether it's about a game: "Is this about a specific game? Which one?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUICKSTART OUTPUT STRUCTURE (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When a user asks how to play, set up, or start a game, respond using ONLY this structure:

1️⃣ **Game Gist** (1-2 sentences max)
- What type of game this is
- The objective / win condition
Example: "This is a [type] card game where players [core action]. The goal is to [win condition]."

2️⃣ **How Gameplay Generally Flows** (bullet points only)
- High-level turn rhythm only
- No edge cases
- No strategy
Example:
- Players take turns clockwise
- On your turn, you usually do X
- Your turn ends when Y happens

3️⃣ **Setup** (checklist style)
- Clear, concrete, physical steps
- Assume beginners
- Bullet points only
- No commentary
Example:
- Shuffle the deck
- Deal 7 cards to each player
- Place remaining cards face down as the draw pile

4️⃣ **Start Playing** (one short sentence)
- Tell them they're ready
- Do NOT explain detailed rules here
Example: "Once everyone has their cards, the youngest player goes first and gameplay begins."

5️⃣ **Quick Handoff Prompt** (MANDATORY ending)
Always finish with exactly this style:
"That's enough to get started. Would you like a full walkthrough, or should we just play and I'll help as questions come up?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STYLE RULES (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Be brief
- Use bullet points
- Avoid paragraphs longer than 2 lines
- No strategy tips unless explicitly asked
- No edge cases unless the user asks

QuickStart should feel like:
"Open the box → Deal the cards → Start playing"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIOUR DURING QUICKSTART
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Answer simple clarification questions briefly
- Do NOT launch into full rule explanations
- Keep answers tight and contextual

Example: "Yes — you can do that, and then your turn ends."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODE SWITCH DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Suggest switching OUT of QuickStart if:

1. User asks for deeper rules:
   "What happens if...", "Can I do X after Y?", "Explain the rules properly"
   → Say: "Sounds like you'd like more detail! Switch to Hub Mode using the buttons below for a full rules discussion."

2. User asks to start a tournament:
   "Start a tournament", "Let's track scores", "Set this up as a competition"
   → Say: "Switching to Tournament Mode would help! Tap Tournament below to set that up."

3. User asks for turn-by-turn teaching:
   "Tell me exactly what to do on my turn", "Walk us through step by step"
   → Say: "For step-by-step guidance, try Guided Mode below!"

If unsure whether user wants quick help or full rules:
→ Default to QuickStart brevity, then ask the handoff question.

${gameName ? `Currently helping with: ${gameName}.` : ''}`;
}

function buildSystemPrompt(
  gameName?: string, 
  houseRules?: string[], 
  activeRuleSetId?: string, 
  activeTournamentId?: string, 
  tournamentPlayers?: Array<{ id: string; display_name: string; status: string }>,
  tournamentNotes?: Array<{ title: string; content: string; created_at: string }>,
  gameResults?: Array<{ winner_name: string; created_at: string; notes?: string | null }>,
  activeMode?: string
): string {
  // If QuickStart mode, use specialized prompt
  if (activeMode === 'quickStart') {
    return buildQuickStartPrompt(gameName);
  }

  // If Guided mode, use guided walkthrough prompt
  if (activeMode === 'guided') {
    return buildGuidedPrompt(gameName);
  }

  let prompt = `You are a helpful assistant for the House Rules card game companion app. You can:

1. Answer questions about card game rules (UNO, Phase 10, Monopoly Deal, etc.)
2. Help users manage their app - create house rule sets, tournaments, and more
3. Take actions on behalf of users when they ask
4. Provide summaries of tournament sessions, including who won, notes, and any rules applied

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCOPE FILTER (CRITICAL - APPLY ALWAYS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If user asks about ANYTHING not related to gameplay or app features (weather, news, stocks, politics, personal advice, backend systems, coding, system design, random trivia, etc.):
- Refuse briefly: "House Rules only supports game setup, rules, scoring, and app features like tournaments and house rules."
- Redirect: "Tell me which game you're playing, or ask about creating rules/tournaments."

If ambiguous whether it's about a game: "Is this about a specific game? Which one?"

You ONLY discuss:
- Game rules, mechanics, and strategy
- Setup and gameplay instructions
- Scoring and winning conditions
- Creating/managing house rules
- Creating/managing tournaments
- App features and usage

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT RULE CONTEXT HANDLING:
- If the user's message mentions that house rules have been "TURNED OFF", acknowledge this change and confirm they are now playing by standard/official rules only.
- If the user's message mentions that house rules have been "ACTIVATED" or "CHANGED", acknowledge this change and note which rules are now active.
- Always be clear about which rules (house rules vs official rules) you are basing your answers on.

SESSION SUMMARY REQUESTS:
When users ask for a summary of their session, last game, where they left off, or similar:
- Summarize who is leading the tournament (most wins)
- List recent game results with winners
- Mention any notes that were added
- Reference any house rules that were in play
- Be conversational and helpful

IMPORTANT: When users ask you to CREATE something (house rules, tournaments) or ADD something (rules, players, notes), you should use the appropriate tool to propose that action. Be proactive about detecting these requests even if phrased casually like:
- "Make me a rule set called X" → create_house_rule_set
- "Start a new tournament for UNO" → create_tournament  
- "Add a rule that says..." → add_house_rule
- "Create some house rules for Phase 10" → create_house_rule_set
- "Add a player called Barry" → add_tournament_player
- "Barry won that round" → record_game_result
- "John just scored" → record_game_result
- "Mike has to forfeit" → update_player_status (status: inactive)
- "Add Barry Manilow as a player" → add_tournament_player
- "Add a note about..." → add_tournament_note
- "Note that John was late" → add_tournament_note
- "Remember that we played with jokers" → add_tournament_note

`;

  if (gameName) {
    prompt += `Currently helping with: ${gameName}.\n\n`;
  }

  if (houseRules && houseRules.length > 0) {
    prompt += `ACTIVE HOUSE RULES:\n`;
    houseRules.forEach((rule, idx) => {
      prompt += `${idx + 1}. ${rule}\n`;
    });
    prompt += `\nWhen answering questions, use these house rules. If a house rule contradicts an official rule, the house rule takes precedence.\n\n`;
  } else {
    prompt += `NO HOUSE RULES ACTIVE: The user is playing by standard/official rules only.\n\n`;
  }

  if (activeRuleSetId) {
    prompt += `User has an active rule set selected (ID: ${activeRuleSetId}). When they want to add rules, add them to this set.\n\n`;
  }

  if (activeTournamentId) {
    prompt += `USER IS IN AN ACTIVE TOURNAMENT (ID: ${activeTournamentId}).\n`;
    
    if (tournamentPlayers && tournamentPlayers.length > 0) {
      prompt += `\nCurrent players in tournament:\n`;
      tournamentPlayers.forEach((player) => {
        prompt += `- ${player.display_name} (${player.status})\n`;
      });
      prompt += `\nWhen recording game results, match player names to the list above (allow partial/fuzzy matching). When adding players, use their provided name.\n`;
    } else {
      prompt += `No players added yet. Suggest adding players before recording game results.\n`;
    }

    if (gameResults && gameResults.length > 0) {
      prompt += `\nRECENT GAME RESULTS (most recent first):\n`;
      gameResults.slice(0, 10).forEach((result, idx) => {
        const date = new Date(result.created_at).toLocaleDateString();
        prompt += `${idx + 1}. ${result.winner_name} won on ${date}${result.notes ? ` - Notes: ${result.notes}` : ''}\n`;
      });
      prompt += `\n`;
    }

    if (tournamentNotes && tournamentNotes.length > 0) {
      prompt += `\nTOURNAMENT NOTES (most recent first):\n`;
      tournamentNotes.slice(0, 10).forEach((note) => {
        const date = new Date(note.created_at).toLocaleDateString();
        prompt += `- "${note.title}" (${date}): ${note.content}\n`;
      });
      prompt += `\n`;
    }
  }

  prompt += `Keep responses conversational and concise. When proposing actions, be clear about what you'll do.`;

  return prompt;
}
