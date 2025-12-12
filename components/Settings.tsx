import React from 'react';

interface SettingsProps {
  isTTSEnabled: boolean;
  onToggleTTS: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isTTSEnabled, onToggleTTS }) => {
  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-dark-bg">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">System Configuration</h2>
          <p className="text-gray-400">Manage your AUTC preferences and neural link status.</p>
        </div>

        <div className="space-y-6">
          {/* API Status */}
          <div className="p-5 bg-dark-card border border-white/10 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-semibold text-white">Neural Uplink Status</h3>
                <p className="text-xs text-gray-500">Connected to Gemini 2.5 Flash</p>
              </div>
            </div>
            <span className="text-green-500 text-sm font-mono">OPERATIONAL</span>
          </div>

          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Preferences</h3>
            
            <div className="p-4 glass rounded-lg flex items-center justify-between">
              <div>
                <div className="text-white">Auto-Orchestration</div>
                <div className="text-xs text-gray-500">Let the system decide best agent automatically</div>
              </div>
              <div className="w-10 h-5 bg-neon-cyan rounded-full relative cursor-pointer opacity-80">
                <div className="absolute right-1 top-1 w-3 h-3 bg-black rounded-full shadow-sm"></div>
              </div>
            </div>

            <div 
              className={`p-4 glass rounded-lg flex items-center justify-between cursor-pointer transition-colors ${isTTSEnabled ? 'border-neon-cyan/30 bg-neon-cyan/5' : 'hover:bg-white/5'}`}
              onClick={onToggleTTS}
            >
              <div>
                <div className={`transition-colors ${isTTSEnabled ? 'text-neon-cyan' : 'text-white'}`}>Voice Output (TTS)</div>
                <div className="text-xs text-gray-500">Read responses aloud automatically</div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${isTTSEnabled ? 'bg-neon-cyan' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-black rounded-full shadow-sm transition-all duration-300 ${isTTSEnabled ? 'left-6' : 'left-1'}`}></div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-white/5">
             <button 
               onClick={() => window.location.reload()}
               className="w-full p-3 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
               Reset System Memory
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;