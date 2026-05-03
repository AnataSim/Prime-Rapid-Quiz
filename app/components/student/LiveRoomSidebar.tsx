"use client";

import { Trophy, Clock, ArrowRight } from "lucide-react";

export default function LiveRoomSidebar() {
  const leaderboard = [
    { id: 1, name: "Jobet", points: "7,620 PTS", rank: 1, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jobet" },
    { id: 2, name: "YOU", points: "5,975 PTS", rank: 2, isMe: true, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" },
    { id: 3, name: "A. Prisma", points: "5,232 PTS", rank: 3, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Prisma" },
    { id: 4, name: "Neuro", points: "5,169 PTS", rank: 4, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Neuro" },
  ];

  return (
    <aside className="w-80 flex flex-col gap-8 h-screen sticky top-0 bg-[#F4F6FB]/50 p-8">
      
      <div className="bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] border border-white p-8 space-y-8 flex flex-col">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Live Room</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[8px] font-bold text-green-500 uppercase tracking-widest">Active Now</span>
          </div>
        </div>

        <div className="space-y-4">
          {leaderboard.map((user) => (
            <div 
              key={user.id} 
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                user.isMe 
                  ? "bg-primary/5 border-primary/10 shadow-sm" 
                  : "bg-gray-50/50 border-transparent hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  user.rank === 1 ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {user.rank}
                </div>
                <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-gray-900">{user.name === "YOU" ? `${user.name}` : user.name}</h4>
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${user.isMe ? "text-primary" : "text-gray-400"}`}>
                    {user.points}
                  </span>
                </div>
              </div>
              {user.rank === 1 && <Trophy size={14} className="text-amber-500" />}
            </div>
          ))}
        </div>

        <button className="w-full py-4 text-[10px] font-bold text-primary hover:underline transition-all uppercase tracking-widest">
          View Full Standings
        </button>
      </div>

      {/* Up Next Card */}
      <div className="bg-primary rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-xl shadow-primary/20">
        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
        
        <span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-60 mb-4 block">Up Next</span>
        <h4 className="text-xl font-extrabold leading-tight tracking-tight mb-6">Advanced Data Structures</h4>
        
        <div className="flex items-center gap-2 opacity-80">
          <Clock size={14} />
          <span className="text-[10px] font-bold tracking-widest uppercase">Starts in 4m 12s</span>
        </div>
      </div>

    </aside>
  );
}
