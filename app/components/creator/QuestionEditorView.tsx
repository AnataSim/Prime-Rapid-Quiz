"use client";

import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link, 
  Image as ImageIcon,
  Sigma,
  Clock,
  Settings,
  ChevronDown,
  Info,
  Check
} from "lucide-react";
import { useState } from "react";

interface EditorProps {
  onBack: () => void;
  onSubmit: (data: any) => void;
  viewOnly?: boolean;
  initialQuestions?: any[];
}

export default function QuestionEditorView({ onBack, onSubmit, viewOnly, initialQuestions = [] }: EditorProps) {
  const [activeType, setActiveType] = useState("MCQ");
  
  // State for all questions grouped by type
  const [questionsByType, setQuestionsByType] = useState<Record<string, any[]>>(() => {
    const grouped: Record<string, any[]> = {
      MCQ: [],
      CHK: [],
      ESS: [],
      KRA: [],
    };

    if (initialQuestions.length > 0) {
      initialQuestions.forEach(q => {
        if (grouped[q.type]) {
          grouped[q.type].push({ ...q, saved: true });
        } else {
          // Fallback if type is missing or mismatched
          grouped["MCQ"].push({ ...q, saved: true });
        }
      });
    }

    // If not viewOnly, ensure at least one empty question per type if empty
    if (!viewOnly) {
      Object.keys(grouped).forEach(type => {
        if (grouped[type].length === 0) {
          grouped[type].push({ stem: "", options: [], explanation: "", difficulty: "Medium", timeLimit: 60, autoAdvance: true, saved: false });
        }
      });
    }

    return grouped;
  });

  const [currentPageIndex, setCurrentPageIndex] = useState<Record<string, number>>({
    MCQ: 0,
    CHK: 0,
    ESS: 0,
    KRA: 0,
  });

  const [isSaved, setIsSaved] = useState(false);
  const [autoOptionCount, setAutoOptionCount] = useState(4);

  // Get current question data
  const currentQuestions = questionsByType[activeType];
  const currentIndex = currentPageIndex[activeType];
  const currentQ = currentQuestions[currentIndex];

  const handleAutoGenerateOptions = () => {
    if (viewOnly) return;
    const newOptions = [];
    for (let i = 0; i < autoOptionCount; i++) {
      newOptions.push({
        letter: String.fromCharCode(65 + i),
        text: "",
        correct: false
      });
    }
    updateCurrentQ({ options: newOptions });
  };

  const updateCurrentQ = (updates: any) => {
    if (viewOnly) return;
    const newQuestions = [...currentQuestions];
    newQuestions[currentIndex] = { ...newQuestions[currentIndex], ...updates };
    setQuestionsByType({
      ...questionsByType,
      [activeType]: newQuestions
    });
  };

  const handleSave = () => {
    updateCurrentQ({ saved: true });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAddQuestion = () => {
    if (currentQ && !currentQ.saved) return;
    
    const newQuestions = [
      ...currentQuestions, 
      { stem: "", options: [], explanation: "", difficulty: "Medium", timeLimit: 60, autoAdvance: true, saved: false }
    ];
    
    setQuestionsByType({
      ...questionsByType,
      [activeType]: newQuestions
    });
    
    setCurrentPageIndex({
      ...currentPageIndex,
      [activeType]: newQuestions.length - 1
    });
    
    setIsSaved(false);
  };

  const renderPagination = () => {
    const total = currentQuestions.length;
    const current = currentIndex + 1;

    if (total <= 1) {
      return (
        <button className="w-8 h-8 rounded-full bg-[#2563EB] text-white text-xs font-black">1</button>
      );
    }

    if (total <= 3) {
      const pgs = [];
      for (let i = 1; i <= total; i++) {
        pgs.push(
          <button 
            key={i}
            onClick={() => setCurrentPageIndex({ ...currentPageIndex, [activeType]: i - 1 })}
            className={`w-8 h-8 rounded-full text-xs font-black transition-all ${current === i ? "bg-[#2563EB] text-white" : "hover:bg-white text-gray-400"}`}
          >
            {i}
          </button>
        );
      }
      return pgs;
    }

    const pgs = [];
    // Always show 1
    pgs.push(
      <button 
        key={1} 
        onClick={() => setCurrentPageIndex({ ...currentPageIndex, [activeType]: 0 })} 
        className={`w-8 h-8 rounded-full text-xs font-black transition-all ${current === 1 ? "bg-[#2563EB] text-white" : "hover:bg-white text-gray-400"}`}
      >
        1
      </button>
    );

    if (current <= 2) {
      pgs.push(
        <button 
          key={2} 
          onClick={() => setCurrentPageIndex({ ...currentPageIndex, [activeType]: 1 })} 
          className={`w-8 h-8 rounded-full text-xs font-black transition-all ${current === 2 ? "bg-[#2563EB] text-white" : "hover:bg-white text-gray-400"}`}
        >
          2
        </button>
      );
      pgs.push(<span key="sep" className="text-gray-300 px-1">...</span>);
    } else if (current >= total - 1) {
      pgs.push(<span key="sep" className="text-gray-300 px-1">...</span>);
      pgs.push(
        <button 
          key={total - 1} 
          onClick={() => setCurrentPageIndex({ ...currentPageIndex, [activeType]: total - 2 })} 
          className={`w-8 h-8 rounded-full text-xs font-black transition-all ${current === total - 1 ? "bg-[#2563EB] text-white" : "hover:bg-white text-gray-400"}`}
        >
          {total - 1}
        </button>
      );
    } else {
      pgs.push(<span key="sep1" className="text-gray-300 px-1">...</span>);
      pgs.push(
        <button key={current} className="w-8 h-8 rounded-full bg-[#2563EB] text-white text-xs font-black">{current}</button>
      );
      pgs.push(<span key="sep2" className="text-gray-300 px-1">...</span>);
    }

    pgs.push(
      <button 
        key={total} 
        onClick={() => setCurrentPageIndex({ ...currentPageIndex, [activeType]: total - 1 })} 
        className={`w-8 h-8 rounded-full text-xs font-black transition-all ${current === total ? "bg-[#2563EB] text-white" : "hover:bg-white text-gray-400"}`}
      >
        {total}
      </button>
    );

    return pgs;
  };

  const types = [
    { id: "MCQ", label: "MULTIPLE CHOICE", icon: "•" },
    { id: "CHK", label: "CHECKBOX", icon: "☑" },
    { id: "ESS", label: "ESSAY", icon: "≡" },
    { id: "KRA", label: "KRAEPELIN", icon: "▦" },
  ];

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-700">
      {/* Editor Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#94A3B8]">
              <span>Prime Rapid Quiz</span>
              <span>›</span>
              <span className="text-[#2563EB]">Drafting</span>
            </div>
            <h1 className="text-[28px] font-black text-[#1E293B] tracking-tight break-all">Question Q-40{currentIndex + 1}</h1>
          </div>
        </div>
        {!viewOnly && (
          <button 
            onClick={handleSave}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all ${
              isSaved 
              ? "bg-[#10B981] text-white shadow-xl shadow-emerald-500/20" 
              : "bg-[#2563EB] text-white shadow-xl shadow-blue-500/20 hover:bg-[#1D4ED8]"
            }`}
          >
            <Save size={18} />
            {isSaved ? "Saved" : "Save Question"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
        <div className="space-y-10">
          {/* Interaction Type Card */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-[#F1F5F9] shadow-[0_2px_15px_rgba(0,0,0,0.02)] space-y-8">
            <h3 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] pl-1">Interaction Type</h3>
            <div className="grid grid-cols-4 gap-6">
              {types.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setActiveType(type.id)}
                  className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all space-y-3 relative ${
                    activeType === type.id 
                    ? "bg-[#F5F8FF] border-[#2563EB] text-[#2563EB] ring-4 ring-blue-50" 
                    : "bg-white border-gray-100 text-[#94A3B8] hover:border-gray-200"
                  }`}
                >
                  <div className={`w-3.5 h-3.5 absolute top-3 right-3 border-2 transition-all ${
                    activeType === type.id 
                    ? (type.id === "CHK" ? "bg-[#2563EB] border-[#2563EB] rounded-[4px]" : "bg-[#2563EB] border-[#2563EB] rounded-full") 
                    : (type.id === "CHK" ? "bg-white border-gray-200 rounded-[4px]" : "bg-white border-gray-200 rounded-full")
                  }`}>
                    {activeType === type.id && type.id === "CHK" && <div className="text-white text-[8px] flex items-center justify-center h-full">✓</div>}
                  </div>
                  <span className="text-2xl font-bold">{type.icon}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-center">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {!currentQ ? (
            <div className="bg-white rounded-[2.5rem] p-20 border border-[#F1F5F9] shadow-[0_2px_15px_rgba(0,0,0,0.02)] text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-300">
                <Info size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-[#1E293B]">No Questions Found</h3>
                <p className="text-gray-400 font-medium">There are no {activeType} questions in this quiz room.</p>
              </div>
              {!viewOnly && (
                <button 
                  onClick={handleAddQuestion}
                  className="mx-auto flex items-center gap-2 px-6 py-3 bg-[#2563EB] text-white rounded-xl text-[13px] font-black uppercase tracking-widest hover:bg-[#1D4ED8] transition-all"
                >
                  <Plus size={16} />
                  Add First Question
                </button>
              )}
            </div>
          ) : (
            <>

          {/* Question Stem Card - Hidden for Kraepelin */}
          {activeType !== "KRA" && (
            <div className="bg-white rounded-[2.5rem] p-10 border border-[#F1F5F9] shadow-[0_2px_15px_rgba(0,0,0,0.02)] space-y-6">
              <h3 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] pl-1">Question Stem</h3>
              <div className="border border-gray-100 rounded-[2rem] overflow-hidden focus-within:border-[#2563EB]/20 transition-all shadow-inner">
                <div className="flex items-center gap-1 p-3 bg-gray-50/50 border-b border-gray-100">
                  <button className="p-2 hover:bg-white hover:text-[#2563EB] rounded-lg transition-all text-gray-400"><Bold size={16} /></button>
                  <button className="p-2 hover:bg-white hover:text-[#2563EB] rounded-lg transition-all text-gray-400"><Italic size={16} /></button>
                  <button className="p-2 hover:bg-white hover:text-[#2563EB] rounded-lg transition-all text-gray-400"><Underline size={16} /></button>
                  <div className="w-px h-6 bg-gray-200 mx-2" />
                  <button className="p-2 hover:bg-white hover:text-[#2563EB] rounded-lg transition-all text-gray-400"><List size={16} /></button>
                  <button className="p-2 hover:bg-white hover:text-[#2563EB] rounded-lg transition-all text-gray-400"><ListOrdered size={16} /></button>
                  <div className="w-px h-6 bg-gray-200 mx-2" />
                  <button className="p-2 hover:bg-white hover:text-[#2563EB] rounded-lg transition-all text-gray-400"><Link size={16} /></button>
                  <button className="p-2 hover:bg-white hover:text-[#2563EB] rounded-lg transition-all text-gray-400"><ImageIcon size={16} /></button>
                  <button className="p-2 hover:bg-white hover:text-[#2563EB] rounded-lg transition-all text-gray-400"><Sigma size={16} /></button>
                </div>
                <textarea 
                  className="w-full p-8 bg-white text-[15px] font-medium text-[#334155] leading-relaxed outline-none min-h-[160px] resize-none break-all"
                  placeholder="Type your question here..."
                  value={currentQ.stem}
                  onChange={(e) => updateCurrentQ({ stem: e.target.value })}
                />
              </div>
            </div>
          )}

          {activeType === "ESS" ? (
            /* Essay View */
            <div className="bg-white rounded-[2.5rem] p-10 border border-[#F1F5F9] shadow-[0_2px_15px_rgba(0,0,0,0.02)] space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] pl-1">Expected Response Area</h3>
                <button className="px-4 py-1.5 bg-[#F1F5F9] text-[#94A3B8] rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">
                  Candidate View Preview
                </button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest pl-1">Minimum Words</label>
                  <input 
                    type="number" 
                    className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-[16px] font-black outline-none focus:border-[#2563EB]/30 transition-all text-[#1E293B]"
                    value={currentQ.targetWords?.min || 100}
                    onChange={(e) => updateCurrentQ({ targetWords: { ...(currentQ.targetWords || {}), min: parseInt(e.target.value) } })}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest pl-1">Maximum Words</label>
                  <input 
                    type="number" 
                    className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-[16px] font-black outline-none focus:border-[#2563EB]/30 transition-all text-[#1E293B]"
                    value={currentQ.targetWords?.max || 500}
                    onChange={(e) => updateCurrentQ({ targetWords: { ...(currentQ.targetWords || {}), max: parseInt(e.target.value) } })}
                  />
                </div>
              </div>
              <div className="h-[200px] bg-[#F8FAFF] border-2 border-dashed border-[#E2E8F0] rounded-[2.5rem] flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex items-center justify-center text-[#CBD5E1]">
                  <List size={24} />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[14px] font-black text-[#64748B]">Large text area provided to candidate</p>
                  <p className="text-[11px] font-bold text-[#94A3B8]">Target: {currentQ.targetWords?.min || 100} - {currentQ.targetWords?.max || 500} Words</p>
                </div>
              </div>
            </div>
          ) : activeType === "KRA" ? (
            /* Kraepelin View */
            <div className="space-y-10">
              <div className="bg-white rounded-[2.5rem] p-10 border border-[#F1F5F9] shadow-[0_2px_15px_rgba(0,0,0,0.02)] space-y-8">
                <h3 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] pl-1">Kraepelin Settings</h3>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest pl-1">First Number</label>
                    <input 
                      type="number" 
                      className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-[18px] font-black outline-none focus:border-[#2563EB]/30 transition-all text-[#1E293B]"
                      placeholder="e.g. 8"
                      value={currentQ.kraepelin?.first || ""}
                      onChange={(e) => updateCurrentQ({ kraepelin: { ...currentQ.kraepelin, first: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-[#94A3B8] uppercase tracking-widest pl-1">Second Number</label>
                    <input 
                      type="number" 
                      className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-[18px] font-black outline-none focus:border-[#2563EB]/30 transition-all text-[#1E293B]"
                      placeholder="e.g. 5"
                      value={currentQ.kraepelin?.second || ""}
                      onChange={(e) => updateCurrentQ({ kraepelin: { ...currentQ.kraepelin, second: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-[#2563EB] uppercase tracking-widest pl-1">Answer Kraepelin</label>
                    <input 
                      type="number" 
                      className="w-full px-6 py-4 bg-[#F5F8FF] border border-blue-100 rounded-2xl text-[18px] font-black text-[#2563EB] outline-none transition-all"
                      placeholder="e.g. 3"
                      value={currentQ.kraepelin?.answer || ""}
                      onChange={(e) => updateCurrentQ({ kraepelin: { ...currentQ.kraepelin, answer: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-[#7C3AED] uppercase tracking-widest pl-1">Total Addition Tasks</label>
                    <input 
                      type="number" 
                      className="w-full px-6 py-4 bg-[#F5F3FF] border border-purple-100 rounded-2xl text-[18px] font-black text-[#7C3AED] outline-none transition-all"
                      placeholder="e.g. 50"
                      value={currentQ.kraepelin?.total || ""}
                      onChange={(e) => updateCurrentQ({ kraepelin: { ...currentQ.kraepelin, total: e.target.value } })}
                    />
                    <p className="text-[9px] font-bold text-[#94A3B8] italic pl-1">Number of calculations student must complete.</p>
                  </div>
                </div>
              </div>

              {/* Grid Preview */}
              <div className="bg-[#F3F4FF] rounded-[2.5rem] p-1 border border-blue-100 shadow-inner overflow-hidden">
                <div className="bg-white rounded-[2.3rem] p-10 flex flex-col items-center justify-center relative min-h-[400px]">
                  <div className="flex items-center gap-2 absolute top-8 left-10 text-[10px] font-black text-[#7C3AED] uppercase tracking-widest">
                    <div className="w-5 h-5 bg-[#F3F4FF] rounded-lg flex items-center justify-center">
                      <ImageIcon size={12} />
                    </div>
                    Grid Preview
                  </div>
                  
                  <div className="w-full max-w-[400px] flex flex-col items-center py-10">
                    <div className="flex flex-col items-center space-y-2 relative">
                      <div className="absolute -right-32 top-8 w-16 h-16 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-[#E2E8F0] shadow-sm">
                        <div className="grid grid-cols-2 gap-0.5">
                          <div className="w-2.5 h-0.5 bg-current rounded-full" />
                          <div className="w-2.5 h-0.5 bg-current rounded-full rotate-90 -ml-2.5" />
                          <div className="w-2.5 h-0.5 bg-current rounded-full" />
                          <div className="w-2.5 h-0.5 bg-current rounded-full rotate-90 -ml-2.5" />
                        </div>
                      </div>
                      <span className="text-[100px] font-black text-[#E2E8F0] leading-none tracking-tighter">
                        {currentQ.kraepelin?.first ? currentQ.kraepelin.first.padStart(2, '0') : "08"}
                      </span>
                      <div className="w-48 h-[6px] bg-[#F1F5F9] rounded-full" />
                      <span className="text-[120px] font-black text-[#1E293B] leading-none tracking-tighter">
                        {currentQ.kraepelin?.second ? currentQ.kraepelin.second.padStart(2, '0') : "05"}
                      </span>
                    </div>
                    
                    <div className="mt-12 flex flex-col items-center space-y-6">
                      <p className="text-[10px] font-black text-[#2563EB] uppercase tracking-[0.2em]">Unit Sum Result</p>
                      <div className="w-24 h-28 bg-[#F8FAFC] border-2 border-[#E2E8F0] rounded-[2rem] flex items-center justify-center text-[48px] font-black text-[#CBD5E1] shadow-inner">
                        ?
                      </div>
                      <p className="text-[12px] text-[#94A3B8] font-medium text-center max-w-[240px] leading-relaxed">
                        Rapid input: Only enter the <span className="text-[#475569] font-black">last digit</span> of the sum.
                      </p>
                    </div>
                  </div>

                  <div className="mt-10 pt-6 border-t border-gray-50 w-full text-center">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Previewing Standard Difficulty</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* MCQ / CHK View */
            <div className="bg-white rounded-[2.5rem] p-10 border border-[#F1F5F9] shadow-[0_2px_15px_rgba(0,0,0,0.02)] space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <h3 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] pl-1">Response Options</h3>
                  
                  {!viewOnly && (
                    <div className="flex items-center gap-2 bg-[#F8FAFC] border border-gray-100 p-1.5 rounded-xl animate-in slide-in-from-left-4 duration-500">
                      {[3, 4, 5].map(num => (
                        <button
                          key={num}
                          onClick={() => setAutoOptionCount(num)}
                          className={`w-8 h-8 rounded-lg text-[11px] font-black transition-all ${
                            autoOptionCount === num ? "bg-[#2563EB] text-white" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                      <div className="w-px h-4 bg-gray-200 mx-1" />
                      <button 
                        onClick={handleAutoGenerateOptions}
                        className="w-8 h-8 rounded-lg bg-[#10B981] text-white flex items-center justify-center hover:bg-[#059669] transition-all shadow-sm"
                        title="Auto Generate Options"
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => {
                    if (currentQ.options.length >= 5) return;
                    const letter = String.fromCharCode(65 + currentQ.options.length);
                    updateCurrentQ({ options: [...currentQ.options, { letter, text: "", correct: false }] });
                  }}
                  disabled={currentQ.options.length >= 5}
                  className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    currentQ.options.length >= 5 ? "text-gray-300 cursor-not-allowed" : "text-[#2563EB] hover:underline"
                  }`}
                >
                  <Plus size={14} />
                  {currentQ.options.length >= 5 ? "Max Options Reached" : "Add Option"}
                </button>
              </div>
              <div className="space-y-4">
                {currentQ.options.length === 0 ? (
                  <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                    <p className="text-[13px] text-gray-300 font-bold">No options added yet</p>
                  </div>
                ) : (
                  currentQ.options.map((opt: any, i: number) => (
                    <div 
                      key={i} 
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        opt.correct ? "bg-[#F5F8FF] border-[#2563EB]/30" : "bg-[#F8F9FF]/50 border-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-5 flex-1">
                        <button 
                          onClick={() => {
                            const newOptions = [...currentQ.options];
                            if (activeType === "MCQ") {
                              newOptions.forEach((o, idx) => o.correct = idx === i);
                            } else {
                              newOptions[i].correct = !newOptions[i].correct;
                            }
                            updateCurrentQ({ options: newOptions });
                          }}
                          className={`w-10 h-10 flex items-center justify-center font-black text-[13px] transition-all shadow-sm ${
                            opt.correct 
                            ? (activeType === "CHK" ? "bg-[#2563EB] text-white rounded-xl" : "bg-[#2563EB] text-white rounded-full")
                            : (activeType === "CHK" ? "bg-white text-[#94A3B8] border border-gray-100 rounded-xl" : "bg-white text-[#94A3B8] border border-gray-100 rounded-full")
                          }`}
                        >
                          {opt.letter}
                        </button>
                        <input 
                          type="text"
                          value={opt.text}
                          onChange={(e) => {
                            const newOptions = [...currentQ.options];
                            newOptions[i].text = e.target.value;
                            updateCurrentQ({ options: newOptions });
                          }}
                          className={`bg-transparent outline-none text-[14px] font-bold flex-1 ${opt.correct ? "text-[#1E293B]" : "text-[#64748B]"}`}
                          placeholder={`Option ${opt.letter}...`}
                        />
                      </div>
                      {opt.correct && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-blue-100 shadow-sm animate-in fade-in zoom-in duration-300">
                          {activeType === "CHK" && <div className="w-3.5 h-3.5 bg-[#2563EB] rounded-sm flex items-center justify-center text-white text-[8px]">✓</div>}
                          <span className="text-[9px] font-black text-[#2563EB] uppercase tracking-widest">Correct</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="flex items-center justify-center gap-10 py-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setCurrentPageIndex({ ...currentPageIndex, [activeType]: Math.max(0, currentIndex - 1) })}
                className="p-2 text-gray-300 hover:text-[#2563EB] transition-colors disabled:opacity-30"
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-2">
                {renderPagination()}
              </div>
              <button 
                onClick={() => setCurrentPageIndex({ ...currentPageIndex, [activeType]: Math.min(currentQuestions.length - 1, currentIndex + 1) })}
                className="p-2 text-gray-300 hover:text-[#2563EB] transition-colors disabled:opacity-30"
                disabled={currentIndex === currentQuestions.length - 1}
              >
                <ChevronRight size={20} />
              </button>
            </div>
            {!viewOnly && (
              <button 
                onClick={handleAddQuestion}
                disabled={!currentQ.saved}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  currentQ.saved ? "text-[#2563EB] hover:underline" : "text-gray-300 cursor-not-allowed"
                }`}
              >
                <Plus size={14} />
                Add Question
              </button>
            )}
          </div>
            </>
          )}
        </div>

        {/* Right Sidebar Cards */}
        {currentQ && (
          <div className="space-y-10">
            {/* Timing Card */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-[#F1F5F9] shadow-[0_2px_15px_rgba(0,0,0,0.02)] space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#EEF2FF] text-[#2563EB] rounded-xl flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <h3 className="text-[18px] font-black text-[#1E293B] tracking-tight">Timing & Constraints</h3>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Time Limit (Seconds)</label>
                    <span className="text-[10px] font-black text-[#2563EB]">{currentQ.timeLimit}s</span>
                  </div>
                  <div className="h-1.5 bg-[#EEF2FF] rounded-full relative">
                    <input 
                      type="range" 
                      min="10" 
                      max="300" 
                      step="1"
                      value={currentQ.timeLimit}
                      onChange={(e) => updateCurrentQ({ timeLimit: parseInt(e.target.value) })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div 
                      className="absolute left-0 top-0 h-full bg-[#2563EB] rounded-full transition-all duration-150" 
                      style={{ width: `${((currentQ.timeLimit - 10) / (300 - 10)) * 100}%` }}
                    />
                    <div 
                      className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-[#2563EB] rounded-full transition-all duration-150" 
                      style={{ left: `${((currentQ.timeLimit - 10) / (300 - 10)) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-300 px-1">
                    <span>10s</span>
                    <span>300s</span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <div className="space-y-1">
                    <h4 className="text-[13px] font-black text-[#1E293B]">Auto-Advance</h4>
                    <p className="text-[11px] text-[#94A3B8] font-medium leading-relaxed">Move to next Q when time is up</p>
                  </div>
                  <button 
                    onClick={() => updateCurrentQ({ autoAdvance: !currentQ.autoAdvance })}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${currentQ.autoAdvance ? 'bg-[#2563EB]' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${currentQ.autoAdvance ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Logic Card */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-[#F1F5F9] shadow-[0_2px_15px_rgba(0,0,0,0.02)] space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F5F3FF] text-[#7C3AED] rounded-xl flex items-center justify-center">
                  <Settings size={20} />
                </div>
                <h3 className="text-[18px] font-black text-[#1E293B] tracking-tight">Assessment Logic</h3>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest pl-1">Difficulty Weight</label>
                  <div className="flex p-1 bg-gray-50 border border-gray-100 rounded-2xl">
                    {["Low", "Medium", "High"].map((lvl) => (
                      <button 
                        key={lvl}
                        onClick={() => updateCurrentQ({ difficulty: lvl })}
                        className={`flex-1 py-2 text-[12px] font-bold rounded-xl transition-all ${
                          currentQ.difficulty === lvl ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/10" : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest pl-1">Trait Mapping</label>
                  <div className="flex items-center justify-between w-full px-5 py-3.5 bg-[#F8FAFC] border border-gray-100 rounded-2xl cursor-pointer hover:border-gray-200 transition-all">
                    <span className="text-[13px] font-bold text-[#334155]">Numerical Reasoning</span>
                    <ChevronDown size={18} className="text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Explanation Hint Box */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-[#F1F5F9] shadow-[0_2px_15px_rgba(0,0,0,0.02)] space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Info size={18} />
                </div>
                <div className="space-y-2 flex-1">
                  <p className="text-[12px] text-gray-400 font-bold uppercase tracking-tight">Input Keterangan</p>
                  <textarea 
                    className="w-full text-[13px] font-medium text-[#64748B] leading-relaxed outline-none min-h-[100px] resize-none placeholder:text-gray-300"
                    placeholder="Tap to Write..."
                    value={currentQ.explanation}
                    onChange={(e) => updateCurrentQ({ explanation: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {!viewOnly && (
              <button 
                onClick={() => {
                  const allQs = Object.entries(questionsByType).flatMap(([type, qs]) => 
                    qs.map(q => ({ ...q, type }))
                  );
                  const validQs = allQs.filter(q => 
                    (q.stem && q.stem.trim() !== "") || 
                    (q.type === "KRA" && q.kraepelin?.first && q.kraepelin?.second) ||
                    q.saved
                  );
                  onSubmit({ 
                    totalQuestions: validQs.length,
                    questions: validQs
                  });
                }}
                className="w-full py-5 bg-[#6390E9] text-white rounded-[1.5rem] text-[13px] font-black uppercase tracking-widest shadow-xl shadow-blue-400/20 hover:bg-[#2563EB] transition-all"
              >
                Click to Submit
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}