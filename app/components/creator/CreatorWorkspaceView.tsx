"use client";

import { 
  Filter, 
  MoreVertical, 
  BarChart2, 
  Clock, 
  Star,
  Plus,
  Monitor,
  Play,
  Square,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, where, getDocs } from "firebase/firestore";

interface WorkspaceProps {
  onCreateRoom: () => void;
  onOpenRoom: (room: any) => void;
  rooms: any[];
  user?: any;
}

export default function CreatorWorkspaceView({ onCreateRoom, onOpenRoom, rooms: propRooms, user }: WorkspaceProps) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCodes, setShowCodes] = useState<{[key: string]: boolean}>({});
  const [stats, setStats] = useState({
    totalCandidates: 0,
    avgCompletion: "0m 0s",
    globalAccuracy: "0.0%"
  });

  const toggleCodeVisibility = (e: React.MouseEvent, roomId: string, accessCode: string) => {
    e.stopPropagation();
    const isShowing = !showCodes[roomId];
    setShowCodes(prev => ({ ...prev, [roomId]: isShowing }));
    
    if (isShowing && accessCode) {
      navigator.clipboard.writeText(accessCode);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "rooms"), 
      where("creatorId", "==", user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort manually by createdAt (descending) to avoid needing a composite index
      roomsData.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      setRooms(roomsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);
  
  // Calculate Analytics
  useEffect(() => {
    if (rooms.length === 0) {
      setStats({
        totalCandidates: 0,
        avgCompletion: "0m 0s",
        globalAccuracy: "0.0%"
      });
      return;
    }

    const calculateStats = async () => {
      let totalTime = 0;
      let totalAccuracy = 0;
      let completionCount = 0;
      const uniqueStudents = new Set<string>();

      try {
        // Fetch participants for all rooms
        const participantPromises = rooms.map(room => 
          getDocs(query(collection(db, "rooms", room.id, "participants"), where("status", "==", "COMPLETED")))
        );

        const snapshots = await Promise.all(participantPromises);
        
        snapshots.forEach(snapshot => {
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            uniqueStudents.add(doc.id); // doc.id is the student's UID
            totalTime += data.totalTimeMs || 0;
            totalAccuracy += data.accuracy || 0;
            completionCount++;
          });
        });

        if (completionCount > 0) {
          const avgTimeMs = totalTime / completionCount;
          const minutes = Math.floor(avgTimeMs / 60000);
          const seconds = Math.floor((avgTimeMs % 60000) / 1000);
          
          setStats({
            totalCandidates: uniqueStudents.size,
            avgCompletion: `${minutes}m ${seconds}s`,
            globalAccuracy: `${(totalAccuracy / completionCount).toFixed(1)}%`
          });
        }
      } catch (error) {
        console.error("Error calculating workspace stats:", error);
      }
    };

    calculateStats();
  }, [rooms]);

  const totalCandidates = rooms.reduce((acc, room) => acc + (room.participantsCount || 0), 0);

  const handleToggleStatus = async (e: React.MouseEvent, room: any) => {
    e.stopPropagation(); // Prevent opening the room
    const roomRef = doc(db, "rooms", room.id);
    
    if (room.status === "LIVE") {
      await updateDoc(roomRef, { status: "ENDED" });
    } else {
      await updateDoc(roomRef, { status: "LIVE" });
    }
  };

  const handleDeleteRoom = async (e: React.MouseEvent, room: any) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${room.title}"? This action is permanent and cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, "rooms", room.id));
      } catch (error) {
        console.error("Error deleting room:", error);
        alert("Failed to delete room. Please try again.");
      }
    }
  };

  return (
    <div className="p-12 space-y-12 animate-in fade-in duration-700">
      {/* Workspace Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <h1 className="text-[32px] font-black text-[#1E293B] tracking-tight">Workspace</h1>
          <p className="text-[15px] text-[#64748B] font-medium leading-relaxed max-w-lg">
            Analyze performance, manage active quiz rooms, and iterate on your question sets from one central hub.
          </p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-[#EEF2FF] text-[#475569] rounded-xl text-[13px] font-bold hover:bg-white border border-transparent hover:border-gray-100 transition-all">
          <Filter size={16} />
          Filter
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-[#2563EB] rounded-[2.5rem] p-10 space-y-6 shadow-xl shadow-blue-500/20 text-white relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <p className="text-[14px] font-medium text-blue-100">Total Candidates Joined</p>
            <h4 className="text-[54px] font-black tracking-tighter">{stats.totalCandidates.toLocaleString()}</h4>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[12px] font-bold relative z-10">
            <span className="rotate-[-45deg]">→</span> {stats.totalCandidates > 0 ? "Live Data" : "No Activity Yet"}
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
            <Monitor size={200} />
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 space-y-8 flex flex-col justify-center border border-[#F1F5F9] shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F5F3FF] text-[#7C3AED] rounded-2xl flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div className="space-y-0.5">
              <p className="text-[13px] text-[#94A3B8] font-medium">Avg. Completion</p>
              <h4 className="text-[24px] font-black text-[#1E293B]">{stats.avgCompletion}</h4>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 space-y-8 flex flex-col justify-center border border-[#F1F5F9] shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FFFBEB] text-[#D97706] rounded-2xl flex items-center justify-center">
              <Star size={24} />
            </div>
            <div className="space-y-0.5">
              <p className="text-[13px] text-[#94A3B8] font-medium">Global Accuracy</p>
              <h4 className="text-[24px] font-black text-[#1E293B]">{stats.globalAccuracy}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Active Rooms Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-black text-[#1E293B] tracking-tight">Active Rooms</h2>
          <span className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest bg-[#EEF2FF] px-4 py-1.5 rounded-full">Showing {rooms.length} Results</span>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#F1F5F9]">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">Loading active rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#F1F5F9]">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">No active rooms found</p>
            </div>
          ) : (
            rooms.map((room) => (
              <div 
                key={room.id} 
                onClick={() => onOpenRoom(room)}
                className="bg-white rounded-3xl p-6 flex items-center justify-between border border-[#F1F5F9] hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-sm ${
                    room.status === 'LIVE' ? "bg-[#1E3A8A]" : room.status === 'ENDED' ? "bg-gray-800" : "bg-[#0891B2]"
                  }`}>
                    {room.status === 'LIVE' ? <Monitor size={24} /> : <span className="text-[15px]">{room.title?.substring(0,2).toUpperCase()}</span>}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[17px] font-black text-[#1E293B] group-hover:text-[#2563EB] transition-colors">{room.title}</h3>
                    <p className="text-[13px] text-[#94A3B8] font-medium">
                      Created: {room.createdAt?.toDate ? room.createdAt.toDate().toLocaleDateString() : 'N/A'} • {room.questionsCount || 0} Questions
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-12">
                  {/* Access Code Section */}
                  {room.accessCode && (
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Access Code</p>
                      <div className="flex items-center gap-3 bg-[#F8FAFC] px-4 py-2 rounded-xl border border-[#F1F5F9]">
                        <span className="text-[13px] font-black text-[#2563EB] tracking-widest font-mono">
                          {showCodes[room.id] ? room.accessCode : "••••••"}
                        </span>
                        <button 
                          onClick={(e) => toggleCodeVisibility(e, room.id, room.accessCode)}
                          className="text-[#94A3B8] hover:text-[#2563EB] transition-colors"
                        >
                          {showCodes[room.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col items-end gap-2">
                    <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Participants</p>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-[#2563EB] flex items-center justify-center text-[10px] font-black text-white">
                        {room.participantsCount || 0}
                      </div>
                    </div>
                  </div>

                  <span className={`px-5 py-1.5 rounded-full text-[10px] font-black tracking-widest ${
                    room.status === 'LIVE' ? 'bg-[#ECFDF5] text-[#10B981]' :
                    room.status === 'ENDED' ? 'bg-[#F1F5F9] text-[#94A3B8]' :
                    'bg-[#EEF2FF] text-[#2563EB]'
                  }`}>
                    {room.status || 'DRAFT'}
                  </span>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => handleToggleStatus(e, room)}
                      className={`p-2.5 rounded-xl transition-all ${
                        room.status === "LIVE" 
                        ? "text-red-500 hover:bg-red-50" 
                        : "text-[#10B981] hover:bg-[#ECFDF5]"
                      }`}
                      title={room.status === "LIVE" ? "Stop Quiz" : "Start Quiz"}
                    >
                      {room.status === "LIVE" ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                    </button>
                    <button 
                      onClick={(e) => handleDeleteRoom(e, room)}
                      className="p-2.5 text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Delete Room"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Re-join Requests Section */}
                <RejoinRequestsList roomId={room.id} />
              </div>
            ))
          )}
        </div>

        {/* Create New Session CTA */}
        <div className="pt-8">
          <div className="bg-[#F8F9FF] border-2 border-dashed border-[#E2E8F0] rounded-[3rem] p-16 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-[#2563EB]">
              <Plus size={32} strokeWidth={3} />
            </div>
            <div className="space-y-2">
              <h3 className="text-[20px] font-black text-[#1E293B]">Ready for a new session?</h3>
              <p className="text-[14px] text-[#94A3B8] font-medium max-w-xs">
                Create a room to start hosting competitive live quiz sessions.
              </p>
            </div>
            <button 
              onClick={onCreateRoom}
              className="bg-[#2563EB] text-white px-10 py-4 rounded-[1.25rem] text-[13px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/25 hover:bg-[#1D4ED8] transition-all active:scale-95"
            >
              Create New Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RejoinRequestsList({ roomId }: { roomId: string }) {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "rooms", roomId, "rejoinRequests"),
      where("status", "==", "pending")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [roomId]);

  const handleApprove = async (e: React.MouseEvent, requestId: string) => {
    e.stopPropagation();
    await updateDoc(doc(db, "rooms", roomId, "rejoinRequests", requestId), {
      status: "approved"
    });
  };

  if (requests.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-50 space-y-3 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Re-join Requests ({requests.length})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {requests.map((req) => (
          <div key={req.id} className="flex items-center gap-3 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl">
            <span className="text-[12px] font-bold text-amber-900">{req.studentName}</span>
            <button 
              onClick={(e) => handleApprove(e, req.id)}
              className="bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest transition-all shadow-sm shadow-amber-500/20"
            >
              Approve
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
