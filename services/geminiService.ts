import { GoogleGenAI, Type } from "@google/genai";
import { AGENTS } from "../constants";
import { AgentId, Message } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models
const ORCHESTRATOR_MODEL = "gemini-2.5-flash"; // Fast for decision making
const WORKER_MODEL = "gemini-2.5-flash"; // Good balance for most tasks

interface OrchestratorResponse {
  agentId: AgentId;
  reasoning: string;
}

enum AutcErrorType {
  NETWORK = 'NETWORK_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  SAFETY = 'SAFETY_BLOCK',
  SERVER = 'SERVER_ERROR',
  AUTH = 'AUTH_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR'
}

/**
 * Categorizes raw errors into specific types and returns user-friendly messages.
 */
const getUserErrorMessage = (error: any): string => {
  const message = error instanceof Error ? error.message : String(error);
  
  if (message.includes('API_KEY') || message.includes('403')) {
    return "Neural Link Failure: Authentication rejected. Please check API configuration.";
  }
  if (message.includes('429') || message.includes('quota')) {
    return "Neural Overload: Rate limit exceeded. Please wait a moment before transmitting again.";
  }
  if (message.includes('503') || message.includes('overloaded')) {
    return "System Busy: The AI models are currently experiencing high traffic. Please try again shortly.";
  }
  if (message.includes('500')) {
    return "System Error: An internal server error occurred within the model provider.";
  }
  if (message.includes('SAFETY') || message.includes('blocked')) {
    return "Protocol Restriction: My safety filters prevented me from generating this response.";
  }
  if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
    return "Connection Lost: Unable to reach the AI network. Please check your internet connection.";
  }
  
  return `System Fault: An unexpected error occurred. (${message.slice(0, 50)}...)`;
};

// Helper to strip markdown code blocks from JSON
const cleanJson = (text: string): string => {
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json/, '').replace(/```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```/, '').replace(/```$/, '');
  }
  return clean.trim();
};

/**
 * The Brain: Decides which agent handles the request, aware of history.
 */
export const orchestrateRequest = async (prompt: string, history: Message[] = []): Promise<OrchestratorResponse> => {
  try {
    // Construct a context-aware prompt for the orchestrator
    const recentHistory = history.slice(-4).map(m => `${m.role}: ${m.text}`).join('\n');
    const fullPrompt = `
      Conversation History:
      ${recentHistory}
      
      Current User Input:
      ${prompt}
      
      Based on the history and current input, which agent is best?
    `;

    const response = await ai.models.generateContent({
      model: ORCHESTRATOR_MODEL,
      contents: fullPrompt,
      config: {
        systemInstruction: AGENTS[AgentId.ORCHESTRATOR].systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            agentId: { type: Type.STRING },
            reasoning: { type: Type.STRING },
          },
          required: ["agentId", "reasoning"],
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Orchestrator");
    
    // Robust JSON parsing
    const cleanedText = cleanJson(text);
    let data;
    try {
      data = JSON.parse(cleanedText);
    } catch (e) {
      console.warn("JSON parse failed, attempting manual extraction", text);
      if (text.includes("science")) return { agentId: AgentId.SCIENCE, reasoning: "Fallback detection" };
      if (text.includes("technology")) return { agentId: AgentId.TECHNOLOGY, reasoning: "Fallback detection" };
      throw new Error("PARSING_ERROR: Could not parse orchestrator JSON");
    }

    // Validate agent ID
    const validId = Object.values(AgentId).includes(data.agentId as AgentId) 
      ? (data.agentId as AgentId) 
      : AgentId.TECHNOLOGY; // Fallback

    return {
      agentId: validId,
      reasoning: data.reasoning
    };

  } catch (error) {
    console.error("Orchestration failed:", error);
    const errorMessage = getUserErrorMessage(error);
    
    // In orchestration, we generally want to fallback rather than crash,
    // but we pass the error message in the reasoning so the UI/User knows something went wrong.
    return { 
      agentId: AgentId.TECHNOLOGY, 
      reasoning: `Automatic routing failed due to: ${errorMessage}. Defaulting to Technology Agent.` 
    };
  }
};

/**
 * The Worker: Executes the task with the specific persona
 */
export const runAgent = async (
  agentId: AgentId, 
  prompt: string, 
  history: Message[] = [],
  imageBase64?: string
) => {
  const agent = AGENTS[agentId];
  
  // Transform app messages to Gemini Content format for history
  const pastContent = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  // Prepare current turn
  const currentParts: any[] = [{ text: prompt }];
  
  if (imageBase64) {
    const mimeType = imageBase64.split(';')[0].split(':')[1] || 'image/png';
    const data = imageBase64.split(',')[1];
    
    currentParts.unshift({
      inlineData: {
        mimeType: mimeType,
        data: data
      }
    });
  }

  // Combine history + current
  const contents = [
    ...pastContent,
    {
      role: 'user',
      parts: currentParts
    }
  ];

  try {
    const response = await ai.models.generateContent({
      model: WORKER_MODEL,
      contents: contents,
      config: {
        systemInstruction: agent.systemInstruction,
      }
    });

    return response.text || "I apologize, but I could not generate a response.";
  } catch (err) {
    console.error("Agent execution failed:", err);
    // Return the specific user-friendly error message
    const friendlyError = getUserErrorMessage(err);
    return `⚠️ **Communication Error**: ${friendlyError}`;
  }
};
