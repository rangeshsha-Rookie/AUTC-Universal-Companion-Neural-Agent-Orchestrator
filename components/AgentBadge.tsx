import React from 'react';
import { AgentId } from '../types';
import { AGENTS } from '../constants';

interface AgentBadgeProps {
  agentId: AgentId;
  className?: string;
  showName?: boolean;
}

const AgentBadge: React.FC<AgentBadgeProps> = ({ agentId, className = "", showName = true }) => {
  const agent = AGENTS[agentId];
  if (!agent) return null;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 ${agent.color} ${className}`}>
      <span className="text-sm">{agent.icon}</span>
      {showName && <span>{agent.name}</span>}
    </div>
  );
};

export default AgentBadge;