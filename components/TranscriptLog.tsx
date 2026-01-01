import React, { useEffect, useRef } from 'react';
import { LogMessage } from '../types';
import { User, Cpu, Info, AlertCircle } from 'lucide-react';

interface TranscriptLogProps {
  logs: LogMessage[];
}

const TranscriptLog: React.FC<TranscriptLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 p-4 overflow-hidden flex flex-col min-h-[300px]">
      <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
         <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Cpu className="w-4 h-4" /> Live Transcript
         </h2>
         <span className="text-xs text-gray-600 font-mono">SECURE_LOG</span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
        {logs.length === 0 && (
            <div className="text-center text-gray-600 mt-20 italic">
                System awaiting input...
            </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className={`flex gap-3 ${log.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            
            {log.sender !== 'user' && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    log.type === 'error' ? 'bg-red-900/50 text-red-400' : 'bg-blue-900/50 text-cyan-400'
                }`}>
                    {log.type === 'error' ? <AlertCircle size={14} /> : log.sender === 'system' ? <Info size={14} /> : <Cpu size={14} />}
                </div>
            )}

            <div className={`max-w-[80%] p-3 rounded-lg text-sm leading-relaxed ${
                log.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : log.type === 'error'
                        ? 'bg-red-950/30 text-red-300 border border-red-900/50'
                        : log.sender === 'system'
                            ? 'bg-gray-800 text-gray-400 text-xs font-mono'
                            : 'bg-gray-800 text-gray-200 rounded-bl-none'
            }`}>
              {log.text}
            </div>

            {log.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0 text-gray-300">
                    <User size={14} />
                </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default TranscriptLog;