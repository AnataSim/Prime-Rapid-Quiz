"use client";

import { 
  ArrowLeft, 
  Info, 
  Settings, 
  Users, 
  Clock, 
  ChevronRight,
  Lock,
  Globe,
  Copy
} from "lucide-react";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface CreateRoomProps {
  onContinue: (id: string) => void;
  onCancel: () => void;
  roomTitle?: string;
  setRoomTitle?: (title: string) => void;
}

export default function CreateRoomView({ onContinue, onCancel, roomTitle = "", setRoomTitle = () => {} }: CreateRoomProps) {
  const [privacy, setPrivacy] = useState<"public" | "private">("private");
  const [cooldown, setCooldown] = useState(5);
  const [description, setDescription] = useState("");
  const [participantLimit, setParticipantLimit] = useState("");
  const [totalTime, setTotalTime] = useState("45");
  const [accessCode, setAccessCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    if (!roomTitle.trim()) {
      alert("Please enter a Room Name");
      return;
    }

    setIsSaving(true);
    try {
      const roomData = {
        title: roomTitle,
        description,
        privacy,
        accessCode: privacy === "private" ? accessCode : null,
        participantLimit: participantLimit ? parseInt(participantLimit) : null,
        totalTime: parseInt(totalTime),
        cooldown,
        createdAt: serverTimestamp(),
        status: "DRAFT",
        participantsCount: 0,
        creatorId: auth.currentUser?.uid || null // Ensure this is never undefined
      };

      const docRef = await addDoc(collection(db, "rooms"), roomData);
      
      onContinue(docRef.id);
    } catch (error) {
      console.error("Error saving room:", error);
      alert("Failed to save room. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Navigation */}
      <button 
        onClick={onCancel}
        className="flex items-center gap-2 text-[13px] font-bold text-gray-400 hover:text-[#2563EB] transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-[32px] font-black text-[#1E293B] tracking-tight">Create New Room</h1>
        <p className="text-[15px] text-[#64748B] font-medium">Define the parameters for your next psychometric assessment.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
        <div className="space-y-10">
          {/* Room Details Card */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-[#F1F5F9] shadow-[0_2px_15px_rgba(0,0,0,0.02)] space-y-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#EEF2FF] text-[#2563EB] rounded-xl flex items-center justify-center">
                <Info size={20} />
              </div>
              <h2 className="text-[20px] font-black text-[#1E293B] tracking-tight">Room Details</h2>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] pl-1">Room Name</label>
                <input 
                  type="text" 
                  value={roomTitle}
                  onChange={(e) => setRoomTitle(e.target.value)}
                  placeholder="e.g., Q3 Leadership Evaluation" 
                  className="w-full px-6 py-4 bg-[#F5F8FF] border-transparent focus:border-[#2563EB]/20 focus:bg-white rounded-2xl text-[14px] outline-none transition-all font-bold text-[#334155] placeholder:text-gray-300 placeholder:font-medium"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] pl-1">Description / Instructions</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter instructions that candidates will see before starting..." 
                  className="w-full px-6 py-5 bg-[#F5F8FF] border-transparent focus:border-[#2563EB]/20 focus:bg-white rounded-3xl text-[14px] outline-none transition-all font-bold text-[#334155] placeholder:text-gray-300 placeholder:font-medium min-h-[160px] resize-none"
                />
                <p className="text-[11px] text-gray-400 font-medium italic pl-1">Supports basic markdown formatting.</p>
              </div>
            </div>
          </div>

          {/* Room Configuration Card */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-[#F1F5F9] shadow-[0_2px_15px_rgba(0,0,0,0.02)] space-y-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F5F3FF] text-[#7C3AED] rounded-xl flex items-center justify-center">
                <Settings size={20} />
              </div>
              <h2 className="text-[20px] font-black text-[#1E293B] tracking-tight">Room Configuration</h2>
            </div>

            <div className="grid grid-cols-2 gap-16">
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] pl-1">Room Privacy</label>
                  <div className="space-y-3">
                    <button 
                      onClick={() => setPrivacy("public")}
                      className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${
                        privacy === 'public' ? 'bg-[#F5F8FF] border-[#2563EB]/20 text-[#2563EB]' : 'bg-white border-gray-100 text-[#64748B]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${privacy === 'public' ? 'border-[#2563EB]' : 'border-gray-200'}`}>
                          {privacy === 'public' && <div className="w-2.5 h-2.5 bg-[#2563EB] rounded-full" />}
                        </div>
                        <div className="text-left">
                          <p className="text-[13px] font-black">Public Link</p>
                          <p className="text-[11px] opacity-70 font-medium">Anyone with the link can join.</p>
                        </div>
                      </div>
                      <Globe size={18} className="opacity-50" />
                    </button>

                    <button 
                      onClick={() => setPrivacy("private")}
                      className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${
                        privacy === 'private' ? 'bg-[#F5F8FF] border-[#2563EB]/20 text-[#2563EB]' : 'bg-white border-gray-100 text-[#64748B]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${privacy === 'private' ? 'border-[#2563EB]' : 'border-gray-200'}`}>
                          {privacy === 'private' && <div className="w-2.5 h-2.5 bg-[#2563EB] rounded-full" />}
                        </div>
                        <div className="text-left">
                          <p className="text-[13px] font-black">Private Access Code</p>
                          <p className="text-[11px] opacity-70 font-medium">Requires a generated code to enter.</p>
                        </div>
                      </div>
                      <Lock size={18} className="opacity-50" />
                    </button>
                  </div>
                </div>

                {privacy === 'private' && (
                  <div className="bg-[#F5F8FF] p-5 rounded-2xl flex items-center justify-between border border-[#2563EB]/10">
                    <span className="text-[14px] font-black text-[#2563EB] tracking-widest">{accessCode}</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(accessCode)}
                      className="text-[#2563EB]/50 hover:text-[#2563EB] transition-colors"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] pl-1">Participant Limit</label>
                  <div className="relative group">
                    <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#2563EB] transition-colors" size={18} />
                    <input 
                      type="number" 
                      value={participantLimit}
                      onChange={(e) => setParticipantLimit(e.target.value)}
                      placeholder="No limit" 
                      className="w-full pl-12 pr-6 py-4 bg-[#F5F8FF] border-transparent focus:border-[#2563EB]/20 focus:bg-white rounded-2xl text-[14px] outline-none transition-all font-bold text-[#334155] placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">Total Time Limit</label>
                    <span className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-tight">High-Stakes Mode</span>
                  </div>
                  <div className="relative group">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#2563EB] transition-colors" size={18} />
                    <div className="flex items-center bg-[#F5F8FF] rounded-2xl border-transparent focus-within:border-[#2563EB]/20 focus-within:bg-white border transition-all">
                      <input 
                        type="number" 
                        value={totalTime}
                        onChange={(e) => setTotalTime(e.target.value)}
                        className="flex-1 pl-12 py-4 bg-transparent text-[14px] outline-none font-bold text-[#334155]"
                      />
                      <span className="pr-6 text-[13px] font-bold text-[#475569]">Minutes</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] pl-1">Default Cooldown</label>
                  <div className="flex items-center gap-6">
                    <div className="flex-1 h-2 bg-[#EEF2FF] rounded-full relative">
                      <input 
                        type="range" 
                        min="0" 
                        max="60" 
                        step="1"
                        value={cooldown}
                        onChange={(e) => setCooldown(parseInt(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div 
                        className="absolute left-0 top-0 h-full bg-[#2563EB] rounded-full transition-all duration-150" 
                        style={{ width: `${(cooldown / 60) * 100}%` }}
                      />
                      <div 
                        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-4 border-[#2563EB] rounded-full shadow-sm transition-all duration-150" 
                        style={{ left: `${(cooldown / 60) * 100}%` }}
                      />
                    </div>
                    <div className="bg-[#F5F8FF] px-4 py-2 rounded-xl text-[13px] font-black text-[#2563EB] min-w-[50px] text-center">
                      {cooldown}s
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Card */}
        <div className="bg-white rounded-[2.5rem] p-10 border border-[#F1F5F9] shadow-[0_2px_15px_rgba(0,0,0,0.02)] space-y-10 sticky top-24">
          <div className="space-y-4">
            <h3 className="text-[18px] font-black text-[#1E293B] tracking-tight">Ready to build?</h3>
            <p className="text-[13px] text-[#64748B] font-medium leading-relaxed">
              Once the room framework is established, you will proceed to the Question Editor to author your psychometric items.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <button 
              onClick={handleContinue}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-3 py-5 bg-[#2563EB] text-white rounded-[1.5rem] text-[13px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/25 hover:bg-[#1D4ED8] transition-all group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving Room..." : "Continue to Editor"}
              {!isSaving && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
            <button 
              onClick={onCancel}
              className="w-full py-5 bg-white border border-gray-100 rounded-[1.5rem] text-[13px] font-black text-[#475569] uppercase tracking-widest hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>

          <div className="pt-8 flex items-center gap-3 text-gray-400">
            <div className="w-8 h-8 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center">
              <Info size={16} />
            </div>
            <p className="text-[11px] font-medium leading-relaxed">
              Drafts are auto-saved to your local workspace.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
