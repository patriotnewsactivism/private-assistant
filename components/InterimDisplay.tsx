import React from 'react';
import { Mic, Sparkles } from 'lucide-react';

interface InterimDisplayProps {
  userText: string;
  modelText: string;
  isListening: boolean;
}

const InterimDisplay: React.FC<InterimDisplayProps> = ({ userText, modelText, isListening }) => {
  if (!userText && !modelText) return null;

  return (
    <div className="w-full absolute bottom-24 left-0 px-8 flex flex-col gap-2 items-center pointer-events-none z-10">
      
      {/* Model Interim */}
      {modelText && (
        <div className="bg-gray-900/90 backdrop-blur-md border border-cyan-500/30 text-cyan-100 px-6 py-4 rounded-2xl shadow-2xl max-w-2xl text-center transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
           <div className="flex items-center justify-center gap-2 mb-2 text-cyan-400 text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3 h-3 animate-pulse" /> AI Thinking
           </div>
           <p className="text-lg font-medium leading-relaxed">{modelText}</p>
        </div>
      )}

      {/* User Interim */}
      {userText && (
        <div className="bg-blue-950/80 backdrop-blur-md border border-blue-500/30 text-white px-6 py-3 rounded-2xl shadow-xl max-w-xl text-center transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
           <div className="flex items-center justify-center gap-2 mb-1 text-blue-300 text-xs font-bold tracking-wider uppercase">
              <Mic className="w-3 h-3" /> Detecting Input...
           </div>
           <p className="text-xl font-light italic opacity-90">"{userText}"</p>
        </div>
      )}
    </div>
  );
};

export default InterimDisplay;