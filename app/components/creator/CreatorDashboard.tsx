"use client";

import { useState } from "react";
import CreatorSidebar from "@/app/components/creator/CreatorSidebar";
import CreatorHeader from "@/app/components/creator/CreatorHeader";
import CreatorWorkspaceView from "@/app/components/creator/CreatorWorkspaceView";
import CreateRoomView from "@/app/components/creator/CreateRoomView";
import QuestionEditorView from "@/app/components/creator/QuestionEditorView";
import GradingView from "@/app/components/creator/GradingView";
import CreatorSupportView from "@/app/components/creator/CreatorSupportView";
import CreatorSettingsView from "@/app/components/creator/CreatorSettingsView";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function CreatorDashboard({ onLogout, rooms, setRooms, user }: { onLogout: () => void, rooms: any[], setRooms: any, user?: any }) {
  // Navigation states
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentView, setCurrentView] = useState<"default" | "create-room" | "editor" | "grading-detail">("default");
  
  // Data states
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [viewOnly, setViewOnly] = useState(false);

  const [roomTitle, setRoomTitle] = useState("");
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [initialQuestions, setInitialQuestions] = useState<any[]>([]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentView("default");
    setSelectedRoom(null);
    setViewOnly(false);
  };

  const handleCreateRoom = () => {
    setActiveTab("editor");
    setCurrentView("create-room");
    setViewOnly(false);
    setRoomTitle(""); // reset on new creation
    setActiveRoomId(null);
    setInitialQuestions([]);
  };

  const handleOpenRoom = (room: any) => {
    setSelectedRoom(room);
    setActiveRoomId(room.id);
    setInitialQuestions(room.questions || []);
    setViewOnly(true);
    setActiveTab("editor");
    setCurrentView("editor");
  };

  const handleContinueToEditor = (id: string) => {
    setActiveRoomId(id);
    setCurrentView("editor");
  };

  const handleBackToDashboard = () => {
    setActiveTab("dashboard");
    setCurrentView("default");
    setSelectedRoom(null);
    setViewOnly(false);
  };

  const handleSubmitQuiz = async (quizData: any) => {
    try {
      if (activeRoomId) {
        const roomRef = doc(db, "rooms", activeRoomId);
        await updateDoc(roomRef, {
          questions: quizData.questions || [],
          questionsCount: quizData.totalQuestions || 0,
          status: "LIVE"
        });
      }
      
      // Keep local state update for immediate UI feedback if needed, 
      // but CreatorWorkspaceView will also sync via onSnapshot
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const finalTitle = roomTitle || quizData.title || "New Quiz Room";
      const newRoom = {
        id: activeRoomId || (rooms.length + 1),
        code: code,
        title: finalTitle,
        subtitle: `Created: ${new Date().toLocaleDateString()} • ${quizData.totalQuestions || 0} Questions`,
        creator: "Quiz Creator",
        participantsCount: 0,
        status: "LIVE",
        avatar: finalTitle ? finalTitle.substring(0, 2).toUpperCase() : "NQ",
        questions: quizData.questions || []
      };
      setRooms([newRoom, ...rooms.filter(r => r.id !== activeRoomId)]);
      handleBackToDashboard();
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to save quiz data to Firestore.");
    }
  };

  const renderMainContent = () => {
    // 1. Handling explicit sub-views first
    if (activeTab === "editor") {
      if (currentView === "create-room" || currentView === "default") {
        return <CreateRoomView onContinue={handleContinueToEditor} onCancel={handleBackToDashboard} roomTitle={roomTitle} setRoomTitle={setRoomTitle} />;
      }
      if (currentView === "editor") {
        return <QuestionEditorView onBack={handleBackToDashboard} onSubmit={handleSubmitQuiz} viewOnly={viewOnly} initialQuestions={initialQuestions} />;
      }
    }

    // 2. Tab-based views
    switch (activeTab) {
      case "dashboard":
        return <CreatorWorkspaceView onCreateRoom={handleCreateRoom} onOpenRoom={handleOpenRoom} rooms={rooms} user={user} />;
      case "grading":
        return <GradingView user={user} />;
      case "support":
        return <CreatorSupportView />;
      case "settings":
        return <CreatorSettingsView user={user} />;
      default:
        return <CreatorWorkspaceView onCreateRoom={handleCreateRoom} onOpenRoom={handleOpenRoom} rooms={rooms} user={user} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FF] overflow-hidden">
      <CreatorHeader activeTab={activeTab} setActiveTab={handleTabChange} user={user} />
      
      <div className="flex flex-1 pt-16 h-screen">
        <CreatorSidebar 
          activeTab={activeTab} 
          setActiveTab={handleTabChange} 
          onLogout={onLogout} 
        />
        
        <main className="flex-1 ml-64 overflow-hidden relative">
          <div className="absolute inset-0 overflow-y-auto no-scrollbar">
            {renderMainContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
