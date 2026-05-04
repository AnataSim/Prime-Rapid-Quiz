"use client";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user?: any;
}

export default function CreatorHeader({ activeTab, setActiveTab, user }: HeaderProps) {
  const navLinks = [
    { id: "dashboard", label: "Dashboard" },
    { id: "editor", label: "Question Editor" },
    { id: "grading", label: "Grading" },
  ];

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 fixed top-0 left-0 right-0 z-40 w-full shadow-sm">
      {/* Left: Brand Logo */}
      <div className="flex items-center">
        <h1 className="text-[17px] font-black text-[#2563EB] tracking-tight">
          Prime Rapid Quiz
        </h1>
      </div>

      {/* Center: Navigation Links */}
      <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-10">
        {navLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => setActiveTab(link.id)}
            className={`text-[13px] font-bold tracking-tight transition-all relative py-5 ${
              activeTab === link.id
                ? "text-[#2563EB]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {link.label}
            {activeTab === link.id && (
              <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#2563EB] rounded-t-full"></span>
            )}
          </button>
        ))}
      </nav>

      {/* Right: User Profile */}
      <button 
        onClick={() => setActiveTab("settings")}
        className={`flex items-center gap-3 hover:opacity-80 transition-opacity p-2 rounded-xl cursor-pointer ${activeTab === 'settings' ? 'bg-blue-50' : ''}`}
      >
        <span className="text-[12px] font-bold text-gray-700">{user?.fullName || user?.displayName || "Creator User"}</span>
        <div className="w-9 h-9 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center border-2 border-white shadow-sm">
          <img 
            src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || "Creator"}`} 
            alt="Creator avatar" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </button>
    </header>
  );
}
