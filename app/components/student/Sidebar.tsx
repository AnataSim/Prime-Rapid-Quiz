"use client";

import { 
  UserPlus, 
  Gamepad2, 
  LineChart, 
  Trophy, 
  HelpCircle, 
  LogOut, 
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  user?: any;
}

export default function Sidebar({ activeTab, setActiveTab, onLogout, user }: SidebarProps) {
  const menuItems = [
    { id: "join", label: "Join Room", icon: <UserPlus size={18} /> },
    { id: "quiz", label: "Active Quiz", icon: <Gamepad2 size={18} /> },
    { id: "performance", label: "Performance", icon: <LineChart size={18} /> },
    { id: "leaderboards", label: "Leaderboards", icon: <Trophy size={18} /> },
  ];

  return (
    <aside className="w-64 bg-white/50 backdrop-blur-xl border-r border-gray-100 flex flex-col h-[calc(100vh-64px)] fixed left-0 top-16 z-20">
      {/* Profile Section */}
      <div className="p-8 pt-4">
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">{user?.fullName || user?.displayName || "Precision Player"}</h2>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Rank: Elite</p>
        </div>

        {/* Nav Links */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-bold transition-all ${
                activeTab === item.id
                  ? "bg-white text-primary shadow-sm border border-gray-100"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"
              }`}
            >
              <span className={activeTab === item.id ? "text-primary" : "text-gray-400"}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="mt-auto p-8 pb-12 space-y-6">
        <button className="w-full bg-primary hover:bg-primary-dark text-white text-[11px] font-black py-4.5 rounded-xl shadow-lg shadow-primary/20 transition-all uppercase tracking-widest">
          Quick Join
        </button>
        
        <div className="pt-4 space-y-2">
          <button 
            onClick={() => setActiveTab("help")}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-bold transition-all ${
              activeTab === "help"
                ? "bg-white text-primary shadow-sm border border-gray-100 rounded-xl"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <HelpCircle size={18} />
            Help
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
