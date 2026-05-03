"use client";

import { User } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user?: any;
}

export default function Header({ activeTab, setActiveTab, user }: HeaderProps) {
  const navLinks = [
    { id: "join", label: "Join Room" },
    { id: "quiz", label: "Active Quiz" },
    { id: "performance", label: "Performance" },
    { id: "leaderboards", label: "Leaderboards" },
  ];

  return (
    <header className="h-16 bg-[#F8F9FF] border-b border-gray-100 flex items-center justify-between px-8 fixed top-0 left-0 right-0 z-40 w-full">
      {/* Left: Brand Logo */}
      <div className="flex items-center">
        <h1 className="text-lg font-extrabold text-primary tracking-tight">
          Prime Rapid Quiz
        </h1>
      </div>

      {/* Center: Navigation Links */}
      <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-8">
        {navLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => setActiveTab(link.id)}
            className={`text-[13px] font-bold tracking-tight transition-all relative py-5 ${
              activeTab === link.id
                ? "text-primary"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {link.label}
            {activeTab === link.id && (
              <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full"></span>
            )}
          </button>
        ))}
      </nav>

      {/* Right: User Profile */}
      <div 
        onClick={() => setActiveTab("settings")}
        className={`flex items-center gap-3 cursor-pointer group transition-all px-3 py-1.5 rounded-full ${activeTab === "settings" ? "bg-primary/5" : "hover:bg-gray-50"}`}
      >
        <span className={`text-[12px] font-bold transition-colors ${activeTab === "settings" ? "text-primary" : "text-gray-700"}`}>
          {user?.fullName || user?.displayName || "Precision Player"}
        </span>
        <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shadow-sm transition-all border-2 ${activeTab === "settings" ? "border-primary scale-105" : "border-white group-hover:border-primary/10"}`}>
          <img 
            src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || "Felix"}`} 
            alt="User avatar" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
