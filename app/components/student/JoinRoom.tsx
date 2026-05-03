"use client";

import { useState, useEffect } from "react";
import { Search, History, ArrowRight, Brain, X, Clock } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";
import LeaderboardTable from "./LeaderboardTable";
import AccuracyAnalytics from "./AccuracyAnalytics";
import QuestionReview from "./QuestionReview";

interface JoinRoomProps {
  onJoin: (code: string) => Promise<boolean | string>;
  user?: any;
  joinError?: string | null;
  rejoinStatus?: "none" | "pending" | "approved";
  onRequestRejoin?: () => void;
}

interface RoomHistory {
  id: string;
  roomId: string;
  roomTitle: string;
  score: number;
  accuracy?: number;
  totalTimeMs?: number;
  avgSpeedMs?: number;
  rank: number;
  answers: any;
  completedAt: any;
  roomData?: any;
  essayGrades?: Record<string, boolean>;
}

function timeAgo(timestamp: any): string {
  if (!timestamp) return "Recently";
  const date = timestamp?.toDate?.() ?? new Date(timestamp);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} Minute${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} Hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} Days ago`;
  return date.toLocaleDateString();
}

export default function JoinRoom({ onJoin, user, joinError, rejoinStatus, onRequestRejoin }: JoinRoomProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [history, setHistory] = useState<RoomHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<RoomHistory | null>(null);

  // Fetch most recent 3 rooms from Firebase quiz history
  useEffect(() => {
    if (!user?.uid) {
      setLoadingHistory(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        const histRef = collection(db, "users", user.uid, "quizHistory");
        const q = query(histRef, orderBy("completedAt", "desc"), limit(3));
        const snap = await getDocs(q);

        const data: RoomHistory[] = [];
        for (const d of snap.docs) {
          const entry = d.data() as any;

          // Fetch room details
          let roomData = null;
          try {
            const roomDoc = await getDoc(doc(db, "rooms", entry.roomId));
            if (roomDoc.exists()) roomData = roomDoc.data();
          } catch (_) {}

          // Fetch essay grades from participant doc
          let essayGrades: Record<string, boolean> = {};
          try {
            const pDoc = await getDoc(doc(db, "rooms", entry.roomId, "participants", user.uid));
            if (pDoc.exists()) essayGrades = pDoc.data()?.essayGrades || {};
          } catch (_) {}

          data.push({ id: d.id, ...entry, roomData, essayGrades });
        }
        setHistory(data);
      } catch (e) {
        console.error("Error fetching history:", e);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [user?.uid]);

  const handleJoinClick = async () => {
    if (!code.trim()) { setError(true); return; }
    const success = await onJoin(code);
    if (success === false) setError(true);
    else setError(false);
  };

  return (
    <>
      <div className="flex-1 p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="max-w-4xl mx-auto space-y-16 py-12">
          {/* Hero */}
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-extrabold text-gray-900 tracking-tight">Enter the Arena.</h2>
            <p className="text-gray-400 font-medium">Input your access code to join a live competitive session.</p>
          </div>

          {/* Code Input */}
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] border border-white p-12 space-y-8 relative">
              <div className="space-y-3 text-center">
                <label className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Room Access Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(false); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleJoinClick(); }}
                  placeholder="E.G. PQ-882-XJ"
                  className={`w-full bg-blue-50/50 border focus:bg-white rounded-2xl py-6 px-8 text-center text-2xl font-bold tracking-[0.1em] text-primary outline-none transition-all placeholder:text-blue-200 ${
                    error || joinError ? "border-red-400 focus:border-red-500 bg-red-50/50 text-red-600" : "border-transparent focus:border-primary/20"
                  }`}
                />
                
                {error && !joinError && (
                  <p className="text-red-500 text-xs font-bold absolute left-0 right-0 text-center animate-in fade-in slide-in-from-top-2">
                    Invalid Room Code. Please try again.
                  </p>
                )}
              </div>

              {joinError && (
                <div className="p-5 bg-red-50 border border-red-100 rounded-2xl space-y-4 animate-in zoom-in-95 duration-300">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <X size={14} className="text-red-600" />
                    </div>
                    <p className="text-[13px] font-bold text-red-900 leading-relaxed">
                      {joinError}
                    </p>
                  </div>
                  
                  {rejoinStatus === "none" && onRequestRejoin && (
                    <button 
                      onClick={onRequestRejoin}
                      className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white text-[11px] font-black py-3 rounded-xl transition-all uppercase tracking-widest"
                    >
                      Kirim Permintaan Join Ulang
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={handleJoinClick}
                disabled={rejoinStatus === "pending"}
                className={`w-full text-white text-sm font-bold py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 ${
                  rejoinStatus === "pending" 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-primary hover:bg-primary-dark shadow-primary/20"
                }`}
              >
                {rejoinStatus === "pending" ? "MENUNGGU IZIN..." : "JOIN QUIZ"}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Recent Rooms — rolling queue, max 3, from Firebase */}
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900">Recent Rooms</h3>
              <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                <Clock size={13} />
                <span>Last 3 Sessions</span>
              </div>
            </div>

            {loadingHistory ? (
              <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm animate-pulse h-40" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-16 text-gray-400 font-medium text-sm">
                No room history yet. Join your first quiz!
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {history.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="w-10 h-10 bg-blue-50 text-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Brain size={18} />
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">Score</span>
                        <span className="text-sm font-black text-amber-500">{room.score || 0} XP</span>
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1 line-clamp-1">{room.roomTitle}</h4>
                    <p className="text-[10px] text-gray-400 font-medium">Last played: {timeAgo(room.completedAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal — identical to LeaderboardsView */}
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
                {/* Left: Leaderboard & Analytics */}
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

                {/* Right: Question Review */}
                <div className="space-y-8">
                  <QuestionReview data={{
                    answers: selectedRoom.answers,
                    room: selectedRoom.roomData || { questions: [] },
                    essayGrades: selectedRoom.essayGrades || {}
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
