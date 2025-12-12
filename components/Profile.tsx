
import React, { useState, useRef } from 'react';
import { UserProfile, AgentId } from '../types';
import { AGENTS } from '../constants';

interface ProfileProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.name,
    role: user.role,
    bio: user.bio,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdateUser(editForm);
    setIsEditing(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateUser({ avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTogglePreference = (key: keyof UserProfile['preferences']) => {
    onUpdateUser({
      preferences: {
        ...user.preferences,
        [key]: !user.preferences[key]
      }
    });
  };

  const favAgentConfig = AGENTS[user.stats.favAgent] || AGENTS[AgentId.TECHNOLOGY];

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-dark-bg">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header / Cover Area */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-gray-900 to-black border border-white/10 shadow-2xl">
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-r from-neon-cyan/20 via-neon-purple/20 to-neon-blue/20 blur-xl"></div>
          
          <div className="relative p-8 flex flex-col md:flex-row items-start md:items-end gap-6 pt-20">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-2xl border-4 border-dark-bg shadow-xl overflow-hidden bg-gray-800 flex items-center justify-center relative">
                {user.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">👤</span>
                )}
                
                {/* Upload Overlay */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 border-4 border-dark-bg rounded-full"></div>
            </div>

            {/* Info */}
            <div className="flex-1 w-full">
              <div className="flex justify-between items-start">
                <div className="w-full">
                  {isEditing ? (
                    <div className="space-y-3 mb-2 max-w-md">
                      <input 
                        type="text" 
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-white font-bold text-2xl focus:border-neon-cyan outline-none"
                        placeholder="Name"
                      />
                      <input 
                        type="text" 
                        value={editForm.role}
                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                        className="w-full bg-white/5 border border-white/20 rounded px-3 py-2 text-neon-cyan font-mono focus:border-neon-cyan outline-none"
                        placeholder="Role / Title"
                      />
                    </div>
                  ) : (
                    <>
                      <h1 className="text-3xl md:text-4xl font-bold text-white">{user.name}</h1>
                      <p className="text-neon-cyan font-mono text-lg">{user.role}</p>
                    </>
                  )}
                </div>
                
                <button 
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isEditing ? 'bg-green-500 text-black hover:bg-green-400' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                >
                  {isEditing ? 'Save Profile' : 'Edit Profile'}
                </button>
              </div>
            </div>
          </div>

          <div className="px-8 pb-8 pt-4">
            {isEditing ? (
              <textarea 
                value={editForm.bio}
                onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                className="w-full h-24 bg-white/5 border border-white/20 rounded p-3 text-gray-300 focus:border-neon-cyan outline-none resize-none"
                placeholder="Enter your bio..."
              />
            ) : (
              <p className="text-gray-400 max-w-2xl leading-relaxed">{user.bio}</p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-dark-card border border-white/10 rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
            </div>
            <h3 className="text-gray-500 text-sm font-mono uppercase tracking-wider mb-2">Sessions Initiated</h3>
            <p className="text-4xl font-bold text-white">{user.stats.sessionsStarted}</p>
            <div className="mt-4 text-xs text-neon-blue">
              Conversations started
            </div>
          </div>

          <div className="bg-dark-card border border-white/10 rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            </div>
            <h3 className="text-gray-500 text-sm font-mono uppercase tracking-wider mb-2">Tasks Completed</h3>
            <p className="text-4xl font-bold text-white">{user.stats.tasksCompleted}</p>
            <div className="mt-4 text-xs text-green-500">
              Total interactions
            </div>
          </div>

          <div className="bg-dark-card border border-white/10 rounded-xl p-6 relative overflow-hidden group">
            <div className={`absolute inset-0 opacity-5 ${favAgentConfig.color} bg-current`}></div>
            <h3 className="text-gray-500 text-sm font-mono uppercase tracking-wider mb-2">Favorite Link</h3>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{favAgentConfig.icon}</span>
              <span className={`text-xl font-bold ${favAgentConfig.color}`}>{favAgentConfig.name}</span>
            </div>
            <p className="mt-4 text-xs text-gray-400">
              Most frequent collaboration partner
            </p>
          </div>
        </div>

        {/* Activity or Extra Settings */}
        <div className="bg-dark-card border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Neural Link Settings</h3>
            <div className="space-y-4">
                <div 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => handleTogglePreference('publicProfile')}
                >
                    <span className={user.preferences.publicProfile ? 'text-white' : 'text-gray-400'}>Public Profile Visibility</span>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${user.preferences.publicProfile ? 'bg-neon-cyan' : 'bg-gray-700'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-black rounded-full shadow-sm transition-all duration-300 ${user.preferences.publicProfile ? 'left-6' : 'left-1'}`}></div>
                    </div>
                </div>
                
                <div 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => handleTogglePreference('dataTraining')}
                >
                    <span className={user.preferences.dataTraining ? 'text-white' : 'text-gray-400'}>Allow Data Training</span>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${user.preferences.dataTraining ? 'bg-neon-cyan' : 'bg-gray-700'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-black rounded-full shadow-sm transition-all duration-300 ${user.preferences.dataTraining ? 'left-6' : 'left-1'}`}></div>
                    </div>
                </div>
                
                <div 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => handleTogglePreference('twoFactor')}
                >
                    <span className={user.preferences.twoFactor ? 'text-white' : 'text-gray-400'}>Two-Factor Authentication</span>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${user.preferences.twoFactor ? 'bg-neon-cyan' : 'bg-gray-700'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-black rounded-full shadow-sm transition-all duration-300 ${user.preferences.twoFactor ? 'left-6' : 'left-1'}`}></div>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
