'use client';

import { useEffect, useState } from 'react';
import { Activity, Cpu, HardDrive, Clock, Mic, Zap } from 'lucide-react';

interface SystemStats {
  ramUsed: number;
  ramTotal: number;
  cpuLoad: number;
  uptime: number;
  stage: string;
}

export default function SystemStats() {
  const [stats, setStats] = useState<SystemStats>({
    ramUsed: 4.2,
    ramTotal: 16,
    cpuLoad: 18,
    uptime: 9912,
    stage: 'Idle',
  });

  const stages = [
    'Idle',
    'Analyzing DOM nodes...',
    'Processing query...',
    'Generating response...',
    'Planner AI: Optimizing workflow...',
    'Memory AI: Retrieving context...',
    'Coder AI: Writing code...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        ramUsed: Math.max(2, Math.min(14, prev.ramUsed + (Math.random() - 0.5) * 0.5)),
        ramTotal: 16,
        cpuLoad: Math.max(5, Math.min(95, prev.cpuLoad + (Math.random() - 0.5) * 10)),
        uptime: prev.uptime + 1,
        stage: Math.random() > 0.7 ? stages[Math.floor(Math.random() * stages.length)] : prev.stage,
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const ramPercentage = (stats.ramUsed / stats.ramTotal) * 100;

  return (
    <div className="absolute top-4 left-4 md:left-16 w-full md:w-auto glassmorphism rounded-2xl p-4 md:p-6 backdrop-blur-xl border border-white/5 space-y-3">
      {/* RAM Section */}
      <div className="flex items-start gap-3">
        <HardDrive className="w-5 h-5 text-purple-400 mt-1" />
        <div>
          <span className="text-xs text-gray-400">RAM</span>
          <div className="w-full h-1.5 bg-gray-800/50 rounded-full overflow-hidden mt-0.5">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${ramPercentage}%` }}
            />
          </div>
          <span className="text-xs text-gray-300 mt-1 block">
            {stats.ramUsed.toFixed(1)} GB / {stats.ramTotal} GB
          </span>
        </div>
      </div>

      {/* CPU Section */}
      <div className="flex items-start gap-3">
        <Cpu className="w-5 h-5 text-cyan-400 mt-1" />
        <div>
          <span className="text-xs text-gray-400">CPU</span>
          <div className="w-full h-1.5 bg-gray-800/50 rounded-full overflow-hidden mt-0.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${stats.cpuLoad}%` }}
            />
          </div>
          <span className="text-xs text-gray-300 mt-1 block">
            {stats.cpuLoad.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Time / Uptime Section */}
      <div className="flex items-start gap-3">
        <Clock className="w-5 h-5 text-pink-400 mt-1" />
        <div>
          <span className="text-xs text-gray-400">Uptime</span>
          <span className="text-xs text-cyan-400 font-mono mt-1 block">{formatUptime(stats.uptime)}</span>
        </div>
      </div>

      {/* Active Stage Section */}
      <div className="flex items-start gap-3">
        <Activity className="w-5 h-5 text-yellow-400 mt-1" />
        <div>
          <span className="text-xs text-gray-400">Stage</span>
          <span className={`text-xs font-medium ${stats.stage === 'Idle' ? 'text-green-400' : stats.stage.length > 0 ? 'text-purple-300' : 'text-gray-500'} truncate`}
            style={{ maxWidth: '180px' }}
          >
            {stats.stage}
          </span>
        </div>
      </div>

      {/* Voice Mode Indicator */}
      <div className="flex items-start gap-3 pt-3 border-t border-gray-800/30">
        <Mic className="w-5 h-5 text-green-400 mt-0.5" />
        <div>
          <span className="text-xs text-gray-400">Voice</span>
          <span className={`text-xs ${stats.stage !== 'Idle' ? 'text-green-300' : 'text-gray-500'} animate-pulse`}
            style={{ marginLeft: '8px' }}
          >
            {stats.stage !== 'Idle' && 'Active'}
          </span>
        </div>
      </div>
    </div>
  );
}