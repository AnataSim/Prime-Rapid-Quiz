"use client";

import { 
  LayoutDashboard, 
  FileEdit, 
  Star,
  LifeBuoy,
  LogOut 
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export default function CreatorSidebar({ activeTab, setActiveTab, onLogout }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "editor", label: "Question Editor", icon: <FileEdit size={18} /> },
    { id: "grading", label: "Grading", icon: <Star size={18} /> },
  ];

  return (
    <aside className="w-64 bg-[#F8F9FF] border-r border-gray-100 flex flex-col h-[calc(100vh-64px)] fixed left-0 top-16 z-20">
      {/* Brand Section */}
      <div className="p-8 pt-10">
        <div className="mb-10">
          <h2 className="text-[14px] font-black text-[#2563EB] tracking-tight uppercase">Creator Portal</h2>
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mt-1">Management</p>
        </div>

        {/* Nav Links */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[13px] font-bold transition-all ${
                activeTab === item.id
                  ? "bg-white text-[#2563EB] shadow-[0_4px_20px_rgba(37,99,235,0.06)] border border-gray-50"
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
      <div className="mt-auto p-8 space-y-4">
        <button 
          onClick={() => setActiveTab("support")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold transition-all ${
            activeTab === "support"
              ? "bg-white text-[#2563EB] shadow-[0_4px_20px_rgba(37,99,235,0.06)] border border-gray-50"
              : "text-gray-400 hover:text-[#2563EB]"
          }`}
        >
          <LifeBuoy size={18} />
          Support
        </button>
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
