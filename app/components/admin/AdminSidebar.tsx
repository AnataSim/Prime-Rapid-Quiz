"use client";

import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  Settings, 
  LogOut 
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export default function AdminSidebar({ activeTab, setActiveTab, onLogout }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "users", label: "User Management", icon: <Users size={18} /> },
    { id: "rooms", label: "Room Management", icon: <Layers size={18} /> },
    { id: "settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  return (
    <aside className="w-64 bg-white/50 backdrop-blur-xl border-r border-gray-100 flex flex-col h-[calc(100vh-64px)] fixed left-0 top-16 z-20">
      {/* Brand Section */}
      <div className="p-8 pt-10">
        <div className="mb-10">
          <h2 className="text-[17px] font-black text-[#2563EB] tracking-tight">Precision Admin</h2>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Elite Psychometrics</p>
        </div>

        {/* Nav Links */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[13px] font-bold transition-all ${
                activeTab === item.id
                  ? "bg-white text-[#2563EB] shadow-[0_4px_20px_rgba(37,99,235,0.08)] border border-gray-50"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"
              }`}
            >
              <span className={activeTab === item.id ? "text-[#2563EB]" : "text-gray-400"}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="mt-auto p-8">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-[13px] font-bold text-gray-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
