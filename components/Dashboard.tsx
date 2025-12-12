import React from 'react';
import { AGENTS } from '../constants';
import { AgentId } from '../types';

interface DashboardProps {
  onAgentSelect: (agentId: AgentId) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onAgentSelect }) => {
  const agentsList = Object.values(AGENTS).filter(a => a.id !== AgentId.ORCHESTRATOR);

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-dark-bg to-black">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-block p-2 rounded-full bg-white/5 border border-white/10 mb-4">
            <span className="text-neon-cyan font-mono text-sm tracking-wider">SYSTEM ONLINE • V 2.4.0</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            How can the <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">Collective</span> help?
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            AUTC uses an advanced orchestration layer to route your tasks to specialized AI agents. Just ask, and the brain decides who answers.
          </p>
        </div>

        {/* Input Trigger */}
        <div className="max-w-3xl mx-auto relative group cursor-pointer" onClick={() => onAgentSelect(AgentId.ORCHESTRATOR)}>
          <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-blue rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative px-8 py-5 bg-dark-card border border-white/10 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-colors">
            <span className="text-2xl animate-pulse">✨</span>
            <span className="text-gray-400 text-lg">Start a new universal session...</span>
          </div>
        </div>

        {/* Agents Grid */}
        <div>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-2 h-8 bg-neon-purple rounded-full"></span>
            Specialized Agents
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agentsList.map((agent) => (
              <div 
                key={agent.id}
                onClick={() => onAgentSelect(agent.id)}
                className="group relative p-6 glass rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
              >
                {/* Hover Glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500`}></div>

                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-3xl mb-4 bg-white/5 ${agent.color} border border-white/10`}>
                    {agent.icon}
                  </div>
                  <h4 className={`text-xl font-bold mb-2 ${agent.color}`}>{agent.name}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{agent.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;