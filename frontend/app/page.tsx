'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Paperclip,
  Image as ImageIcon,
  Send,
  Cpu,
  Activity,
  Terminal,
  Radio,
  Zap,
  Globe,
  CheckCircle2,
  Sliders,
  ShieldAlert,
} from 'lucide-react';

type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface LogMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  tool?: string;
  timestamp: string;
}

export default function GhostDashboard() {
  // State Engine
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [isContinuousListening, setIsContinuousListening] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [logs, setLogs] = useState<LogMessage[]>([
    {
      id: '1',
      sender: 'system',
      text: 'GHOST Core v2.5 initialized. System online and connected.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [latency, setLatency] = useState<number>(24);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);

  // File Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Canvas Refs
  const orbCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio & Speech Refs
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isContinuousRef = useRef<boolean>(false);
  isContinuousRef.current = isContinuousListening;

  // ---------------------------------------------------------
  // 1. BACKGROUND 3D PARTICLE GRID ANIMATION
  // ---------------------------------------------------------
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Array<{
      x: number;
      y: number;
      z: number;
      radius: number;
      vx: number;
      vy: number;
    }> = Array.from({ length: 80 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 500,
      radius: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    }));

    const renderBG = () => {
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Draw faint grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Render 3D Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const scale = 500 / (500 + p.z);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6, 182, 212, ${0.3 * scale})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#06b6d4';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationId = requestAnimationFrame(renderBG);
    };

    renderBG();
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // ---------------------------------------------------------
  // 2. INTERACTIVE 3D BLOB VISUALIZER ORB
  // ---------------------------------------------------------
  useEffect(() => {
    const canvas = orbCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let tick = 0;

    const renderOrb = () => {
      tick += 0.03;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = 85;

      ctx.clearRect(0, 0, width, height);

      // Set palette based on agent state
      let glowColor = '#06b6d4'; // Cyan - Idle
      let accentColor = '#3b82f6';
      let speedMultiplier = 1;

      if (agentState === 'listening') {
        glowColor = '#10b981'; // Emerald - Listening
        accentColor = '#059669';
        speedMultiplier = 2.2;
      } else if (agentState === 'thinking') {
        glowColor = '#a855f7'; // Purple - Thinking
        accentColor = '#6b21a8';
        speedMultiplier = 3.5;
      } else if (agentState === 'speaking') {
        glowColor = '#3b82f6'; // Blue - Speaking
        accentColor = '#06b6d4';
        speedMultiplier = 2.8;
      }

      // Outer Glow Halo
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.4,
        centerX,
        centerY,
        baseRadius * 2
      );
      gradient.addColorStop(0, `${glowColor}66`);
      gradient.addColorStop(0.5, `${accentColor}22`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Deformable 3D Blob Ring
      ctx.save();
      ctx.beginPath();
      const numPoints = 120;

      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        // Harmonic noise simulation for morphing shape
        const distortion =
          Math.sin(angle * 5 + tick * speedMultiplier) * 8 +
          Math.cos(angle * 3 - tick * 1.5) * 6 +
          Math.sin(angle * 8 + tick * 4) * 3;

        const r = baseRadius + distortion;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.closePath();
      ctx.fillStyle = glowColor;
      ctx.shadowBlur = 30;
      ctx.shadowColor = glowColor;
      ctx.globalAlpha = 0.85;
      ctx.fill();

      // Inner Core Mesh Ring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.restore();

      animationFrame = requestAnimationFrame(renderOrb);
    };

    renderOrb();
    return () => cancelAnimationFrame(animationFrame);
  }, [agentState]);

  // ---------------------------------------------------------
  // 3. BACKEND AGENT LOOP & SPEECH SYNTHESIS
  // ---------------------------------------------------------
  const sendPromptToBackend = async (messageText: string) => {
    if (!messageText.trim()) return;

    const startTime = Date.now();
    setAgentState('thinking');

    // Append User Message to HUD Logs
    const userMsg: LogMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString(),
    };
    setLogs((prev) => [...prev, userMsg]);
    setInputText('');
    setTranscript('');

    try {
      const response = await fetch('http://localhost:8000/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          session_id: 'ghost_user_session',
        }),
      });

      setLatency(Date.now() - startTime);

      if (!response.ok) {
        throw new Error(`Backend Error: ${response.statusText}`);
      }

      const data = await response.json();
      setIsBackendConnected(true);

      // Append Agent Response to HUD Logs
      const agentMsg: LogMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: data.text,
        tool: data.tool_executed,
        timestamp: new Date().toLocaleTimeString(),
      };
      setLogs((prev) => [...prev, agentMsg]);

      // Play Audio Response if provided and not muted
      if (data.audio && !isMuted) {
        setAgentState('speaking');
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
        }
        const audio = new Audio(data.audio);
        currentAudioRef.current = audio;
        audio.play();

        audio.onended = () => {
          setAgentState('idle');
          // Resume continuous listening if Jarvis toggle is active
          if (isContinuousRef.current) {
            startSpeechRecognition();
          }
        };
      } else {
        setAgentState('idle');
        if (isContinuousRef.current) {
          startSpeechRecognition();
        }
      }
    } catch (error) {
      console.error('Failed to communicate with GHOST backend:', error);
      setIsBackendConnected(false);
      setAgentState('idle');
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'system',
          text: 'Error connecting to Python backend server (localhost:8000). Check terminal.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  // ---------------------------------------------------------
  // 4. CONTINUOUS SPEECH RECOGNITION (JARVIS MODE)
  // ---------------------------------------------------------
  const startSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech Recognition API is not supported in this browser.');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setAgentState('listening');
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const activeText = finalTranscript || interimTranscript;
      setTranscript(activeText);

      if (finalTranscript.trim()) {
        recognition.stop();
        sendPromptToBackend(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error !== 'no-speech' && !isContinuousRef.current) {
        setAgentState('idle');
      }
    };

    recognition.onend = () => {
      if (isContinuousRef.current && agentState !== 'thinking' && agentState !== 'speaking') {
        recognition.start();
      } else if (!isContinuousRef.current && agentState === 'listening') {
        setAgentState('idle');
      }
    };

    recognition.start();
  }, [agentState]);

  const toggleContinuousJarvisMode = () => {
    if (isContinuousListening) {
      setIsContinuousListening(false);
      isContinuousRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setAgentState('idle');
    } else {
      setIsContinuousListening(true);
      isContinuousRef.current = true;
      startSpeechRecognition();
    }
  };

  // Handle single manual mic tap
  const handleSingleMicClick = () => {
    if (agentState === 'listening') {
      if (recognitionRef.current) recognitionRef.current.stop();
      setAgentState('idle');
    } else {
      startSpeechRecognition();
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden flex flex-col justify-between p-4 md:p-6 select-none">
      {/* Dynamic 3D Particle Canvas Background */}
      <canvas ref={bgCanvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* ---------------------------------------------------------
          HEADER BAR
         --------------------------------------------------------- */}
      <header className="relative z-10 flex items-center justify-between w-full max-w-7xl mx-auto backdrop-blur-md bg-slate-900/60 border border-slate-800/80 rounded-2xl px-6 py-3.5 shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping absolute" />
            <div className="w-3 h-3 rounded-full bg-cyan-500" />
          </div>
          <span className="font-mono text-xl font-bold tracking-wider text-cyan-400">
            GHOST <span className="text-xs text-slate-400 font-normal">v2.5 AI AGENT</span>
          </span>
        </div>

        <div className="flex items-center space-x-6 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-slate-400">LATENCY:</span>
            <span className="text-cyan-300 font-semibold">{latency}ms</span>
          </div>

          <div className="flex items-center space-x-2">
            {isBackendConnected ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">BACKEND LIVE</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span className="text-rose-500 font-semibold">BACKEND OFFLINE</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------------
          MAIN 3D HUD BODY (LEFT STATS | CENTER ORB | RIGHT FEED)
         --------------------------------------------------------- */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-7xl mx-auto my-auto py-4 items-center">
        {/* LEFT HUD: SYSTEM DIAGNOSTICS */}
        <aside className="lg:col-span-3 backdrop-blur-md bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 space-y-5 shadow-xl">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono tracking-wider border-b border-slate-800 pb-2">
            <Cpu className="w-4 h-4" />
            <span>CORE DIAGNOSTICS</span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>LLM ENGINE</span>
                <span className="text-cyan-400">Gemini 2.5 Flash</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full w-[85%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>SYSTEM PROCESS</span>
                <span className="text-emerald-400">ACTIVE</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[60%] animate-pulse" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>VOICE ENGINE</span>
                <span className="text-purple-400">Edge-TTS</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full w-[90%]" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center space-x-1">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Automation Tools</span>
              </span>
              <span className="text-cyan-400 font-semibold">LOADED</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center space-x-1">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>Jarvis Mode</span>
              </span>
              <span
                className={
                  isContinuousListening
                    ? 'text-emerald-400 font-bold'
                    : 'text-slate-500'
                }
              >
                {isContinuousListening ? 'ACTIVE' : 'STANDBY'}
              </span>
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN: TOP DUAL BUTTONS + 3D BLOB ORB */}
        <main className="lg:col-span-6 flex flex-col items-center justify-center space-y-6">
          {/* TOP CONTROLS (Above Blob) */}
          <div className="flex items-center space-x-4">
            {/* Continuous Hands-Free Jarvis Listening Toggle */}
            <button
              onClick={toggleContinuousJarvisMode}
              className={`flex items-center space-x-2.5 px-5 py-2.5 rounded-full font-mono text-xs font-semibold tracking-wide transition-all duration-300 shadow-lg ${
                isContinuousListening
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30 scale-105 ring-2 ring-emerald-400'
                  : 'bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300'
              }`}
            >
              <Zap
                className={`w-4 h-4 ${
                  isContinuousListening ? 'fill-slate-950 animate-bounce' : 'text-emerald-400'
                }`}
              />
              <span>
                {isContinuousListening ? 'JARVIS LISTENING ACTIVE' : 'ENABLE CONTINUOUS SPEAK'}
              </span>
            </button>

            {/* Mute Output Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2.5 rounded-full font-mono text-xs transition-all duration-300 shadow-lg ${
                isMuted
                  ? 'bg-rose-500/20 border border-rose-500/50 text-rose-400'
                  : 'bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-slate-200'
              }`}
              title={isMuted ? 'Unmute Speech Output' : 'Mute Speech Output'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Dynamic 3D Morphing Visualizer Blob Canvas */}
          <div className="relative flex items-center justify-center w-72 h-72 md:w-80 md:h-80">
            <canvas
              ref={orbCanvasRef}
              width={320}
              height={320}
              className="w-full h-full cursor-pointer transition-transform hover:scale-105"
              onClick={handleSingleMicClick}
            />

            {/* Status Indicator overlay on Blob */}
            <div className="absolute bottom-2 font-mono text-xs font-bold tracking-wider px-3 py-1 rounded-full backdrop-blur-md bg-slate-950/70 border border-slate-800/80 text-cyan-400 shadow-md">
              {agentState === 'idle' && 'READY / TAP ORB'}
              {agentState === 'listening' && 'LISTENING...'}
              {agentState === 'thinking' && 'PROCESSING THOUGHTS...'}
              {agentState === 'speaking' && 'SPEAKING RESPONSE'}
            </div>
          </div>

          {/* Real-time Voice Transcript Display */}
          {transcript && (
            <div className="w-full max-w-md text-center px-4 py-2 bg-slate-900/80 border border-cyan-500/30 rounded-xl text-cyan-300 font-mono text-xs backdrop-blur-sm animate-fade-in shadow-lg">
              "{transcript}"
            </div>
          )}
        </main>

        {/* RIGHT HUD: EXECUTION & CONVERSATION LOGS */}
        <aside className="lg:col-span-3 backdrop-blur-md bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 h-80 lg:h-[380px] flex flex-col justify-between shadow-xl">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono tracking-wider border-b border-slate-800 pb-2 mb-3">
            <Terminal className="w-4 h-4" />
            <span>EXECUTION STREAM</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {logs.map((log) => (
              <div key={log.id} className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span
                    className={
                      log.sender === 'user'
                        ? 'text-cyan-400 font-bold'
                        : log.sender === 'agent'
                        ? 'text-purple-400 font-bold'
                        : 'text-slate-400'
                    }
                  >
                    [{log.sender.toUpperCase()}]
                  </span>
                  <span>{log.timestamp}</span>
                </div>
                <p className="text-slate-300 bg-slate-950/50 p-2 rounded border border-slate-800/60 leading-relaxed">
                  {log.text}
                </p>
                {log.tool && (
                  <div className="flex items-center space-x-1.5 text-[10px] text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-800/40 w-fit">
                    <Sliders className="w-3 h-3" />
                    <span>TOOL EXEC: {log.tool}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* ---------------------------------------------------------
          BOTTOM INPUT DECK (UNDER BLOB)
         --------------------------------------------------------- */}
      <footer className="relative z-10 w-full max-w-3xl mx-auto mt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendPromptToBackend(inputText);
          }}
          className="relative backdrop-blur-xl bg-slate-900/80 border border-slate-700/80 rounded-2xl p-2.5 shadow-2xl flex items-center space-x-2"
        >
          {/* File Upload Attachment Button */}
          <label className="p-2.5 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer rounded-xl hover:bg-slate-800/60">
            <Paperclip className="w-5 h-5" />
            <input
              type="file"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </label>

          {/* Text Input Prompt */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              selectedFile
                ? `Attached: ${selectedFile.name}`
                : 'Ask GHOST or give a tool automation command...'
            }
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 font-mono text-sm px-2 focus:outline-none"
          />

          {/* Microphone Action Toggle Button */}
          <button
            type="button"
            onClick={handleSingleMicClick}
            className={`p-2.5 rounded-xl transition-all duration-300 ${
              agentState === 'listening'
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-slate-800 text-cyan-400 hover:bg-slate-700'
            }`}
            title="Toggle Voice Input"
          >
            {agentState === 'listening' ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Send Command Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-cyan-500/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </footer>
    </div>
  );
}