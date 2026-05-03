"use client";

import { 
  Users, 
  User, 
  CheckCircle2, 
  Circle, 
  LogOut, 
  Play, 
  AlertCircle,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

interface RoomLobbyProps {
  onStart: () => void;
  onLeave: () => void;
  room?: any;
}

export default function RoomLobby({ onStart, onLeave, room }: RoomLobbyProps) {
  const [liveParticipants, setLiveParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!room?.id) return;

    const participantsRef = collection(db, "rooms", room.id, "participants");
    const q = query(participantsRef, orderBy("joinedAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLiveParticipants(pData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [room?.id]);

  const totalQuestions = room?.questions ? room.questions.length : 5;

  return (
    <div className="flex-1 p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="max-w-6xl mx-auto flex gap-8">
        
        {/* Left Column: Participants */}
        <div className="flex-1 space-y-10">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Environment: Alpha Sector</span>
            <h2 className="text-5xl font-extrabold text-gray-900 tracking-tight">Room Lobby: {room?.title || "Meth"}</h2>
          </div>

          <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] border border-white p-10 space-y-8">
            <div className="flex items-center justify-between border-b border-gray-50 pb-6">
              <div className="flex items-center gap-3">
                <Users size={20} className="text-primary" />
                <h3 className="text-lg font-bold text-gray-900">Live Participants</h3>
              </div>
              <span className="text-[10px] font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-full uppercase tracking-widest">
                {liveParticipants.length} Connected
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
              {liveParticipants.length === 0 && !loading && (
                <div className="col-span-2 py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                  <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">Waiting for connections...</p>
                </div>
              )}
              {liveParticipants.map((p, idx) => (
                <div 
                  key={p.id} 
                  className={`flex items-center gap-4 p-5 rounded-2xl border transition-all bg-gray-50/50 border-transparent hover:border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-sm relative">
                    <img src={p.photoURL} alt={p.fullName} className="w-full h-full object-cover" />
                    {p.status === "READY" && <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{p.fullName}</h4>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${p.status === "READY" ? "text-primary" : "text-gray-400"}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {liveParticipants.length > 6 && (
              <button className="w-full text-primary text-[11px] font-black py-2 hover:underline transition-all uppercase tracking-widest">
                Scroll to view all {liveParticipants.length} participants
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Room Info & Checklist */}
        <div className="w-80 space-y-6">
          
          {/* Room Card */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-900 p-8 flex flex-col items-center justify-center relative group">
              <div className="absolute inset-0 bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 z-10">
                <BinaryIcon className="w-8 h-8 text-white opacity-40" />
              </div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest z-10 italic">Secure Connection</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="space-y-1">
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Room Code</span>
                  <p className="text-sm font-bold text-primary tracking-widest">{room?.accessCode || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Participants</span>
                  <p className="text-sm font-bold text-gray-900">{liveParticipants.length} / {room?.participantLimit || 20}</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-50">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-gray-400 uppercase tracking-widest">Difficulty Level</span>
                  <span className="font-bold text-amber-500 uppercase tracking-widest">Mixed</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-gray-400 uppercase tracking-widest">Time Limit</span>
                  <span className="font-bold text-gray-900 uppercase tracking-widest">Dynamic</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-gray-400 uppercase tracking-widest">Questions</span>
                  <span className="font-bold text-gray-900 uppercase tracking-widest">{totalQuestions} Modules</span>
                </div>
              </div>

              <button 
                onClick={onStart}
                disabled={room?.status !== "LIVE"}
                className={`w-full text-white text-sm font-bold py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98] ${
                  room?.status === "LIVE" 
                  ? "bg-primary hover:bg-primary-dark shadow-primary/20" 
                  : "bg-gray-400 cursor-not-allowed shadow-none"
                }`}
              >
                {room?.status === "LIVE" ? "START QUIZ" : "WAITING FOR HOST..."}
              </button>

              <button 
                onClick={onLeave}
                className="w-full flex items-center justify-center gap-2 text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
              >
                <LogOut size={14} />
                Leave Room
              </button>
            </div>
          </div>

          {/* Checklist Card */}
          <div className="bg-primary/5 rounded-[2rem] border border-primary/10 p-8 space-y-6">
            <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-4">Preparation Checklist</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-green-500" />
                <span className="text-[10px] font-medium text-gray-600">High-speed connection active</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-green-500" />
                <span className="text-[10px] font-medium text-gray-600">Biometric verification complete</span>
              </div>
              <div className="flex items-center gap-3">
                <Circle size={16} className="text-gray-300" />
                <span className="text-[10px] font-medium text-gray-400">Peripheral sync in progress...</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function BinaryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 22h4" />
      <path d="M12 2v4" />
      <path d="m2 10 4 4" />
      <path d="m18 10 4 4" />
      <circle cx="12" cy="12" r="4" />
      <path d="m4.93 4.93 2.83 2.83" />
      <path d="m16.24 16.24 2.83 2.83" />
      <path d="m16.24 7.76 2.83-2.83" />
      <path d="m4.93 19.07 2.83-2.83" />
    </svg>
  );
}
