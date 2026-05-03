"use client";

import { useState, useEffect, useRef } from "react";
import QuizTimer from "./QuizTimer";
import EssayView from "./EssayView";
import MultipleChoiceView from "./MultipleChoiceView";
import KraepelinQuiz from "./KraepelinQuiz";
import { ArrowRight, Trophy, Zap } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, increment } from "firebase/firestore";

type QuestionType = "KRA" | "ESS" | "MCQ" | "CHK";

interface Question {
  id: string;
  type: QuestionType;
  title?: string;
  stem?: string;
  question?: string;
  options?: Array<{ text: string; correct?: boolean }>;
  correctAnswerIdx?: number;
  targetWords?: { min: number; max: number };
  kraepelin?: { first: string; second: string; answer: string; total?: string };
  difficulty?: string;
  progress?: number;
}

interface Participant {
  id: string;
  uid: string;
  fullName: string;
  photoURL: string;
  pts: number;
  status: string;
  rank?: number;
}

interface ActiveQuizProps {
  onFinish?: (score: number, answers: Record<number, any>, totalTimeMs: number) => void;
  room?: {
    id: string;
    title: string;
    description: string;
    questions: Question[];
  };
  user?: any; // Keeping user as any for now as it's from Firebase Auth and can be complex
}

export default function ActiveQuiz({ onFinish, room, user }: ActiveQuizProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<number, any>>({});
  const [startTime] = useState(Date.now());
  const [liveLeaderboard, setLiveLeaderboard] = useState<Participant[]>([]);
  const questionStartTime = useRef(Date.now());

  // Listen to live leaderboard
  useEffect(() => {
    if (!room?.id) return;
    const q = query(collection(db, "rooms", room.id, "participants"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Participant[];
      
      // Sort in JS to ensure everyone appears (even if pts field is missing)
      data.sort((a, b) => (b.pts || 0) - (a.pts || 0));
      
      setLiveLeaderboard(data);
    });
    return () => unsubscribe();
  }, [room?.id]);

  // Reset question timer whenever index changes
  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [currentIdx]);

  const mockQuestions: Question[] = [
    {
      id: "0",
      type: "KRA",
      title: "KRAEPELIN ARITHMETIC",
      question: "Rapid Unit Sum Addition",
      progress: 0
    },
    {
      id: "1",
      type: "ESS",
      title: "ESSAY 0 OF 1",
      question: "Seorang pengembang mengalokasikan 1/3 dari total waktu kerjanya untuk merancang Finite Automata dan 1/4 waktunya untuk implementasi kode. Jika ia memiliki sisa waktu 10 jam untuk tahap pengujian, hitunglah total waktu kerja pengembang.",
      targetWords: { min: 250, max: 500 },
      progress: 25
    },
    {
      id: "2",
      type: "MCQ",
      title: "QUESTION 1 OF 2",
      question: "Karena kamu lebih suka rebahan dan berada di kamar, dari 24 jam sehari kamu menghabiskan 10 jam untuk tidur dan 4 jam untuk bersantai. Berapa komponen yang selesai dalam sehari?",
      options: [
        { text: "3 Komponen", correct: false },
        { text: "4 Komponen", correct: false },
        { text: "5 Komponen", correct: true },
        { text: "6 Komponen", correct: false }
      ],
      correctAnswerIdx: 2,
      progress: 70
    }
  ];

  const questions: Question[] = room?.questions?.map((q: any, idx: number) => {
    const type: QuestionType = q.type || "MCQ";
    return {
      id: idx.toString(),
      type,
      title: `${type === "KRA" ? "KRAEPELIN" : type === "ESS" ? "ESSAY" : type === "CHK" ? "CHECKBOX" : "MULTIPLE CHOICE"} ${idx + 1} OF ${room.questions.length}`,
      question: q.stem || (type === "KRA" ? "Rapid Unit Sum Addition" : "No Question Provided"),
      options: q.options,
      correctAnswerIdx: q.options?.findIndex((o: any) => o.correct),
      targetWords: q.targetWords || { min: 10, max: 500 },
      progress: Math.round(((idx + 1) / room.questions.length) * 100),
      kraepelin: q.kraepelin,
      difficulty: q.difficulty
    };
  }) || [];

  const current = questions[currentIdx];

  const calculatePoints = (isCorrect: boolean, timeUsedMs: number, maxTimeMs: number, difficulty?: string) => {
    if (!isCorrect) return 0;
    
    let baseXP = 50;
    if (difficulty?.toLowerCase() === "easy") baseXP = 25;
    if (difficulty?.toLowerCase() === "hard") baseXP = 100;

    const timeUsedRatio = timeUsedMs / maxTimeMs;
    let multiplier = 1;
    
    if (timeUsedRatio <= 0.25) multiplier = 4;
    else if (timeUsedRatio <= 0.50) multiplier = 3;
    else if (timeUsedRatio <= 0.75) multiplier = 2;
    
    return baseXP * multiplier;
  };

  const handleNext = async (answer: any) => {
    const timeUsedMs = Date.now() - questionStartTime.current;
    const newAnswers = { ...studentAnswers, [currentIdx]: answer };
    setStudentAnswers(newAnswers);

    // Points calculation for current question
    if (current.type === "MCQ" || current.type === "CHK" || current.type === "KRA") {
      let isCorrect = false;
      let kraepelinAccuracy = 0;

      if (current.type === "MCQ") {
        isCorrect = answer === current.correctAnswerIdx;
      } else if (current.type === "KRA") {
        const responses = Array.isArray(answer) ? answer : [];
        if (responses.length > 0) {
          const correctCount = responses.filter((r: any) => r.input === r.expected).length;
          kraepelinAccuracy = (correctCount / responses.length) * 100;
          isCorrect = kraepelinAccuracy >= 80; // Example: 80% accuracy counts as "correct" for points
        }
      } else {
        const selectedIndices = Array.isArray(answer) ? answer : (answer !== undefined ? [answer] : []);
        const correctIndices = current.options?.reduce((acc: number[], o, i) => o.correct ? [...acc, i] : acc, []) || [];
        isCorrect = correctIndices.length === selectedIndices.length && correctIndices.every((i: number) => selectedIndices.includes(i));
      }

      if (isCorrect && user?.uid && room?.id) {
        const pts = calculatePoints(isCorrect, timeUsedMs, 30000, current.difficulty);
        try {
          await updateDoc(doc(db, "rooms", room.id, "participants", user.uid), {
            pts: increment(pts)
          });
        } catch (e) {
          console.error("Error updating points:", e);
        }
      }
    }

    if (currentIdx === questions.length - 1) {
      if (onFinish) {
        let correctCount = 0;
        let mcqCount = 0;
        questions.forEach((q, idx) => {
          if (q.type === "MCQ" || q.type === "CHK") {
            mcqCount++;
            const selected = newAnswers[idx];
            if (q.type === "MCQ") {
              if (selected === q.correctAnswerIdx) correctCount++;
            } else {
              const selectedIndices = Array.isArray(selected) ? selected : (selected !== undefined ? [selected] : []);
              const correctIndices = q.options?.reduce((acc: number[], o, i) => o.correct ? [...acc, i] : acc, []) || [];
              if (correctIndices.length === selectedIndices.length && correctIndices.every((i: number) => selectedIndices.includes(i))) {
                correctCount++;
              }
            }
          }
        });
        const score = mcqCount > 0 ? Math.round((correctCount / mcqCount) * 100) : 100;
        const totalTimeMs = Date.now() - startTime;
        onFinish(score, newAnswers, totalTimeMs);
      }
    } else {
      setCurrentIdx((prev) => prev + 1);
      questionStartTime.current = Date.now();
    }
  };

  const leaderboardToDisplay = liveLeaderboard;

  return (
    <div className="flex-1 flex gap-8 p-12 overflow-hidden h-full">
      <div className="flex-1 flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-y-auto pr-4">
        
        {/* Quiz Header Area */}
        {current.type !== "KRA" && (
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-4 pr-12">
              <div className="flex items-center justify-between text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2">
                <span className="break-all pr-4">{current.title}</span>
                <span className="text-gray-400">{current.progress}% Complete</span>
              </div>
              <div className="w-full h-1.5 bg-blue-50 rounded-full overflow-hidden border border-blue-100/50">
                <div 
                  className="h-full bg-primary transition-all duration-1000 ease-out" 
                  style={{ width: `${current.progress}%` }}
                ></div>
              </div>
            </div>
            
            <QuizTimer 
              initialSeconds={current.type === "ESS" ? 120 : 60} 
              onTimeUp={() => handleNext(studentAnswers[currentIdx])}
            />
          </div>
        )}

        {/* Dynamic Content */}
        <div className="flex-1">
          {current.type === "KRA" && (
            <KraepelinQuiz 
              onComplete={(responses) => handleNext(responses)} 
              totalQuestions={current.kraepelin?.total ? parseInt(current.kraepelin.total, 10) : 1} 
              settings={current.kraepelin} 
            />
          )}
          {current.type === "ESS" && (
            <EssayView 
              question={current.question || ""} 
              targetWords={current.targetWords || { min: 10, max: 500 }} 
              value={studentAnswers[currentIdx] || ""}
              onChange={(val: string) => setStudentAnswers({ ...studentAnswers, [currentIdx]: val })}
            />
          )}
          {(current.type === "MCQ" || current.type === "CHK") && (
            <div className="space-y-8">
              <div className="flex items-center justify-between gap-6 overflow-hidden">
                <h3 className={`font-black text-gray-900 leading-tight flex-1 break-all ${current.question && current.question.length > 100 ? 'text-2xl' : 'text-3xl md:text-4xl'}`}>
                  {current.question}
                </h3>
                <div className="bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 flex items-center gap-2">
                  <Zap size={14} className="text-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    {room?.questions?.[currentIdx]?.difficulty || "NORMAL"} MODE (+{room?.questions?.[currentIdx]?.difficulty === "hard" ? 100 : room?.questions?.[currentIdx]?.difficulty === "easy" ? 25 : 50} XP)
                  </span>
                </div>
              </div>

              <MultipleChoiceView 
                question={current.question || ""} 
                options={current.options?.map((o) => o.text) || []} 
                selectedOption={studentAnswers[currentIdx]}
                multiSelect={current.type === "CHK"}
                onSelect={(idx: number | number[]) => setStudentAnswers({ ...studentAnswers, [currentIdx]: idx })}
              />
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              <span className="text-[10px] font-bold text-primary">LIVE</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Room Status</span>
              <p className="text-xs font-bold text-gray-900 italic">Syncing Points Real-time...</p>
            </div>
          </div>

          <button 
            onClick={() => handleNext(studentAnswers[currentIdx])} 
            className="bg-primary text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 group"
          >
            <span>{currentIdx === questions.length - 1 ? "Complete Quiz" : "Next Station"}</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Leaderboard Sidebar */}
      <div className="w-80 flex flex-col gap-6">
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Trophy size={20} className="text-amber-500" />
              <h3 className="text-lg font-black text-gray-900 italic">Live Room</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">Active Now</span>
            </div>
          </div>

          <div className="space-y-4 overflow-y-auto flex-1 no-scrollbar">
            {leaderboardToDisplay.map((p, idx) => {
              const rank = p.rank || idx + 1;
              const isMe = p.id === user?.uid;
              
              return (
                <div 
                  key={p.id}
                  className={`flex items-center gap-4 p-5 rounded-3xl transition-all border ${
                    isMe 
                    ? "bg-primary/5 border-primary/20 scale-[1.02]" 
                    : "bg-gray-50/50 border-transparent hover:border-gray-100"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black italic ${
                    rank === 1 ? "bg-amber-100 text-amber-600" :
                    rank === 2 ? "bg-slate-100 text-slate-500" :
                    rank === 3 ? "bg-orange-100 text-orange-600" :
                    "bg-gray-100 text-gray-400"
                  }`}>
                    {rank}
                  </div>
                  <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                    <img src={p.photoURL} alt={p.fullName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-wide line-clamp-1">
                      {isMe ? "YOU" : p.fullName}
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-primary italic">{(p.pts || 0).toLocaleString()}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">PTS</span>
                    </div>
                  </div>
                  {rank === 1 && <Trophy size={14} className="text-amber-500" />}
                </div>
              );
            })}
          </div>

          <button className="mt-8 text-primary text-[10px] font-black uppercase tracking-widest hover:underline text-center w-full italic">
            View Full Standings
          </button>
        </div>

        {/* Next up indicator */}
        <div className="bg-primary rounded-3xl p-6 text-white shadow-xl shadow-primary/20">
          <span className="text-[8px] font-black opacity-60 uppercase tracking-widest block mb-2">Up Next</span>
          <p className="text-sm font-black italic">
            {currentIdx < questions.length - 1 ? questions[currentIdx + 1].title : "Final Analysis"}
          </p>
        </div>
      </div>
    </div>
  );
}
