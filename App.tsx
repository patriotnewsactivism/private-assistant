import React, { useEffect, useRef, useState } from 'react';
import { Mic, Activity, ShieldCheck, Power, Settings2, Sparkles } from 'lucide-react';
import { GeminiLiveService } from './services/geminiLiveService';
import Visualizer from './components/Visualizer';
import TranscriptLog from './components/TranscriptLog';
import InterimDisplay from './components/InterimDisplay';
import KeywordSettings from './components/KeywordSettings';
import { ConnectionState, LogMessage, Keyword } from './types';

let geminiServiceInstance: GeminiLiveService | null = null;

function App() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [volume, setVolume] = useState(0);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [interimUser, setInterimUser] = useState("");
  const [interimModel, setInterimModel] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Settings & Keywords
  const [showSettings, setShowSettings] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>([
    { id: '1', text: 'assistant', sensitivity: 0.8, trained: true },
    { id: '2', text: 'gemini', sensitivity: 0.8, trained: true }
  ]);
  const [lastDetectedKeyword, setLastDetectedKeyword] = useState<string | null>(null);

  // Initialize Service
  useEffect(() => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        addLog("API Key missing. Please check configuration.", 'error');
        setIsInitializing(false);
        return;
    }
    
    if (!geminiServiceInstance) {
        geminiServiceInstance = new GeminiLiveService(apiKey);
    }
    
    // Setup listeners
    geminiServiceInstance.onConnectionStateChange = setConnectionState;
    geminiServiceInstance.onLog = (log) => setLogs(prev => [...prev, log]);
    geminiServiceInstance.setVolumeCallback(setVolume);
    
    // Set up Interim listeners
    geminiServiceInstance.onInterimUser = (text) => {
        setInterimUser(text);
        detectKeyword(text);
    };
    geminiServiceInstance.onInterimModel = setInterimModel;
    
    setIsInitializing(false);
    
    return () => {
        if (geminiServiceInstance && connectionState === ConnectionState.CONNECTED) {
            geminiServiceInstance.disconnect();
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Simple Keyword Detection Logic
  const detectKeyword = (text: string) => {
    if (!text) return;
    const lower = text.toLowerCase();
    
    for (const kw of keywords) {
        // Simple includes check, but in a real app would be more robust or use a VAD/Wake Word engine
        // We ensure we haven't just triggered on this specific phrase to avoid looping visually
        if (lower.includes(kw.text) && lastDetectedKeyword !== kw.text) {
            triggerKeywordVisual(kw.text);
            break;
        }
    }
  };

  const triggerKeywordVisual = (word: string) => {
      setLastDetectedKeyword(word);
      // Reset after a few seconds
      setTimeout(() => setLastDetectedKeyword(null), 3000);
  };

  const toggleConnection = async () => {
    if (!geminiServiceInstance) return;

    if (connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING) {
        geminiServiceInstance.disconnect();
    } else {
        await geminiServiceInstance.connect();
    }
  };

  const addLog = (text: string, type: 'info' | 'error') => {
    const newLog: LogMessage = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        sender: 'system',
        text,
        type
    };
    setLogs(prev => [...prev, newLog]);
  };

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;
  const isError = connectionState === ConnectionState.ERROR;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex items-center justify-center p-4 selection:bg-blue-500/30 relative">
        
        {/* Keyword Detection Overlay */}
        {lastDetectedKeyword && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
                <div className="bg-cyan-500/10 border border-cyan-500/50 backdrop-blur-md px-6 py-2 rounded-full flex items-center gap-2 text-cyan-400 font-bold shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                    <Sparkles className="w-4 h-4 animate-spin-slow" />
                    ACTIVATED: {lastDetectedKeyword.toUpperCase()}
                </div>
            </div>
        )}

        <KeywordSettings 
            isOpen={showSettings} 
            onClose={() => setShowSettings(false)}
            keywords={keywords}
            onUpdateKeywords={setKeywords}
        />

        {/* Main Interface Container */}
        <div className="w-full max-w-5xl bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] relative z-0">
            
            {/* Interim Display Layer */}
            <InterimDisplay userText={interimUser} modelText={interimModel} isListening={isConnected} />

            {/* Left Panel: Controls & Visuals */}
            <div className="w-full md:w-1/3 bg-gray-900 border-r border-gray-800 p-6 flex flex-col gap-6 relative z-20">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-500" />
                            Live Assistant
                        </h1>
                        <p className="text-xs text-gray-500 font-mono">GEMINI-2.5-NATIVE</p>
                    </div>
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <Settings2 size={18} />
                    </button>
                </div>

                {/* Status Indicator */}
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-500 ${
                    isConnected ? 'bg-blue-950/30 border-blue-900/50 shadow-[0_0_20px_rgba(37,99,235,0.1)]' : 
                    isError ? 'bg-red-950/30 border-red-900/50' : 
                    'bg-gray-800 border-gray-700'
                }`}>
                    <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                        isConnected ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse' : 
                        isConnecting ? 'bg-yellow-400 animate-bounce' :
                        isError ? 'bg-red-500' :
                        'bg-gray-600'
                    }`} />
                    <span className={`text-sm font-medium transition-colors ${
                        isConnected ? 'text-cyan-100' : 
                        isError ? 'text-red-300' :
                        'text-gray-400'
                    }`}>
                        {connectionState === 'CONNECTED' ? 'System Online' : connectionState}
                    </span>
                </div>

                {/* Main Action Button */}
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                    <button 
                        onClick={toggleConnection}
                        disabled={isConnecting || isInitializing}
                        className={`
                            relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500
                            ${isConnected 
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 ring-2 ring-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)] scale-110' 
                                : 'bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-[0_10px_40px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95'
                            }
                            ${isConnecting ? 'opacity-50 cursor-not-allowed scale-95 grayscale' : ''}
                        `}
                    >
                        {isConnected ? (
                             <>
                                <span className="absolute inset-0 rounded-full animate-ping bg-red-500/20 duration-1000"></span>
                                <Power size={48} className="relative z-10" />
                             </>
                        ) : (
                            <Mic size={48} />
                        )}
                    </button>
                    
                    <p className="text-sm text-gray-500 text-center max-w-[200px]">
                        {isConnected 
                            ? "Listening active. Speak naturally..." 
                            : "Tap to initialize neural connection."}
                    </p>
                </div>

                {/* Security Badge */}
                <div className="mt-auto flex items-center gap-2 text-xs text-green-600/60 bg-green-950/10 p-2 rounded border border-green-900/20">
                    <ShieldCheck size={14} />
                    <span>ENCRYPTED • 24KHZ</span>
                </div>
            </div>

            {/* Right Panel: Output & Logs */}
            <div className="w-full md:w-2/3 p-6 flex flex-col gap-4 bg-gray-950/50 relative z-20">
                {/* Visualizer */}
                <Visualizer volume={volume} isActive={isConnected} />
                
                {/* Logs */}
                <TranscriptLog logs={logs} />

                {/* Footer Controls */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                     <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-600 font-mono">V.8.1.0</span>
                        {keywords.length > 0 && (
                             <span className="text-xs text-blue-500/50 font-mono border border-blue-900/30 px-2 py-0.5 rounded">
                                KEYWORDS: {keywords.length}
                             </span>
                        )}
                     </div>
                     <div className="flex gap-2">
                        <span className={`w-2 h-2 rounded-full transition-colors duration-200 ${volume > 0.05 ? 'bg-green-500' : 'bg-gray-800'}`}></span>
                        <span className={`w-2 h-2 rounded-full transition-colors duration-200 ${volume > 0.2 ? 'bg-green-500' : 'bg-gray-800'}`}></span>
                        <span className={`w-2 h-2 rounded-full transition-colors duration-200 ${volume > 0.4 ? 'bg-yellow-500' : 'bg-gray-800'}`}></span>
                        <span className={`w-2 h-2 rounded-full transition-colors duration-200 ${volume > 0.7 ? 'bg-red-500' : 'bg-gray-800'}`}></span>
                     </div>
                </div>
            </div>

        </div>
    </div>
  );
}

export default App;