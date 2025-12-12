
export enum AgentId {
  ORCHESTRATOR = 'orchestrator',
  SCIENCE = 'science',
  EDUCATION = 'education',
  ACCESSIBILITY = 'accessibility',
  HEALTH = 'health',
  BUSINESS = 'business',
  TECHNOLOGY = 'technology',
}

export interface AgentConfig {
  id: AgentId;
  name: string;
  description: string;
  icon: string;
  color: string;
  systemInstruction: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  agentId?: AgentId; // The agent that generated this message
  isThinking?: boolean;
  attachments?: {
    type: 'image' | 'file';
    data: string; // base64
  }[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface SavedSnippet {
  id: string;
  type: 'code' | 'text';
  content: string;
  title: string;
  agentId: AgentId;
  timestamp: number;
}

export interface UserProfile {
  name: string;
  role: string;
  bio: string;
  avatar: string | null; // base64 or url
  stats: {
    tasksCompleted: number;
    sessionsStarted: number;
    favAgent: AgentId;
    agentUsage: Record<string, number>;
  };
  preferences: {
    publicProfile: boolean;
    dataTraining: boolean;
    twoFactor: boolean;
  };
  savedSnippets: SavedSnippet[];
  activeChatHistory: Message[];
  lastActiveAgentId: AgentId | null;
  agentHistories: Record<string, Message[]>;
}
