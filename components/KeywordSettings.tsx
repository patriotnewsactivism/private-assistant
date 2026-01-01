import React, { useState } from 'react';
import { X, Plus, Trash2, Mic, CheckCircle2, Cpu } from 'lucide-react';
import { Keyword } from '../types';

interface KeywordSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  keywords: Keyword[];
  onUpdateKeywords: (keywords: Keyword[]) => void;
}

const KeywordSettings: React.FC<KeywordSettingsProps> = ({ isOpen, onClose, keywords, onUpdateKeywords }) => {
  const [newKeyword, setNewKeyword] = useState('');
  const [trainingId, setTrainingId] = useState<string | null>(null);
  const [trainingProgress, setTrainingProgress] = useState(0);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newKeyword.trim()) return;
    const word: Keyword = {
      id: crypto.randomUUID(),
      text: newKeyword.trim().toLowerCase(),
      sensitivity: 0.8,
      trained: false
    };
    onUpdateKeywords([...keywords, word]);
    setNewKeyword('');
  };

  const handleDelete = (id: string) => {
    onUpdateKeywords(keywords.filter(k => k.id !== id));
  };

  const handleTrain = (id: string) => {
    setTrainingId(id);
    setTrainingProgress(0);
    
    // Mock training sequence
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setTrainingProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTrainingId(null);
        onUpdateKeywords(keywords.map(k => k.id === id ? { ...k, trained: true } : k));
      }
    }, 100);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-500" />
              Keyword Intelligence
            </h2>
            <p className="text-xs text-gray-500">Configure activation triggers</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {keywords.length === 0 && (
             <div className="text-center py-8 text-gray-600 border border-dashed border-gray-800 rounded-lg">
                No keywords defined.
             </div>
          )}
          
          {keywords.map(k => (
            <div key={k.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 flex items-center justify-between group hover:border-blue-500/50 transition-colors">
              <div>
                <div className="font-medium text-gray-200">{k.text}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                   {k.trained ? (
                     <span className="text-green-500 flex items-center gap-1"><CheckCircle2 size={10} /> Calibrated</span>
                   ) : (
                     <span className="text-yellow-600">Uncalibrated</span>
                   )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {trainingId === k.id ? (
                  <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-100" style={{ width: `${trainingProgress}%` }} />
                  </div>
                ) : (
                  <button 
                    onClick={() => handleTrain(k.id)}
                    className={`p-2 rounded-md transition-all ${k.trained ? 'text-gray-600 hover:text-green-400' : 'text-blue-400 hover:bg-blue-900/30'}`}
                    title="Train System"
                  >
                    <Mic size={16} />
                  </button>
                )}
                
                <button 
                    onClick={() => handleDelete(k.id)}
                    className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-md transition-colors"
                >
                    <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Enter new wake word..."
              className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <button 
              onClick={handleAdd}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium text-sm"
            >
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default KeywordSettings;