'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, VolumeX, Send, Paperclip, FileText, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InputBarProps {
  onSendMessage: (message: string, files?: File[]) => void;
  disabled?: boolean;
}

export default function InputBar({ onSendMessage, disabled }: InputBarProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [voiceListening, setVoiceListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const txtContentRef = useRef<string>('');

  // Initialize speech recognition on mount
  useEffect(() => {
    // Check if SpeechRecognition is available
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        try {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((alternative: any) => alternative.transcript)
            .join('');

          if (transcript.trim()) {
            // Append to message state
            setMessage(prev => prev + ' ' + transcript.trim());

            // Save to input.txt content
            saveToTextFile(transcript);
          }
        } catch (e) {
          console.log('Error processing speech result:', e);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };

      recognitionRef.current.onend = () => {
        if (voiceListening) {
          try { recognitionRef.current.start(); } catch (e) { /* ignore */ }
        }
      };
    }

    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  // Start/stop voice recognition when voiceListening changes
  useEffect(() => {
    if (voiceListening && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Ignore
      }
    } else if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [voiceListening]);

  // Save transcript to input.txt file content
  const saveToTextFile = (text: string) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${text}\n`;
    txtContentRef.current += logEntry;

    // Create a downloadable blob
    try {
      const blob = new Blob([txtContentRef.current], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'input.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.log('Error creating file download:', e);
    }
  };

  // Toggle mute/voice mode
  const toggleVoiceListening = () => {
    setVoiceListening(!voiceListening);
  };

  const handleSend = () => {
    if (message.trim() || files.length > 0) {
      onSendMessage(message, files);
      setMessage('');
      setFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl glassmorphism rounded-2xl p-4 backdrop-blur-xl border border-white/5 space-y-3 shadow-2xl">
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, transform: 'scale(0.9)' }}
            animate={{ opacity: 1, height: 'auto', transform: 'scale(1)' }}
            exit={{ opacity: 0, height: 0, transform: 'scale(0.9)' }}
            className="flex flex-wrap gap-2 justify-center"
          >
            {files.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700"
              >
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                ) : (
                  <FileText className="w-4 h-4 text-purple-400" />
                )}
                <span className="text-xs text-gray-300 max-w-[150px] truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.5 2.1a1.2 1.2 0 0 1 .8 1.6l-1.5 3.5a.7.7 0 0 1-1.3 0l-1.5-3.5a1.2 1.2 0 0 1 .1-1.9zM8.7 6.1a1.2 1.2 0 0 1 1.6 0l1.3 3.5a.7.7 0 0 0 1.3 0l1.3-3.5a1.2 1.2 0 0 1-.1-1.9zM5.6 10.7a1.2 1.2 0 0 1 1.6 0l1.3 3.5a.7.7 0 0 0 1.3 0l1.3-3.5a1.2 1.2 0 0 1-.1-1.9zM2.5 14.8a1.2 1.2 0 0 1 1.6 0l1.3 3.5a.7.7 0 0 0 1.3 0l1.3-3.5a1.2 1.2 0 0 1-.1-1.9zM1.4 18.9a1.2 1.2 0 0 1 1.6 0l1.3 3.5a.7.7 0 0 0 1.3 0l1.3-3.5a1.2 1.2 0 0 1-.1-1.9z"/>
                  </svg>
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 w-full">
        {/* File attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-purple-500/50 hover:bg-gray-800 transition-all duration-300"
          title="Attach files"
        >
          <Paperclip className="w-4 h-4 text-gray-400 hover:text-purple-400 transition-colors" />
          <span className="text-xs text-gray-500">Attach</span>
        </button>

        {/* MUTE / VOICE MODE BUTTONS ABOVE TEXT BOX */}
        <div className="flex items-center gap-2">
          {/* Mute/Voice Toggle Button */}
          <button
            onClick={toggleVoiceListening}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full border transition-all duration-200 ${
              voiceListening
                ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-700/30 hover:text-white'
            }`}
            aria-label={voiceListening ? 'Mute Voice' : 'Voice Mode'}
          >
            {voiceListening ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
            <span className="text-xs">{voiceListening ? 'MUTE' : 'VOICE'}</span>
          </button>
        </div>

        {/* Text input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or query..."
            disabled={disabled}
            className="w-full px-4 py-3 pl-4 bg-gray-900/80 border border-gray-600 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
          />
        </div>

        {/* Send button */}
        <motion.button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && files.length === 0)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-medium transition-all duration-300 shadow-lg shadow-purple-500/20"
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}