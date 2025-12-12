
import React, { useState, useRef, useEffect } from 'react';
import { Message, AgentId, SavedSnippet } from '../types';
import { orchestrateRequest, runAgent } from '../services/geminiService';
import { AGENTS } from '../constants';
import AgentBadge from './AgentBadge';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  initialAgentId: AgentId | null;
  onReset: () => void;
  isTTSEnabled: boolean;
  onTaskComplete: (agentId: AgentId) => void;
  onSaveSnippet: (snippet: SavedSnippet) => void;
  initialInput?: string;
  messages: Message[];
  onUpdateMessages: (messages: Message[]) => void;
  onClearMessages: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  initialAgentId, 
  onReset, 
  isTTSEnabled, 
  onTaskComplete, 
  onSaveSnippet,
  initialInput,
  messages,
  onUpdateMessages,
  onClearMessages
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orchestratorState, setOrchestratorState] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  
  // State for Code Previews (Artifacts)
  const [previewModes, setPreviewModes] = useState<Record<string, boolean>>({});

  // Refs for scrolling and inputs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load initial input if provided (from Memory Bank "Discuss")
  useEffect(() => {
    if (initialInput) {
      setInput(`Context from Memory Bank:\n\n${initialInput}\n\nMy Request: `);
      // Auto-focus the textarea when discussion starts
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(1000, 1000); // Set cursor to end
      }, 100);
    }
  }, [initialInput]);

  // Reset previews/TTS when agent changes, but DO NOT wipe history (handled by parent logic if needed)
  useEffect(() => {
    setPreviewModes({});
    window.speechSynthesis.cancel();
  }, [initialAgentId]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, orchestratorState, previewModes]);

  // Helper to extract code for preview
  const extractCode = (text: string): { type: string, code: string } | null => {
    // Regex for HTML/SVG/CSS blocks
    const match = text.match(/```(html|svg|xml)([\s\S]*?)```/);
    if (match && match[2]) {
      return { type: match[1], code: match[2].trim() };
    }
    return null;
  };

  const speakText = (text: string, msgId: string) => {
    window.speechSynthesis.cancel();
    
    if (currentlySpeakingId === msgId) {
      setCurrentlySpeakingId(null);
      return; 
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      (v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Female')) && v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en'));
    
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.onend = () => setCurrentlySpeakingId(null);
    utterance.onerror = () => setCurrentlySpeakingId(null);
    
    setCurrentlySpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSaveMessage = (msg: Message) => {
    const codeMatch = extractCode(msg.text);
    const isCode = !!codeMatch;
    
    // Fallback for user messages or missing agentId
    const effectiveAgentId = msg.agentId || initialAgentId || AgentId.ORCHESTRATOR;

    const snippet: SavedSnippet = {
      id: Date.now().toString(),
      type: isCode ? 'code' : 'text',
      content: isCode ? codeMatch!.code : msg.text,
      title: isCode ? `Snippet from ${AGENTS[effectiveAgentId].name}` : msg.text.slice(0, 40) + '...',
      agentId: effectiveAgentId,
      timestamp: Date.now()
    };

    onSaveSnippet(snippet);
    alert("Saved to Memory Bank!");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExport = () => {
    if (messages.length === 0) return;
    const exportData = {
      meta: {
        timestamp: new Date().toISOString(),
        agentMode: initialAgentId || 'Universal Orchestrator',
      },
      messages: messages
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autc-session.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearHistory = () => {
    window.speechSynthesis.cancel();
    onClearMessages();
    setShowClearConfirm(false);
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedImage) || isLoading) return;
    window.speechSynthesis.cancel();
    setCurrentlySpeakingId(null);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
      attachments: attachedImage ? [{ type: 'image', data: attachedImage }] : undefined
    };

    const newMessagesAfterUser = [...messages, userMsg];
    onUpdateMessages(newMessagesAfterUser);
    
    setInput('');
    const currentImage = attachedImage;
    setAttachedImage(null);
    setIsLoading(true);

    try {
      let targetAgentId = initialAgentId;

      if (!targetAgentId) {
        setOrchestratorState("Analyzing intent...");
        const { agentId } = await orchestrateRequest(userMsg.text, newMessagesAfterUser);
        targetAgentId = agentId;
        setOrchestratorState(`Routing to ${agentId.toUpperCase()} Agent...`);
        await new Promise(r => setTimeout(r, 600)); 
      }

      const responseText = await runAgent(
        targetAgentId!, 
        userMsg.text, 
        newMessagesAfterUser, 
        currentImage || undefined
      );

      onTaskComplete(targetAgentId!);

      const aiMsgId = (Date.now() + 1).toString();
      const aiMsg: Message = {
        id: aiMsgId,
        role: 'model',
        text: responseText,
        timestamp: Date.now(),
        agentId: targetAgentId!
      };

      onUpdateMessages([...newMessagesAfterUser, aiMsg]);
      
      // Auto-open preview for simple code
      const code = extractCode(responseText);
      if (code) {
        setPreviewModes(prev => ({...prev, [aiMsgId]: true}));
      }

      if (isTTSEnabled) {
        speakText(responseText, aiMsgId);
      }

    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "System Error: The orchestration matrix encountered a fault.",
        timestamp: Date.now(),
        agentId: AgentId.ORCHESTRATOR
      };
      onUpdateMessages([...newMessagesAfterUser, errorMsg]);
    } finally {
      setIsLoading(false);
      setOrchestratorState(null);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser does not support Web Speech API");
      return;
    }
    window.speechSynthesis.cancel();
    setCurrentlySpeakingId(null);
    setIsListening(true);
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return (
    <div className="flex flex-col h-full bg-dark-bg relative">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2">
          {initialAgentId ? (
            <>
              <span className="text-xl">{AGENTS[initialAgentId].icon}</span>
              <span className={`font-bold ${AGENTS[initialAgentId].color}`}>{AGENTS[initialAgentId].name} Mode</span>
            </>
          ) : (
            <>
               <span className="text-xl">🧠</span>
               <span className="font-bold text-white">Universal Orchestrator Mode</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {messages.length > 0 && (
            <>
              <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5" title="Export Session JSON">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span className="hidden sm:inline">Export</span>
              </button>
              <button onClick={() => setShowClearConfirm(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all border border-red-500/10" title="Clear Chat History">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </>
          )}
          {initialAgentId && <button onClick={onReset} className="text-xs text-gray-500 hover:text-white underline">Switch to Auto</button>}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-dark-card border border-white/10 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><span className="text-red-500">⚠️</span> Clear History?</h3>
            <div className="flex gap-3 justify-end mt-4">
               <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm">Cancel</button>
               <button onClick={handleClearHistory} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 text-sm font-medium">Delete History</button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30 select-none">
            <div className="text-6xl mb-4 text-neon-cyan animate-pulse-slow">{initialAgentId ? AGENTS[initialAgentId].icon : '🧠'}</div>
            <h2 className="text-2xl font-bold font-mono text-center">{initialAgentId ? `${AGENTS[initialAgentId].name.toUpperCase()} READY` : 'AUTC SYSTEM READY'}</h2>
          </div>
        )}

        {messages.map((msg) => {
          const codeContent = extractCode(msg.text);
          const hasPreview = !!codeContent;
          const isPreviewOpen = previewModes[msg.id];

          return (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'bg-neon-blue/10 border-neon-blue/30' : 'bg-dark-card border-white/10'} border rounded-2xl p-4 backdrop-blur-sm relative shadow-lg`}>
                
                {/* Agent Header (Left) */}
                {msg.role === 'model' && (
                  <div className="mb-2 flex items-center justify-between">
                     {msg.agentId ? <AgentBadge agentId={msg.agentId} /> : <span />}
                     <div className="flex gap-2">
                       {/* Save Button */}
                       <button 
                         onClick={() => handleSaveMessage(msg)}
                         className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-neon-cyan transition-colors"
                         title="Save to Memory Bank"
                       >
                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                       </button>
                       {/* Play Button */}
                       <button 
                         onClick={() => speakText(msg.text, msg.id)}
                         className={`p-1.5 rounded-full transition-colors ${currentlySpeakingId === msg.id ? 'bg-neon-cyan text-black animate-pulse' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
                       >
                         {currentlySpeakingId === msg.id ? <div className="w-3 h-3 bg-black rounded-sm"></div> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>}
                       </button>
                     </div>
                  </div>
                )}

                {/* User Actions (Right) */}
                {msg.role === 'user' && (
                  <div className="mb-2 flex items-center justify-end gap-2">
                     <button 
                       onClick={() => handleSaveMessage(msg)}
                       className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-neon-cyan transition-colors"
                       title="Save to Memory Bank"
                     >
                       <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                     </button>
                  </div>
                )}

                {msg.attachments?.map((att, idx) => (
                  <div key={idx} className="mb-3">
                     <img src={att.data} alt="uploaded" className="max-h-48 rounded-lg border border-white/10" />
                  </div>
                ))}

                {/* Content Area */}
                <div className="prose prose-invert prose-sm max-w-none break-words">
                  {!hasPreview || !isPreviewOpen ? (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  ) : (
                    <div className="w-full">
                       {/* Live Preview Container */}
                       <div className="bg-white rounded-lg overflow-hidden h-64 md:h-96 w-full shadow-inner relative">
                          <iframe 
                            srcDoc={codeContent?.code}
                            className="w-full h-full border-none"
                            title="Code Preview"
                            sandbox="allow-scripts"
                          />
                          <div className="absolute top-0 right-0 bg-black/50 text-white text-[10px] px-2 py-1 rounded-bl">
                            Preview Mode
                          </div>
                       </div>
                    </div>
                  )}
                </div>

                {/* Artifact Toggle for Code */}
                {hasPreview && (
                  <div className="mt-4 flex justify-end">
                    <div className="flex bg-black/50 rounded-lg p-1 border border-white/10">
                      <button 
                        onClick={() => setPreviewModes(prev => ({...prev, [msg.id]: false}))}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!isPreviewOpen ? 'bg-neon-cyan text-black' : 'text-gray-400 hover:text-white'}`}
                      >
                        Code
                      </button>
                      <button 
                        onClick={() => setPreviewModes(prev => ({...prev, [msg.id]: true}))}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${isPreviewOpen ? 'bg-neon-cyan text-black' : 'text-gray-400 hover:text-white'}`}
                      >
                        Live Preview
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="text-[10px] text-gray-500 mt-2 text-right font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="max-w-[70%] space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce delay-100"></div>
                <div className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce delay-200"></div>
                <span className="text-xs font-mono text-neon-cyan ml-2">
                  {orchestratorState || "Processing..."}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-dark-card border-t border-white/5">
        {attachedImage && (
          <div className="absolute bottom-24 left-6 z-10">
            <div className="relative group">
              <img src={attachedImage} className="h-16 w-16 object-cover rounded-lg border border-neon-cyan/50 shadow-[0_0_10px_rgba(0,232,255,0.2)]" />
              <button onClick={() => setAttachedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          </div>
        )}

        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-neon-cyan transition-colors" title="Upload Image"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
          <button onClick={handleVoiceInput} className={`p-3 rounded-xl transition-all duration-300 ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse border border-red-500' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-neon-cyan'}`} title="Voice Input">{isListening ? <div className="w-6 h-6 flex items-center justify-center"><div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div></div> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}</button>
          <div className="flex-1 relative">
            <textarea 
              ref={textareaRef}
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}} 
              placeholder={isListening ? "Listening..." : "Ask the collective... (Try 'Create a button')"} 
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 resize-none h-[52px] max-h-32" 
            />
          </div>
          <button onClick={handleSend} disabled={(!input.trim() && !attachedImage) || isLoading} className={`p-3 rounded-xl transition-all duration-300 ${(!input.trim() && !attachedImage) || isLoading ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-neon-blue text-black hover:shadow-[0_0_15px_rgba(63,140,255,0.5)]'}`}><svg className="w-6 h-6 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
