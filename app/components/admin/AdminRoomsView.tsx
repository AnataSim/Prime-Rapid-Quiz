"use client";

import { 
  ChevronDown, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Users,
  ShieldCheck,
  Eye,
  XCircle,
  Pencil,
  Trash2,
  Calendar,
  Filter
} from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, query, orderBy, collectionGroup } from "firebase/firestore";

export default function AdminRoomsView({ rooms = [], setRooms }: { rooms?: any[], setRooms?: any }) {
  const [activeTab, setActiveTab] = useState("All Rooms");
  const [displayRooms, setDisplayRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalGlobalParticipants, setTotalGlobalParticipants] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const q = query(collection(db, "rooms"));
    const unsubscribeRooms = onSnapshot(q, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: (doc.data().status || "DRAFT").toUpperCase(),
        participantsCount: doc.data().participantsCount || 0,
        creator: doc.data().creator || "Creator"
      }));
      roomsData.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setDisplayRooms(roomsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching rooms: ", error);
      setIsLoading(false);
    });

    // Listen to ALL participants across ALL rooms globally
    const unsubscribeParticipants = onSnapshot(collectionGroup(db, "participants"), (snapshot) => {
      setTotalGlobalParticipants(snapshot.size);
    });

    return () => {
      unsubscribeRooms();
      unsubscribeParticipants();
    };
  }, []);

  const filteredRooms = activeTab === "All Rooms" 
    ? displayRooms 
    : displayRooms.filter(room => room.status === activeTab.toUpperCase());

  // Pagination Logic
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const currentRooms = filteredRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tabs = ["All Rooms", "Live", "Scheduled", "Ended", "Draft"];

  const handleDeleteRoom = async (id: string) => {
    if (confirm("Are you sure you want to delete this room?")) {
      try {
        await deleteDoc(doc(db, "rooms", id));
        if (setRooms) {
          setRooms((prev: any[]) => prev.filter(r => r.id !== id));
        }
      } catch (error) {
        console.error("Error deleting room: ", error);
        alert("Failed to delete room.");
      }
    }
  };

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-700">
      {/* Header & Tabs */}
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-[24px] font-black text-[#1E293B] tracking-tight">Room Management</h1>
          <p className="text-[13px] text-gray-500 font-medium">Oversee active testing sessions and logistics across the platform.</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex p-1 bg-[#EEF2FF] rounded-2xl w-fit">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2 ${
                  activeTab === tab
                    ? "bg-white text-[#2563EB] shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab === "Live" && <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />}
                {tab === "Scheduled" && <div className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />}
                {tab === "Ended" && <div className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />}
                {tab === "Draft" && <div className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />}
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white border border-gray-100 px-5 py-3 rounded-2xl gap-3 cursor-pointer hover:bg-gray-50 transition-all">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-[13px] font-bold text-[#1E293B]">Current Quarter</span>
              <ChevronDown size={14} className="text-gray-400" />
            </div>
            <button className="p-3.5 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-gray-600 transition-all">
              <Filter size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Rooms Table Card */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-[#F1F5F9] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <th className="px-10 py-6 text-center">Room ID</th>
              <th className="px-10 py-6">Room Name</th>
              <th className="px-10 py-6">Creator</th>
              <th className="px-10 py-6 text-center">Participants</th>
              <th className="px-10 py-6 text-center">Status</th>
              <th className="px-10 py-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRooms.map((room, idx) => (
              <tr key={idx} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-none">
                <td className="px-10 py-6 text-center">
                  <span className="text-[13px] font-black text-[#2563EB]">{room.accessCode || room.id.substring(0, 8).toUpperCase()}</span>
                </td>
                <td className="px-10 py-6">
                  <div>
                    <h3 className="text-[15px] font-bold text-[#1E293B]">{room.title || room.name || "Untitled Room"}</h3>
                    <p className="text-[11px] text-gray-400 font-medium truncate max-w-[200px]">{room.description || room.subtitle || "No description"}</p>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${room.creator || 'Creator'}`} alt={room.creator || 'Creator'} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[13px] font-bold text-[#475569]">{room.creator || 'Creator'}</span>
                  </div>
                </td>
                <td className="px-10 py-6 text-center">
                  <span className="px-4 py-1 bg-[#EEF2FF] text-[#2563EB] text-[12px] font-black rounded-lg">
                    {room.participantsCount}
                  </span>
                </td>
                <td className="px-10 py-6">
                  <div className="flex justify-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2 ${
                      room.status === 'LIVE' ? 'bg-[#ECFDF5] text-[#10B981]' :
                      room.status === 'SCHEDULED' ? 'bg-[#FFF7ED] text-[#EA580C]' :
                      'bg-[#F1F5F9] text-[#64748B]'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        room.status === 'LIVE' ? 'bg-[#10B981]' :
                        room.status === 'SCHEDULED' ? 'bg-[#EA580C]' :
                        'bg-[#64748B]'
                      }`} />
                      {room.status}
                    </span>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <div className="flex items-center justify-center gap-4 text-gray-400">
                    {room.status === 'LIVE' ? (
                      <>
                        <button className="hover:text-[#2563EB] transition-colors"><Eye size={18} /></button>
                        <button onClick={() => handleDeleteRoom(room.id)} className="hover:text-red-500 transition-colors"><XCircle size={18} /></button>
                      </>
                    ) : room.status === 'SCHEDULED' ? (
                      <>
                        <button className="hover:text-[#2563EB] transition-colors"><Pencil size={18} /></button>
                        <button onClick={() => handleDeleteRoom(room.id)} className="hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                      </>
                    ) : (
                      <>
                        <button className="hover:text-[#2563EB] transition-colors"><Monitor size={18} /></button>
                        <button onClick={() => handleDeleteRoom(room.id)} className="hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-10 py-20 text-center text-gray-400 font-bold uppercase tracking-widest">
                  Loading rooms...
                </td>
              </tr>
            ) : filteredRooms.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-10 py-20 text-center text-gray-400 font-bold uppercase tracking-widest">
                  No rooms found for this category
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        {/* Pagination UI */}
        <div className="px-10 py-6 bg-gray-50/30 flex items-center justify-between border-t border-gray-50">
          <span className="text-[12px] text-gray-400 font-bold uppercase tracking-tight">
            Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredRooms.length)} of {filteredRooms.length} total rooms
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-400 hover:text-[#2563EB] transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            
            {Array.from({ length: totalPages }).map((_, i) => (
              <button 
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  currentPage === i + 1 
                    ? "bg-[#2563EB] text-white" 
                    : "hover:bg-white text-gray-500"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 text-gray-400 hover:text-[#2563EB] transition-colors disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Stats Grid */}
      <div className="grid grid-cols-3 gap-8">
        <div className="bg-[#EBEFFF] rounded-[2.5rem] p-8 border border-white space-y-6">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <Monitor size={22} className="text-[#2563EB]" />
          </div>
          <div className="space-y-1">
            <h4 className="text-4xl font-black text-[#1E293B]">
              {displayRooms.filter(r => r.status === 'LIVE').length}
            </h4>
            <p className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest">Active Live Rooms</p>
          </div>
          <div className="w-full h-1 bg-white rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#2563EB] rounded-full transition-all duration-1000" 
              style={{ width: `${(displayRooms.filter(r => r.status === 'LIVE').length / (displayRooms.length || 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-[#F5F3FF] rounded-[2.5rem] p-8 border border-white space-y-6">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <Users size={22} className="text-[#7C3AED]" />
          </div>
          <div className="space-y-1">
            <h4 className="text-4xl font-black text-[#1E293B]">
              {totalGlobalParticipants.toLocaleString()}
            </h4>
            <p className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest">Total Participants</p>
          </div>
          <p className="text-[12px] font-bold text-[#10B981] flex items-center gap-1">
            <span className="rotate-[-45deg] font-black text-lg">↑</span> Monitoring global traffic
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border-2 border-dashed border-[#E2E8F0] space-y-6 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-[#ECFDF5] rounded-2xl flex items-center justify-center">
            <ShieldCheck size={22} className="text-[#10B981]" />
          </div>
          <div className="space-y-1">
            <h4 className="text-4xl font-black text-[#1E293B]">100<span className="text-2xl">%</span></h4>
            <p className="text-[10px] font-black text-[#10B981] uppercase tracking-widest">System Uptime</p>
          </div>
          <p className="text-[11px] text-gray-400 font-medium leading-relaxed">All clusters reporting healthy status</p>
        </div>
      </div>
    </div>
  );
}
