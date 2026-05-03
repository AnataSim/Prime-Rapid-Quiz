"use client";

import { useState, useEffect } from "react";
import { Calculator, ArrowRight } from "lucide-react";

interface KraepelinQuizProps {
  onComplete?: (responses: any[]) => void;
  totalQuestions?: number;
  settings?: {
    first?: string;
    second?: string;
    answer?: string;
  };
}

export default function KraepelinQuiz({ onComplete, totalQuestions = 1, settings }: KraepelinQuizProps) {
  const [num1, setNum1] = useState(settings?.first ? settings.first.padStart(2, '0') : "08");
  const [num2, setNum2] = useState(settings?.second ? settings.second.padStart(2, '0') : "05");
  const [inputValue, setInputValue] = useState("");
  const [responses, setResponses] = useState<any[]>([]);
  const [timer, setTimer] = useState(44);
  const [progress, setProgress] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);

  // Simulated timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      if (onComplete) onComplete(responses);
    }
  }, [timer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Record current response
    const n1Int = parseInt(num1, 10);
    const n2Int = parseInt(num2, 10);
    const expected = (n1Int + n2Int) % 10;
    
    const currentResponse = {
      a: n1Int,
      b: n2Int,
      input: parseInt(inputValue, 10) || 0,
      expected: expected
    };
    
    const newResponses = [...responses, currentResponse];
    setResponses(newResponses);
    setInputValue("");
    
    const newCount = questionCount + 1;
    setQuestionCount(newCount);
    
    if (newCount >= totalQuestions) {
      if (onComplete) onComplete(newResponses);
      return;
    }

    // Logic to generate new numbers for the next question
    const n1 = Math.floor(Math.random() * 10).toString().padStart(2, '0');
    const n2 = Math.floor(Math.random() * 10).toString().padStart(2, '0');
    setNum1(n1);
    setNum2(n2);
    setProgress((newCount / totalQuestions) * 100); 
  };

  return (
    <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Quiz Header */}
        <div className="flex items-end justify-between border-b border-gray-100 pb-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Test Protocol</span>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Kraepelin Arithmetic</h2>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Time Remaining</span>
            <span className="text-4xl font-mono font-bold text-red-500 tabular-nums">00:{timer.toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-blue-50 rounded-full overflow-hidden relative">
          <div 
            className="absolute h-full bg-primary transition-all duration-1000 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Main Question Card */}
        <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] border border-white p-16 flex flex-col items-center relative overflow-hidden group">
          {/* Decorative Icon */}
          <div className="absolute top-10 right-10 w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200">
            <Calculator size={48} />
          </div>

          <div className="flex flex-col items-center gap-2 mb-16">
            <span className="text-[100px] font-extrabold text-gray-200 leading-none tracking-tighter transition-all group-hover:scale-105 duration-500">
              {num1}
            </span>
            <div className="w-24 h-1 bg-blue-100 rounded-full"></div>
            <span className="text-[140px] font-extrabold text-gray-900 leading-none tracking-tighter transition-all group-hover:scale-110 duration-500">
              {num2}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col items-center">
            <label className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-4">Unit Sum Result</label>
            <div className="w-24 h-32 bg-blue-50 border-2 border-primary/10 rounded-3xl mb-12 flex items-center justify-center text-5xl font-bold text-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all overflow-hidden relative">
                <input 
                  type="text" 
                  maxLength={1}
                  autoFocus
                  key={questionCount} // Reset input focus on new question
                  className="w-full h-full bg-transparent text-center outline-none"
                  placeholder="?"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value.replace(/[^0-9]/g, ""))}
                />
            </div>

            <p className="text-[10px] text-gray-400 font-medium text-center mb-10 leading-relaxed">
              Rapid Input: Only enter the <span className="text-gray-900 font-bold">last digit</span> of the sum
            </p>

            <button 
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-bold py-5 rounded-[1.5rem] shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {questionCount === 0 ? "SUBMIT RESPONSE" : "FINISH KRAEPELIN"}
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
