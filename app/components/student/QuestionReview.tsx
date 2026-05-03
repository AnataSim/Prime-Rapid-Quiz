"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Lightbulb, MessageSquare } from "lucide-react";

interface QuestionReviewProps {
  data?: any;
}

export default function QuestionReview({ data }: QuestionReviewProps) {
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Generate reviews from data if available, otherwise empty
  const reviews = data?.room?.questions?.map((q: any, idx: number) => {
    const type = q.type || "MCQ";
    const isChoice = type === "MCQ" || type === "CHK";
    const validOptions = q.options?.filter((o: any) => o.text && o.text.trim() !== "") || [];
    
    let yourChoice = "";
    let correctAnswer = "";
    let isCorrect = false;
    let status: "PENDING" | "CORRECT" | "INCORRECT" = "PENDING";

    if (type === "KRA") {
      const k = q.kraepelin || {};
      yourChoice = k.answer || "No Data";
      correctAnswer = k.answer || "N/A";
      isCorrect = true;
      status = "CORRECT";
      const first = k.first || "0";
      const second = k.second || "0";
      return {
        id: idx + 1,
        page: Math.floor(idx / 5) + 1,
        type: "KRAEPELIN",
        question: `Kraepelin Arithmetic: ${first} + ${second}`,
        yourChoice: yourChoice,
        yourAnswer: yourChoice,
        correctAnswer: correctAnswer,
        isCorrect: isCorrect,
        status: status,
        breakdown: [
          `First Digit: ${first}`,
          `Second Digit: ${second}`,
          `Expected Result: ${correctAnswer}`
        ]
      };
    } else if (isChoice) {
      const selected = data?.answers?.[idx];
      if (type === "CHK") {
        const selectedIndices = Array.isArray(selected) ? selected : (selected !== undefined && selected !== null ? [selected] : []);
        yourChoice = selectedIndices.length > 0 
          ? selectedIndices.map((i: number) => validOptions[i]?.text || "N/A").join(", ") 
          : "No Answer";
        correctAnswer = validOptions.filter((o: any) => o.correct).map((o: any) => o.text).join(", ");
        const correctIndices = validOptions.reduce((acc: number[], o: any, i: number) => o.correct ? [...acc, i] : acc, []);
        isCorrect = correctIndices.length === selectedIndices.length && correctIndices.every((i: number) => selectedIndices.includes(i));
        status = isCorrect ? "CORRECT" : "INCORRECT";
      } else {
        const selectedIdx = selected;
        const correctIdx = validOptions.findIndex((o: any) => o.correct);
        const hasSelection = selectedIdx !== undefined && selectedIdx !== null;
        yourChoice = hasSelection && validOptions[selectedIdx] ? validOptions[selectedIdx].text : "No Answer";
        correctAnswer = correctIdx >= 0 ? validOptions[correctIdx].text : "No Correct Option Set";
        isCorrect = hasSelection && selectedIdx === correctIdx;
        status = isCorrect ? "CORRECT" : "INCORRECT";
      }
    } else {
      // Essay: check if creator has reviewed this question
      const essayGrades = data?.essayGrades || {};
      const gradeKey = String(idx); // essayGrades keys are the room question index as string
      const val = data?.answers?.[idx];
      yourChoice = (val !== undefined && val !== null) ? val : "No Answer Provided";

      if (gradeKey in essayGrades) {
        isCorrect = essayGrades[gradeKey] === true;
        status = isCorrect ? "CORRECT" : "INCORRECT";
      } else {
        isCorrect = false;
        status = "PENDING"; // Not yet reviewed by creator
      }
    }

    return {
      id: idx + 1,
      page: Math.floor(idx / 5) + 1, // 5 questions per page
      type: type === "KRA" ? "KRAEPELIN" : type === "ESS" ? "ESSAY" : type === "CHK" ? "CHECKBOX" : "MCQ",
      question: q.stem || (type === "KRA" ? "Kraepelin Arithmetic Test" : "No Question Provided"),
      yourChoice: yourChoice,
      yourAnswer: yourChoice, // for essay
      correctAnswer: correctAnswer,
      isCorrect: isCorrect,
      status: status,
      breakdown: q.explanation ? [q.explanation] : ["No logic breakdown provided by creator."]
    };
  }) || [];

  const filteredByStatus = reviews.filter((r: any) => {
    if (filter === "incorrect") return !r.isCorrect;
    return true;
  });

  const totalPages = Math.ceil(filteredByStatus.length / 5);
  const filteredReviews = filteredByStatus.slice((currentPage - 1) * 5, currentPage * 5);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">Question Review</h3>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => { setFilter("all"); setCurrentPage(1); }}
            className={`px-6 py-2 text-[10px] font-bold rounded-lg transition-all ${filter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"}`}
          >
            All
          </button>
          <button 
            onClick={() => { setFilter("incorrect"); setCurrentPage(1); }}
            className={`px-6 py-2 text-[10px] font-bold rounded-lg transition-all ${filter === "incorrect" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"}`}
          >
            Incorrect Only
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {filteredReviews.map((item: any) => (
          <div 
            key={item.id} 
            className={`rounded-[2.5rem] border-l-4 overflow-hidden shadow-sm transition-all ${
              item.status === "PENDING" ? "bg-gray-50/50 border-l-gray-300" :
              item.status === "CORRECT" ? "bg-white border-l-primary" :
              "bg-red-50/30 border-l-red-500"
            }`}
          >
            <div className="p-10 space-y-8">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                      item.status === "PENDING" ? "text-gray-400" :
                      item.status === "CORRECT" ? "text-primary" :
                      "text-red-500"
                    }`}>
                      Question 0{item.id}
                    </span>
                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      item.status === "PENDING" ? "bg-gray-200 text-gray-500" :
                      item.status === "CORRECT" ? "bg-primary/10 text-primary" :
                      "bg-red-100 text-red-600"
                    }`}>
                      {item.status === "PENDING" ? "Belum di Review" : item.status === "CORRECT" ? "Reviewed (Benar)" : "Reviewed (Salah)"}
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 leading-relaxed tracking-tight break-all">
                    {item.question}
                  </h4>
                </div>
              </div>

              {(item.type === "MCQ" || item.type === "CHECKBOX") ? (
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50/50 rounded-2xl p-6 border border-transparent">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Your Selection</span>
                    <div className="flex items-start justify-between gap-2 overflow-hidden">
                      <span className="text-sm font-bold text-gray-900 break-all">{item.yourChoice}</span>
                      <div className="shrink-0 mt-1">
                        {item.status === "CORRECT" ? <CheckCircle2 size={14} className="text-primary" /> : <XCircle size={14} className="text-red-500" />}
                      </div>
                    </div>
                  </div>
                  <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                    <span className="text-[8px] font-bold text-primary uppercase tracking-widest block mb-2">Expected Key</span>
                    <div className="flex items-start justify-between gap-2 overflow-hidden">
                      <span className="text-sm font-bold text-gray-900 break-all">{item.correctAnswer}</span>
                      <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                    </div>
                  </div>
                </div>
              ) : item.type === "KRAEPELIN" ? (
                <div className="bg-amber-50/50 rounded-2xl p-8 border border-amber-100/50 flex items-center justify-between gap-6">
                  <div className="flex-1 grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-amber-600 uppercase tracking-widest block">Input Captured</span>
                      <p className="text-xl font-black text-gray-900">{item.yourChoice}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-amber-600 uppercase tracking-widest block">Validation Status</span>
                      <p className="text-sm font-bold text-gray-900 italic">Verified Correct</p>
                    </div>
                  </div>
                  <div className="shrink-0 px-6 py-3 bg-white rounded-2xl shadow-sm text-[10px] font-black text-amber-600 uppercase tracking-widest border border-amber-100 whitespace-nowrap">
                    Psychometric Sync ✅
                  </div>
                </div>
              ) : (
                <div className="bg-primary/5 rounded-[2rem] p-8 space-y-4 border border-primary/5">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-primary" />
                    <span className="text-[8px] font-bold text-primary uppercase tracking-widest">Your Answer</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 break-all">{item.yourAnswer}</p>
                </div>
              )}

              <div className="space-y-4">
                <button 
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="flex items-center gap-3 text-primary"
                >
                  <Lightbulb size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest">Logic Breakdown</span>
                  {expandedId === item.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                
                {expandedId === item.id && (
                  <div className="bg-primary/5 rounded-[2rem] p-8 space-y-3 animate-in slide-in-from-top-2 duration-300">
                    {item.breakdown?.map((line: string, lidx: number) => (
                      <p key={lidx} className="text-xs font-medium text-gray-600 leading-relaxed break-all">{line}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-10 pb-20">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors disabled:opacity-30"
          >
            <ChevronDown className="rotate-90" size={18} />
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button 
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentPage === p ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white border border-gray-100 text-gray-400 hover:text-gray-900"}`}
            >
              {p}
            </button>
          ))}
          
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors disabled:opacity-30"
          >
            <ChevronDown className="-rotate-90" size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
