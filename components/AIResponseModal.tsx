
import React from 'react';
import { X, Sparkles, Loader2, Copy, Check } from 'lucide-react';

interface AIResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  isLoading: boolean;
}

const AIResponseModal: React.FC<AIResponseModalProps> = ({ isOpen, onClose, title, content, isLoading }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{title}</h3>
              <p className="text-xs text-indigo-100">Powered by Gemini AI</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-indigo-100 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
              <p className="animate-pulse font-medium">A IA está processando sua solicitação...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="whitespace-pre-wrap leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-200 text-slate-700 font-normal text-sm md:text-base">
                {content}
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                <button 
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado!' : 'Copiar Texto'}
                </button>
                <button 
                  onClick={onClose}
                  className="text-sm font-bold bg-indigo-600 text-white px-8 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Entendido
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIResponseModal;
