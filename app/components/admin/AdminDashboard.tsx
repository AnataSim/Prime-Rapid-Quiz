"use client";

import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminDashboardView from "./AdminDashboardView";
import AdminUsersView from "./AdminUsersView";
import AdminRoomsView from "./AdminRoomsView";
import AdminSettingsView from "./AdminSettingsView";

export default function AdminDashboard({ onLogout, rooms, setRooms, logs, user }: { onLogout: () => void, rooms?: any[], setRooms?: any, logs?: any[], user?: any }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderMainContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboardView logs={logs} rooms={rooms} />;
      case "users":
        return <AdminUsersView />;
      case "rooms":
        return <AdminRoomsView rooms={rooms} setRooms={setRooms} />;
      case "settings":
        return <AdminSettingsView user={user} />;
      default:
        return <AdminDashboardView />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FF] overflow-x-hidden">
      <AdminHeader activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
      
      <div className="flex flex-1 pt-16">
        <AdminSidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={onLogout} 
        />
        
        <main className="flex-1 flex ml-64 overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {renderMainContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
