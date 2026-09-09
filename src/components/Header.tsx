'use client';

import { Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  aiName: string;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

export default function Header({ aiName, voiceEnabled, onToggleVoice }: HeaderProps) {
  return (
    <header className="glassmorphism rounded-b-2xl px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="relative"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 p-0.5">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3v2h2v14H3zm5 8v6h2v7h4v-7h2v-6h-4V9h-2zm5-5c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 4.5c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5zM14 5.5c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5zM16.5 14c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5zM20.5 16.5c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z"/>
                </svg>
              </div>
            </div>
          </motion.div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              {aiName}
            </h1>
            <p className="text-xs text-gray-500">AI Assistant</p>
          </div>
        </div>

        <button
          onClick={onToggleVoice}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
            voiceEnabled
              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 animate-pulse-glow'
              : 'bg-gray-800/50 border border-gray-700'
          }`}
        >
          <motion.div
            animate={voiceEnabled ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {voiceEnabled ? (
              <Mic className="w-4 h-4 text-purple-400" />
            ) : (
              <MicOff className="w-4 h-4 text-gray-500" />
            )}
          </motion.div>
          <span className={`text-sm ${voiceEnabled ? 'text-purple-300' : 'text-gray-500'}`}>
            {voiceEnabled ? 'Voice' : 'Text'}
          </span>
          {voiceEnabled && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-950"
            />
          )}
        </button>
      </div>
    </header>
  );
}