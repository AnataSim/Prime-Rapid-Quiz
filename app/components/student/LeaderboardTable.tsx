"use client";

import { User, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";

interface LeaderboardTableProps {
  room?: any;
  user?: any;
}

export default function LeaderboardTable({ room, user }: LeaderboardTableProps) {
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    if (!room?.id) return;

    const q = query(collection(db, "rooms", room.id, "participants"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pData: any[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by PTS descending, then by time ascending
      pData.sort((a, b) => {
        if ((b.pts || 0) !== (a.pts || 0)) {
          return (b.pts || 0) - (a.pts || 0);
        }
        return (a.totalTimeMs || Infinity) - (b.totalTimeMs || Infinity);
      });

      setParticipants(pData);
    });

    return () => unsubscribe();
  }, [room?.id]);

  const formatTime = (ms?: number) => {
    if (!ms) return "--:--";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculatePercentile = (rank: number, total: number) => {
    if (total <= 1) return "100%";
    const p = Math.round(((total - rank + 1) / total) * 100);
    return `${p}%`;
  };

  const myRank = participants.findIndex(p => p.id === user?.uid) + 1;

  return (
    <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] border border-white p-10 space-y-8 flex-1">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Room Leaderboard</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Local ranking for Room ID: #{room?.id?.slice(-6) || "N/A"}</p>
        </div>
        <div className="text-right">
          <span className="text-4xl font-black text-primary tracking-tighter block leading-none">#{myRank > 0 ? myRank : "-"}</span>
          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Your Rank</span>
        </div>
      </div>

      <div className="w-full">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
              <th className="py-4 font-bold">Rank</th>
              <th className="py-4 font-bold">Candidate</th>
              <th className="py-4 font-bold text-right">Score</th>
              <th className="py-4 font-bold text-right">Time</th>
              <th className="py-4 font-bold text-right pr-4">Accuracy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50/50">
            {participants.map((p, idx) => {
              const rank = idx + 1;
              const isMe = p.id === user?.uid;
              const accuracy = p.accuracy !== undefined ? `${p.accuracy}%` : "0%";
              
              return (
                <tr 
                  key={p.id} 
                  className={`group transition-all ${isMe ? "bg-primary/5" : "hover:bg-gray-50/50"}`}
                >
                  <td className="py-5">
                    <span className={`text-[11px] font-bold ${isMe ? "text-primary" : "text-gray-900"}`}>
                      {rank.toString().padStart(2, '0')}
                    </span>
                  </td>
                  <td className="py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-[10px] font-bold overflow-hidden border-2 border-white shadow-sm ${rank === 1 ? "bg-amber-500" : rank === 2 ? "bg-slate-400" : rank === 3 ? "bg-orange-400" : "bg-gray-400"}`}>
                        <img src={p.photoURL} alt={p.fullName} className="w-full h-full object-cover" />
                      </div>
                      <span className={`text-sm font-bold ${isMe ? "text-primary" : "text-gray-900"}`}>
                        {p.fullName}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 text-right">
                    <span className={`text-sm font-bold ${isMe ? "text-primary" : "text-gray-900"}`}>
                      {(p.finalScore || p.pts || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-5 text-right">
                    <span className="text-sm font-medium text-gray-400">{formatTime(p.totalTimeMs || 0)}</span>
                  </td>
                  <td className="py-5 text-right pr-4">
                    <span className={`text-sm font-bold ${isMe ? "text-primary" : "text-gray-600"}`}>{accuracy}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
