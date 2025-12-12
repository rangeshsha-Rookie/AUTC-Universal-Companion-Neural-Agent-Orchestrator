
import React, { useState } from 'react';
import { SavedSnippet, AgentId } from '../types';
import { AGENTS } from '../constants';
import ReactMarkdown from 'react-markdown';

interface KnowledgeBaseProps {
  snippets: SavedSnippet[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<SavedSnippet>) => void;
  onDiscuss: (text: string) => void;
  onCreate: (snippet: SavedSnippet) => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ snippets, onDelete, onUpdate, onDiscuss, onCreate }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<AgentId | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Creation State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [newSnippet, setNewSnippet] = useState<{
    title: string;
    content: string;
    type: 'text' | 'code';
    agentId: AgentId;
  }>({
    title: '',
    content: '',
    type: 'text',
    agentId: AgentId.ORCHESTRATOR
  });

  // Filter Logic
  const filteredSnippets = snippets.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.content.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || item.agentId === filter;
    return matchesSearch && matchesFilter;
  });

  // Unique agents present in snippets for filter tabs
  const activeAgents = Array.from(new Set(snippets.map(s => s.agentId)));

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleStartEdit = (snippet: SavedSnippet) => {
    setEditingId(snippet.id);
    setEditTitle(snippet.title);
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim()) {
      onUpdate(id, { title: editTitle });
    }
    setEditingId(null);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(snippets, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autc-memory-bank-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreateSubmit = () => {
    if (!newSnippet.title.trim() || !newSnippet.content.trim()) return;

    const snippet: SavedSnippet = {
      id: Date.now().toString(),
      title: newSnippet.title,
      content: newSnippet.content,
      type: newSnippet.type,
      agentId: newSnippet.agentId,
      timestamp: Date.now()
    };

    onCreate(snippet);
    setIsCreateModalOpen(false);
    setNewSnippet({ // Reset
      title: '',
      content: '',
      type: 'text',
      agentId: AgentId.ORCHESTRATOR
    });
  };

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-dark-bg relative">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <span className="text-neon-cyan">🧠</span> Neural Memory Bank
            </h2>
            <p className="text-gray-400">Archived knowledge, code snippets, and manual notes.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg flex items-center gap-2 transition-colors border border-white/5"
              title="How to use Memory Bank"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan hover:text-white rounded-lg flex items-center gap-2 transition-colors border border-neon-cyan/30 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Memory
            </button>
            <button 
              onClick={handleExport}
              disabled={snippets.length === 0}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Backup
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="space-y-4 sticky top-0 z-20 bg-dark-bg/95 backdrop-blur py-2">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search neural archives..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-dark-card border border-white/10 rounded-xl px-10 py-3 text-white focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/50"
            />
            <svg className="w-5 h-5 text-gray-500 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === 'all' ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:text-white'}`}
            >
              All Memories
            </button>
            {activeAgents.map(agentId => (
              <button 
                key={agentId}
                onClick={() => setFilter(agentId)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 border ${filter === agentId ? `${AGENTS[agentId].color} border-current bg-white/5` : 'border-transparent bg-white/5 text-gray-400 hover:text-white'}`}
              >
                <span>{AGENTS[agentId].icon}</span>
                <span>{AGENTS[agentId].name.replace(' Agent', '')}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        {filteredSnippets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5">
            <div className="text-6xl mb-4 opacity-20">📂</div>
            <p className="text-gray-500">No matching memories found.</p>
            <p className="text-xs text-gray-600 mt-2">Create a new memory or save one from chat.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSnippets.map((item: SavedSnippet) => {
              const agent = AGENTS[item.agentId as AgentId] || AGENTS[AgentId.TECHNOLOGY];
              return (
                <div key={item.id} className="bg-dark-card border border-white/10 rounded-xl overflow-hidden hover:border-neon-cyan/30 transition-all group flex flex-col h-full shadow-lg relative">
                  <div className={`h-1 w-full ${agent.color.replace('text-', 'bg-')}`}></div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Card Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{agent.icon}</span>
                        <span className={`text-xs font-bold uppercase ${agent.color}`}>{agent.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 text-gray-500 hover:text-white transition-colors rounded hover:bg-white/5"
                          title="Rename"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button 
                          onClick={() => onDelete(item.id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded hover:bg-red-500/10"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Title Area */}
                    {editingId === item.id ? (
                      <div className="mb-3 flex gap-2">
                        <input 
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 bg-black border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-neon-cyan outline-none"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(item.id)}
                        />
                        <button onClick={() => handleSaveEdit(item.id)} className="text-green-500 hover:text-green-400">✓</button>
                      </div>
                    ) : (
                      <h3 
                        className="font-bold text-white mb-2 line-clamp-2 h-14 cursor-pointer hover:text-neon-cyan transition-colors"
                        onClick={() => handleStartEdit(item)}
                      >
                        {item.title}
                      </h3>
                    )}

                    {/* Content Preview */}
                    <div className="flex-1 bg-black/30 rounded-lg p-3 text-xs text-gray-300 font-mono overflow-hidden relative border border-white/5 group-hover:border-white/10 transition-colors">
                      <div className="absolute inset-0 overflow-y-auto p-3 scrollbar-hide">
                         {item.type === 'code' ? (
                           <pre className="whitespace-pre-wrap break-all">{item.content}</pre>
                         ) : (
                           <ReactMarkdown>{item.content}</ReactMarkdown>
                         )}
                      </div>
                      {/* Fade out bottom */}
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center gap-2">
                       <span className="text-[10px] text-gray-600 font-mono">{new Date(item.timestamp).toLocaleDateString()}</span>
                       
                       <div className="flex gap-2">
                         <button 
                           onClick={() => handleCopy(item.content)}
                           className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white transition-colors"
                         >
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                           Copy
                         </button>

                         <button 
                           onClick={() => onDiscuss(item.content)}
                           className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neon-cyan/10 hover:bg-neon-cyan/20 text-xs text-neon-cyan hover:text-white border border-neon-cyan/20 hover:border-neon-cyan/40 transition-all"
                         >
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                           Discuss
                         </button>
                       </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-dark-card border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-neon-cyan">ℹ️</span> Using the Memory Bank
              </h3>
              <button onClick={() => setIsHelpOpen(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-8 space-y-8 overflow-y-auto">
              
              <section>
                <h4 className="text-lg font-bold text-white mb-3">1. Saving Memories</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-black/30 rounded-xl border border-white/10">
                    <div className="font-bold text-neon-cyan mb-1">From Chat</div>
                    <p className="text-sm text-gray-400">
                      When chatting with an Agent, click the <span className="inline-block p-1 bg-white/10 rounded mx-1"><svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg></span> icon on any message to instantly save it. The system automatically detects code blocks.
                    </p>
                  </div>
                  <div className="p-4 bg-black/30 rounded-xl border border-white/10">
                    <div className="font-bold text-neon-green mb-1">Manual Entry</div>
                    <p className="text-sm text-gray-400">
                      Click the <span className="text-white font-bold">Add Memory</span> button on this page to paste your own notes, code snippets, or reusable prompts.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-lg font-bold text-white mb-3">2. Using Memories (The 'Discuss' Feature)</h4>
                <p className="text-gray-400 mb-3">
                  The Memory Bank isn't just for storage; it's for <strong>active context</strong>.
                </p>
                <div className="flex items-start gap-4 p-4 bg-neon-cyan/5 border border-neon-cyan/20 rounded-xl">
                  <div className="p-2 bg-neon-cyan/20 rounded-lg text-neon-cyan">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  </div>
                  <div>
                    <h5 className="font-bold text-white">Inject Context</h5>
                    <p className="text-sm text-gray-400 mt-1">
                      Clicking <span className="text-neon-cyan font-bold">Discuss</span> on any card immediately switches you to the Chat interface and <strong>pre-loads that memory</strong> into your input bar. This lets you say "Explain this code" or "Update this plan" without copying and pasting manually.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-lg font-bold text-white mb-3">3. Managing & Exporting</h4>
                <ul className="list-disc pl-5 space-y-2 text-gray-400 text-sm">
                  <li>Use the <strong>Backup</strong> button to download a JSON file of all your memories. Useful for transferring data between devices.</li>
                  <li>Click on any memory title to <strong>Rename</strong> it for better organization.</li>
                  <li>Use the Agent tabs (e.g., Technology, Science) to <strong>Filter</strong> memories by their source.</li>
                </ul>
              </section>

            </div>
            
            <div className="p-6 border-t border-white/10 bg-black/20 text-center">
              <button 
                onClick={() => setIsHelpOpen(false)}
                className="px-8 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-dark-card border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Create New Memory</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">Title</label>
                <input 
                  type="text"
                  value={newSnippet.title}
                  onChange={(e) => setNewSnippet(prev => ({...prev, title: e.target.value}))}
                  placeholder="e.g. Project Alpha Notes"
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">Type</label>
                    <select 
                      value={newSnippet.type}
                      onChange={(e) => setNewSnippet(prev => ({...prev, type: e.target.value as 'text' | 'code'}))}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan outline-none appearance-none"
                    >
                      <option value="text">Text / Note</option>
                      <option value="code">Code Snippet</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">Category</label>
                    <select 
                      value={newSnippet.agentId}
                      onChange={(e) => setNewSnippet(prev => ({...prev, agentId: e.target.value as AgentId}))}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-neon-cyan outline-none appearance-none"
                    >
                      {Object.values(AGENTS).map(agent => (
                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                      ))}
                    </select>
                 </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1 uppercase">Content</label>
                <textarea 
                  value={newSnippet.content}
                  onChange={(e) => setNewSnippet(prev => ({...prev, content: e.target.value}))}
                  placeholder={newSnippet.type === 'code' ? "const a = 1; // Paste code here" : "Enter your notes here..."}
                  className="w-full h-40 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-neon-cyan outline-none resize-none font-mono text-sm"
                />
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateSubmit}
                disabled={!newSnippet.title || !newSnippet.content}
                className="px-6 py-2 bg-neon-cyan text-black font-bold rounded-lg hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Memory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
