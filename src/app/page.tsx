'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Blob3D from '@/components/Blob3D';
import InputBar from '@/components/InputBar';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [aiState, setAiState] = useState<'idle' | 'thinking' | 'speaking'>('idle');
  const [aiName] = useState(process.env.NEXT_PUBLIC_AI_NAME || 'Nexus AI');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSendMessage = async (message: string, files?: File[]) => {
    console.log('Message:', message);

    setAiState('thinking');
    setTimeout(() => {
      setAiState('speaking');
      setTimeout(() => {
        setAiState('idle');
      }, 3000);
    }, 2000);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-purple-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Background with integrated stats as HUD elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* RAM Usage HUD - floating at top-left */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-8 left-8 px-3 py-1.5 glassmorphism rounded-full text-xs font-mono"
        >
          <span className="text-cyan-400">4.2 GB / 16 GB</span>
        </motion.div>

        {/* CPU Load HUD - floating at top-right */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-8 right-8 px-3 py-1.5 glassmorphism rounded-full text-xs font-mono"
        >
          <span className="text-purple-400">18%</span>
        </motion.div>

        {/* Uptime HUD - floating center-left */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-8 top-1/2 -translate-y-0 px-3 py-1.5 glassmorphism rounded-full text-xs font-mono"
        >
          <span className="text-pink-400">02:45:12</span>
        </motion.div>

        {/* Stage HUD - floating center-top */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 glassmorphism rounded-full text-xs"
        >
          <span className="text-yellow-400">Idle</span>
          <div className="w-2 h-2 rounded-full bg-green-400 inline-block ml-2 animate-pulse" />
        </motion.div>

        {/* Background gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/2 w-[600px] h-[600px] bg-cyan-500/3 rounded-full blur-3xl" />
      </div>

      {/* Header with AI name and Voice/Human toggle */}
      <Header aiName={aiName} voiceEnabled={voiceEnabled} onToggleVoice={() => setVoiceEnabled(!voiceEnabled)} />

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-4 pb-24 gap-8">
        {/* 3D Blob Visualizer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full max-w-2xl md:w-[500px]"
        >
          <Blob3D state={aiState} />
        </motion.div>

        {/* Status indicator below blob */}
        <AnimatePresence mode="wait">
          <motion.div
            key={aiState}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                aiState === 'idle' ? 'bg-green-400' :
                aiState === 'thinking' ? 'bg-yellow-400 animate-pulse' :
                'bg-cyan-400 animate-pulse'
              }`} />
              <span className="text-sm text-gray-400 capitalize">{aiState}</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Input Bar - at bottom with microphone inside */}
        <InputBar onSendMessage={handleSendMessage} />
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-4 text-xs text-gray-600">
        Powered by {aiName} • Advanced AI Assistant
      </footer>
    </div>
  );
}