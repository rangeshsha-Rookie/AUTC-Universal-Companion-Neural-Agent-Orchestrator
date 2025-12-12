
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import Settings from './components/Settings';
import Profile from './components/Profile';
import KnowledgeBase from './components/KnowledgeBase';
import { AgentId, UserProfile, SavedSnippet, Message } from './types';

// Default User Data
const DEFAULT_USER: UserProfile = {
  name: 'Traveler',
  role: 'Task Commander',
  bio: 'Exploring the digital frontier of the AUTC system.',
  avatar: null,
  stats: {
    tasksCompleted: 0,
    sessionsStarted: 0,
    favAgent: AgentId.TECHNOLOGY,
    agentUsage: {
      [AgentId.TECHNOLOGY]: 5, // Initial baseline
      [AgentId.EDUCATION]: 2
    }
  },
  preferences: {
    publicProfile: false,
    dataTraining: true,
    twoFactor: false
  },
  savedSnippets: [],
  activeChatHistory: [],
  lastActiveAgentId: null,
  agentHistories: {}
};

const App: React.FC = () => {
  const [currentView, setView] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // Settings State
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const [initialChatInput, setInitialChatInput] = useState<string | undefined>(undefined);

  // User State with Persistence & Robust Migration
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('autc_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with default to ensure all fields (like activeChatHistory, agentHistories) exist
        return { 
          ...DEFAULT_USER, 
          ...parsed,
          // Ensure agentHistories exists even if loading old data
          agentHistories: parsed.agentHistories || {} 
        };
      } catch (e) {
        console.error("Failed to parse user data", e);
        return DEFAULT_USER;
      }
    }
    return DEFAULT_USER;
  });

  // Initialize agent selection from persisted user state
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId | null>(user.lastActiveAgentId || null);

  useEffect(() => {
    localStorage.setItem('autc_user', JSON.stringify(user));
  }, [user]);

  const handleUpdateUser = (updatedData: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  const handleTaskComplete = (agentId: AgentId) => {
    setUser(prev => {
      // Update usage count
      const currentUsage = prev.stats.agentUsage[agentId] || 0;
      const newUsage = { ...prev.stats.agentUsage, [agentId]: currentUsage + 1 };
      
      // Calculate new favorite agent
      let maxUsage = 0;
      let newFav = prev.stats.favAgent;
      
      Object.entries(newUsage).forEach(([id, value]) => {
        const count = value as number;
        if (count > maxUsage) {
          maxUsage = count;
          newFav = id as AgentId;
        }
      });

      return {
        ...prev,
        stats: {
          ...prev.stats,
          tasksCompleted: prev.stats.tasksCompleted + 1,
          agentUsage: newUsage,
          favAgent: newFav
        }
      };
    });
  };

  const handleSaveSnippet = (snippet: SavedSnippet) => {
    setUser(prev => ({
      ...prev,
      savedSnippets: [snippet, ...prev.savedSnippets]
    }));
  };

  const handleDeleteSnippet = (id: string) => {
    setUser(prev => ({
      ...prev,
      savedSnippets: prev.savedSnippets.filter(s => s.id !== id)
    }));
  };

  const handleUpdateSnippet = (id: string, updates: Partial<SavedSnippet>) => {
    setUser(prev => ({
      ...prev,
      savedSnippets: prev.savedSnippets.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  };

  const handleDiscussSnippet = (text: string) => {
    setInitialChatInput(text);
    setView('chat');
  };

  const handleUpdateChatHistory = (messages: Message[]) => {
    setUser(prev => ({
      ...prev,
      activeChatHistory: messages
    }));
  };

  const handleAgentSelect = (agentId: AgentId) => {
    // Treat 'null' selectedAgentId as ORCHESTRATOR
    const currentAgentKey = selectedAgentId || AgentId.ORCHESTRATOR;
    const nextAgentKey = agentId;

    // Even if clicking the same agent, ensure we go to chat view
    if (currentAgentKey === nextAgentKey && currentView === 'chat') {
      return; 
    }

    const newAgentIdValue = agentId === AgentId.ORCHESTRATOR ? null : agentId;

    setUser(prev => {
        const prevAgentKey = prev.lastActiveAgentId || AgentId.ORCHESTRATOR;
        
        // 1. Snapshot current chat to the agent's history slot
        const updatedHistories = {
            ...prev.agentHistories,
            [prevAgentKey]: prev.activeChatHistory
        };

        // 2. Load the target agent's history
        const nextHistory = updatedHistories[nextAgentKey] || [];

        return {
            ...prev,
            agentHistories: updatedHistories,
            activeChatHistory: nextHistory,
            lastActiveAgentId: newAgentIdValue,
            stats: {
                ...prev.stats,
                sessionsStarted: prevAgentKey !== nextAgentKey ? prev.stats.sessionsStarted + 1 : prev.stats.sessionsStarted,
            }
        };
    });

    setSelectedAgentId(newAgentIdValue);
    setView('chat');
    setInitialChatInput(undefined);
  };

  const handleClearHistory = () => {
    setUser(prev => {
        const currentKey = prev.lastActiveAgentId || AgentId.ORCHESTRATOR;
        return { 
            ...prev, 
            activeChatHistory: [],
            agentHistories: {
                ...prev.agentHistories,
                [currentKey]: []
            }
        };
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dark-bg text-white font-sans selection:bg-neon-cyan selection:text-black">
      <Sidebar 
        currentView={currentView} 
        setView={setView} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onAgentSelect={handleAgentSelect}
        selectedAgentId={selectedAgentId}
        user={user}
      />

      <main className="flex-1 flex flex-col relative w-full h-full">
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-white/10 flex items-center justify-between glass z-30">
          <span className="font-bold text-lg bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">AUTC</span>
          <button onClick={() => setIsMobileOpen(true)} className="p-2 text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>

        {/* View Content */}
        <div className="flex-1 overflow-hidden relative">
          {currentView === 'dashboard' && <Dashboard onAgentSelect={handleAgentSelect} />}
          
          {currentView === 'profile' && (
            <Profile 
              user={user} 
              onUpdateUser={handleUpdateUser} 
            />
          )}

          {currentView === 'knowledge' && (
            <KnowledgeBase 
              snippets={user.savedSnippets}
              onDelete={handleDeleteSnippet}
              onUpdate={handleUpdateSnippet}
              onDiscuss={handleDiscussSnippet}
              onCreate={handleSaveSnippet}
            />
          )}

          {currentView === 'chat' && (
            <ChatInterface 
              initialAgentId={selectedAgentId} 
              onReset={() => handleAgentSelect(AgentId.ORCHESTRATOR)}
              isTTSEnabled={isTTSEnabled}
              onTaskComplete={handleTaskComplete}
              onSaveSnippet={handleSaveSnippet}
              initialInput={initialChatInput}
              messages={user.activeChatHistory || []} 
              onUpdateMessages={handleUpdateChatHistory}
              onClearMessages={handleClearHistory}
            />
          )}
          
          {currentView === 'settings' && (
            <Settings 
              isTTSEnabled={isTTSEnabled} 
              onToggleTTS={() => setIsTTSEnabled(!isTTSEnabled)} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
