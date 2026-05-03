"use client";

import { Trophy, Zap, Clock, Info } from "lucide-react";

export default function StatsSidebar() {
  const leaderboard = [
    { id: 1, name: "Sarah_Genius", points: "1,580 pts", rank: "#1", color: "text-amber-500" },
    { id: 2, name: "Arjun_Pro", points: "1,410 pts", rank: "#2", color: "text-gray-400" },
    { id: 3, name: "M. Tanaka", points: "1,350 pts", rank: "#3", color: "text-amber-700" },
  ];

  return (
    <aside className="w-80 p-8 flex flex-col gap-8 h-screen sticky top-0 bg-[#F4F6FB]/50">
      
      {/* Live Performance */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Live Performance</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]">
            <span className="text-[10px] font-bold text-gray-400 block mb-1">Accuracy</span>
            <span className="text-2xl font-extrabold text-gray-900 tracking-tight">100%</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]">
            <span className="text-[10px] font-bold text-gray-400 block mb-1">Time</span>
            <span className="text-2xl font-extrabold text-gray-900 tracking-tight">16s</span>
          </div>
        </div>
      </div>

      {/* Active Session */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 flex flex-col h-[400px]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-gray-900">Active Session</h3>
          <Trophy size={18} className="text-amber-500" />
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {/* Current User */}
          <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center justify-between transition-all hover:bg-primary/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-[10px] font-bold">#4</div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-gray-900">YOU</span>
                <span className="text-[10px] font-bold text-primary block">1,240 pts</span>
              </div>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
          </div>

          {/* List */}
          {leaderboard.map((user) => (
            <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 rounded-2xl transition-all">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold ${user.color} w-8`}>{user.rank}</span>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-900">{user.name}</span>
                  <span className="text-[10px] font-bold text-gray-400 block">{user.points}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full py-4 border border-gray-100 rounded-xl text-[10px] font-bold text-primary hover:bg-primary/5 transition-all mt-4 uppercase tracking-widest">
          View Full Global Standings
        </button>
      </div>

      {/* Pro Tip Card */}
      <div className="bg-gray-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-primary/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
        <div className="flex items-center gap-2 mb-4">
          <Zap size={14} className="text-amber-400 fill-amber-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Pro Tip</span>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Focus on the vertical alignment to trigger muscle memory for single-digit addition. Don't think about the tens place!
        </p>
      </div>

    </aside>
  );
}
