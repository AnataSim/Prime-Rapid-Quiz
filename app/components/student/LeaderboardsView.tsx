"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, doc, getDoc, orderBy, onSnapshot } from "firebase/firestore";
import { Trophy, Zap, CheckSquare, Brain, Puzzle, Binary, ChevronDown, X } from "lucide-react";
import AccuracyAnalytics from "./AccuracyAnalytics";
import QuestionReview from "./QuestionReview";
import LeaderboardTable from "./LeaderboardTable";

interface RoomHistory {
  id: string;
  roomId: string;
  roomTitle: string;
  score: number;
  totalTimeMs: number;
  rank: number;
  percentile: string;
  answers: any;
  completedAt: any;
  roomData?: any;
  accuracy?: number;
  avgSpeedMs?: number;
}

export default function LeaderboardsView({ user }: { user?: any }) {
  const [history, setHistory] = useState<RoomHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<RoomHistory | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchHistory = async () => {
      try {
        const historyRef = collection(db, "users", user.uid, "quizHistory");
        const q = query(historyRef, orderBy("completedAt", "desc"));
        const snapshot = await getDocs(q);
        
        const historyData: RoomHistory[] = [];
        for (const d of snapshot.docs) {
          const data = d.data() as any;
          
          // Fetch room details for each history entry
          let roomData = null;
          try {
            const roomDoc = await getDoc(doc(db, "rooms", data.roomId));
            if (roomDoc.exists()) {
              roomData = roomDoc.data();
            }
          } catch (e) {
            console.error("Error fetching room details:", e);
          }

          // Fetch essayGrades from participant doc so student can see essay feedback
          let essayGrades: Record<string, boolean> = {};
          try {
            const participantDoc = await getDoc(doc(db, "rooms", data.roomId, "participants", user.uid));
            if (participantDoc.exists()) {
              essayGrades = participantDoc.data()?.essayGrades || {};
            }
          } catch (e) {
            console.error("Error fetching essayGrades:", e);
          }

          historyData.push({
            id: d.id,
            ...data,
            roomData,
            essayGrades
          });
        }
        setHistory(historyData);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user?.uid]);

  // Aggregate Stats
  const roomsCompleted = history.length;
  const totalXP = history.reduce((sum, item) => sum + (item.score || 0), 0);
  const highestRank = history.length > 0 
    ? "#" + Math.min(...history.map(item => item.rank)).toString().padStart(2, '0')
    : "-";
  const highestRankRoom = history.length > 0 
    ? history.find(item => "#" + item.rank.toString().padStart(2, '0') === highestRank)?.roomTitle 
    : "No Data";

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-12 flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-y-auto h-screen scrollbar-hide">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Activity Log</span>
          </div>
          <h2 className="text-6xl font-black text-[#1A2B56] tracking-tight">Room History</h2>
        </div>
        <button className="bg-white px-8 py-3 rounded-full shadow-sm border border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-3">
          Recent
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-3 gap-8">
        {/* Highest Rank */}
        <div className="bg-blue-50/50 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center space-y-4 border border-blue-100/50">
          <Trophy className="text-primary mb-2" size={32} />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Highest Rank</span>
          <h3 className="text-5xl font-black text-[#1A2B56] tracking-tighter">{highestRank}</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{highestRankRoom}</p>
        </div>

        {/* XP Earned */}
        <div className="bg-amber-50/50 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center space-y-4 border border-amber-100/50">
          <Zap className="text-amber-500 mb-2" size={32} />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Total XP Earned</span>
          <h3 className="text-5xl font-black text-[#1A2B56] tracking-tighter">{totalXP.toLocaleString()}</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Across All Sessions</p>
        </div>

        {/* Rooms Completed */}
        <div className="bg-purple-50/50 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center space-y-4 border border-purple-100/50">
          <CheckSquare className="text-purple-500 mb-2" size={32} />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Rooms Completed</span>
          <h3 className="text-5xl font-black text-[#1A2B56] tracking-tighter">{roomsCompleted}</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">100% Completion Rate</p>
        </div>
      </div>

      {/* History Grid */}
      <div className="grid grid-cols-3 gap-8 pb-20">
        {history.map((room) => (
          <div 
            key={room.id} 
            onClick={() => setSelectedRoom(room)}
            className="bg-white rounded-[3rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] border border-white space-y-8 group hover:translate-y-[-4px] transition-all duration-500 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center bg-gray-50 text-primary shadow-sm`}>
                <Brain size={20} />
              </div>
              <div className="text-right">
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">Completed</span>
                <span className="text-[10px] font-bold text-gray-900">
                  {room.completedAt?.toDate?.()?.toLocaleDateString() || "Recently"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-2xl font-black text-[#1A2B56] tracking-tight">{room.roomTitle}</h4>
              <p className="text-xs font-medium text-gray-400 leading-relaxed line-clamp-2">
                {room.roomData?.description || "Historical performance log from this assessment room."}
              </p>
            </div>

            <div className="bg-gray-50/50 rounded-[2rem] p-6 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">Your Rank</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-primary tracking-tighter">#{room.rank.toString().padStart(2, '0')}</span>
                </div>
              </div>
              <div className="text-right space-y-1">
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">Score</span>
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="text-2xl font-black text-[#1A2B56] tracking-tighter">{(room.score || 0).toLocaleString()}</span>
                  <span className="text-[10px] font-black text-amber-500 italic">XP</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-[#1A2B56]/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-[4rem] shadow-2xl flex flex-col overflow-hidden relative">
            <button 
              onClick={() => setSelectedRoom(null)}
              className="absolute top-8 right-8 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all z-10"
            >
              <X size={20} />
            </button>

            <div className="flex-1 overflow-y-auto p-16 space-y-12 no-scrollbar">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Historical Review</span>
                </div>
                <h2 className="text-5xl font-extrabold text-gray-900 tracking-tight">{selectedRoom.roomTitle}</h2>
                <p className="text-gray-400 font-medium leading-relaxed">
                  Assessment analysis for {selectedRoom.roomTitle}. Your rank was #{selectedRoom.rank} with a score of {selectedRoom.score} XP.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left Column: Leaderboard & Analytics */}
                <div className="space-y-12">
                   <div className="flex flex-col gap-8">
                     <LeaderboardTable room={{ id: selectedRoom.roomId }} user={user} />
                     <AccuracyAnalytics data={{ 
                       score: selectedRoom.accuracy, 
                       totalTimeMs: selectedRoom.totalTimeMs,
                       answers: selectedRoom.answers, 
                       room: selectedRoom.roomData 
                     }} />
                   </div>
                </div>

                {/* Right Column: Question Review */}
                <div className="space-y-8">
                  <QuestionReview data={{ answers: selectedRoom.answers, room: selectedRoom.roomData || { questions: [] }, essayGrades: (selectedRoom as any).essayGrades || {} }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="py-8 border-t border-gray-100 flex justify-center">
        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em]">
          © 2024 PRIME RAPID QUIZ SYSTEM • HIGH PRECISION ASSESSMENT ENGINE
        </p>
      </footer>

    </div>
  );
}
