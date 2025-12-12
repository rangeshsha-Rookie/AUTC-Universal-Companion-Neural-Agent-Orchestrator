
import React from 'react';
import { AGENTS } from '../constants';
import { AgentId, UserProfile } from '../types';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onAgentSelect: (agentId: AgentId) => void;
  selectedAgentId: AgentId | null;
  user: UserProfile; // Added user prop
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setView, 
  isMobileOpen, 
  setIsMobileOpen,
  onAgentSelect,
  selectedAgentId,
  user
}) => {
  const handleAgentClick = (id: AgentId) => {
    onAgentSelect(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <div className={`
        fixed top-0 left-0 bottom-0 w-64 bg-dark-bg border-r border-dark-border z-50 transform transition-transform duration-300
        md:translate-x-0 md:static md:flex md:flex-col glass
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent mb-1">
            AUTC
          </h1>
          <p className="text-xs text-gray-500 tracking-widest uppercase">Universal Companion</p>
        </div>

        <nav className="px-4 space-y-2 mt-4 flex-1 overflow-y-auto">
          <button
            onClick={() => { setView('dashboard'); setIsMobileOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200
              ${currentView === 'dashboard' ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}
            `}
          >
            <span>⚡</span> Dashboard
          </button>
          
          <button
            onClick={() => { setView('profile'); setIsMobileOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200
              ${currentView === 'profile' ? 'bg-white/10 text-white border border-white/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}
            `}
          >
            <span>👤</span> Profile
          </button>

          <button
            onClick={() => { setView('knowledge'); setIsMobileOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200
              ${currentView === 'knowledge' ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}
            `}
          >
            <span>🧠</span> Memory Bank
          </button>

          <button
            onClick={() => { onAgentSelect(AgentId.ORCHESTRATOR); setIsMobileOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-200
              ${currentView === 'chat' && !selectedAgentId ? 'bg-neon-purple/10 text-neon-purple border border-neon-purple/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}
            `}
          >
            <span>💬</span> Universal Chat
          </button>
          
          <div className="pt-6 pb-2 px-4 text-xs font-bold text-gray-600 uppercase">
            Specialist Modules
          </div>
          
          <div className="space-y-1">
            {Object.values(AGENTS).filter(a => a.id !== AgentId.ORCHESTRATOR).map((agent) => (
              <button 
                key={agent.id} 
                onClick={() => handleAgentClick(agent.id)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors rounded-lg
                  ${selectedAgentId === agent.id && currentView === 'chat'
                    ? `bg-white/10 ${agent.color} border border-white/5` 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'}
                `}
              >
                <span>{agent.icon}</span>
                <span>{agent.name.replace(' Agent', '')}</span>
                {selectedAgentId === agent.id && currentView === 'chat' && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-white/5">
           <button 
             onClick={() => { setView('settings'); setIsMobileOpen(false); }}
             className={`w-full text-left px-4 py-3 mb-2 rounded-lg flex items-center gap-3 transition-all duration-200
               ${currentView === 'settings' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}
             `}
           >
             <span>⚙️</span> Settings
           </button>
           
           <div className="flex items-center gap-3 px-2 py-2 mt-2">
              <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border border-white/20">
                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">👤</div>}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-sm font-bold text-white truncate">{user.name}</div>
                <div className="text-xs text-neon-cyan truncate">{user.role}</div>
              </div>
           </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
