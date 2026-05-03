"use client";

import { useState } from "react";
import { Zap } from "lucide-react";

interface EssayViewProps {
  question: string;
  targetWords: { min: number; max: number };
  value?: string;
  onChange?: (val: string) => void;
}

export default function EssayView({ question, targetWords, value = "", onChange }: EssayViewProps) {
  const wordCount = value.trim() === "" ? 0 : value.trim().split(/\s+/).length;

  return (
    <div className="flex-1 flex flex-col gap-10">
      <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] border border-white p-12 space-y-10 relative overflow-hidden group">
        
        {/* Hard Mode Badge */}
        <div className="absolute top-10 right-10 flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
          <Zap size={14} className="text-primary fill-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Hard Mode (+50 XP)</span>
        </div>

        <div className="max-w-2xl">
          <h3 className="text-2xl font-extrabold text-gray-900 leading-relaxed tracking-tight break-all">
            {question}
          </h3>
        </div>

        <div className="relative group">
          <textarea 
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            placeholder="Begin typing your response here..."
            className="w-full h-80 bg-blue-50/30 border border-transparent focus:border-primary/20 focus:bg-white rounded-[2rem] p-8 text-lg font-medium text-gray-700 outline-none transition-all placeholder:text-blue-200 resize-none scrollbar-hide"
          />
          
          <div className="absolute bottom-6 right-6 flex items-center gap-3">
            <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all ${
              wordCount >= targetWords.min && wordCount <= targetWords.max
                ? "bg-green-100 text-green-600"
                : "bg-primary/5 text-primary"
            }`}>
              {wordCount} Words
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-50 pt-8">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
            Target: {targetWords.min} - {targetWords.max} Words
          </span>
        </div>
      </div>
    </div>
  );
}
