"use client";

import { useState } from "react";
import { Zap } from "lucide-react";

interface MultipleChoiceViewProps {
  question: string;
  options: string[];
  selectedOption?: number | number[] | null;
  onSelect?: (idx: number | number[]) => void;
  multiSelect?: boolean;
}

export default function MultipleChoiceView({ 
  question, 
  options, 
  selectedOption = null, 
  onSelect = () => {},
  multiSelect = false
}: MultipleChoiceViewProps) {
  
  const handleSelect = (idx: number) => {
    if (multiSelect) {
      const current = Array.isArray(selectedOption) ? selectedOption : [];
      if (current.includes(idx)) {
        onSelect(current.filter(i => i !== idx));
      } else {
        onSelect([...current, idx]);
      }
    } else {
      onSelect(idx);
    }
  };

  const isSelected = (idx: number) => {
    if (multiSelect) {
      return Array.isArray(selectedOption) && selectedOption.includes(idx);
    }
    return selectedOption === idx;
  };

  const optionLabels = ["A", "B", "C", "D", "E"];

  // Logic to determine if layout should be 1 or 2 columns
  const isLongOptions = options.some(opt => opt.length > 35) || options.length > 4;
  const gridCols = isLongOptions ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2";

  return (
    <div className={`grid ${gridCols} gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
          {options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`group flex items-center gap-6 p-8 rounded-[2rem] border-2 transition-all text-left relative overflow-hidden ${
                isSelected(idx)
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                  : "border-transparent bg-blue-50/50 hover:bg-white hover:border-blue-100"
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-all ${
                isSelected(idx)
                  ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20"
                  : "bg-white text-primary group-hover:scale-105"
              }`}>
                {optionLabels[idx]}
              </div>
              <span className={`text-lg font-bold transition-all break-all ${
                isSelected(idx) ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900"
              }`}>
                {option}
              </span>
 
              {isSelected(idx) && (
                <div className="absolute top-0 right-0 w-12 h-full bg-primary/5 -skew-x-12 translate-x-6"></div>
              )}
            </button>
          ))}
    </div>
  );
}
