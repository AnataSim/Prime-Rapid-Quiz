"use client";

import { 
  Search, 
  ChevronDown, 
  Download, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Zap,
  ShieldCheck,
  Monitor,
  BarChart2,
  MoreVertical
} from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function AdminDashboardView({ logs, rooms: propRooms }: { logs?: any[], rooms?: any[] }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination States
  const [roomsPage, setRoomsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    // Listen to Rooms
    const qRooms = collection(db, "rooms");
    const unsubscribeRooms = onSnapshot(qRooms, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      roomsData.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setRooms(roomsData);
      setLoading(false);
    });

    // Fetch Users via Secure API (to ensure Admin and all roles are visible)
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/admin/users');
        if (response.ok) {
          const data = await response.json();
          const usersList = data.users || [];
          // Sort by createdAt (API returns simple dates or timestamps)
          usersList.sort((a: any, b: any) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
          });
          setUsers(usersList);
        }
      } catch (error) {
        console.error("Error loading users:", error);
      }
    };

    loadUsers();

    return () => {
      unsubscribeRooms();
    };
  }, []);

  // Pagination Logic - Rooms
  const totalRoomsPages = Math.ceil(rooms.length / itemsPerPage);
  const currentRooms = rooms.slice((roomsPage - 1) * itemsPerPage, roomsPage * itemsPerPage);

  // Pagination Logic - Users
  const totalUsersPages = Math.ceil(users.length / itemsPerPage);
  const currentUsers = users.slice((usersPage - 1) * itemsPerPage, usersPage * itemsPerPage);


  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-700">
      {/* Active Rooms Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-black text-[#1E293B] tracking-tight">Active Rooms</h2>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest bg-[#EEF2FF] px-4 py-1.5 rounded-full">
              Showing {currentRooms.length} of {rooms.length} Results
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setRoomsPage(p => Math.max(1, p - 1))}
                disabled={roomsPage === 1}
                className="p-1.5 bg-white border border-gray-100 rounded-lg text-gray-400 disabled:opacity-30 hover:text-[#2563EB] transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[11px] font-bold text-gray-400 px-2">{roomsPage} / {totalRoomsPages || 1}</span>
              <button 
                onClick={() => setRoomsPage(p => Math.min(totalRoomsPages, p + 1))}
                disabled={roomsPage === totalRoomsPages || totalRoomsPages === 0}
                className="p-1.5 bg-white border border-gray-100 rounded-lg text-gray-400 disabled:opacity-30 hover:text-[#2563EB] transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
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
            currentRooms.map((room) => (
              <div 
                key={room.id} 
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
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Participants</p>
                    <div className="bg-[#F8FAFC] border border-[#F1F5F9] px-4 py-1.5 rounded-xl flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                      <span className="text-[13px] font-black text-[#1E293B]">{room.participantsCount || 0}</span>
                    </div>
                  </div>

                  <span className={`px-5 py-1.5 rounded-full text-[10px] font-black tracking-widest ${
                    room.status === 'LIVE' ? 'bg-[#ECFDF5] text-[#10B981]' :
                    room.status === 'ENDED' ? 'bg-[#F1F5F9] text-[#94A3B8]' :
                    'bg-[#EEF2FF] text-[#2563EB]'
                  }`}>
                    {room.status || 'DRAFT'}
                  </span>

                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Active Users Table Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-black text-[#1E293B] tracking-tight">Active Users</h2>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Total {users.length} Registered Users
            </span>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-[#F1F5F9] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/20">
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Role</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">User ID</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user, idx) => (
                <tr key={user.id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50/50 last:border-none">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl overflow-hidden border border-gray-100 flex-shrink-0">
                        <img 
                          src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                          alt={user.fullName} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-[#1E293B]">{user.fullName || "Google User"}</h3>
                        <p className="text-[11px] text-gray-400 font-medium truncate max-w-[150px]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider ${
                      user.role === 'Admin' ? 'bg-blue-50 text-blue-600' :
                      user.role === 'Creator' ? 'bg-purple-50 text-purple-600' :
                      'bg-indigo-50 text-indigo-600'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex justify-center">
                      <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest ${
                        (user.status || 'Inactive') === 'Active' ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#F1F5F9] text-[#64748B]'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          (user.status || 'Inactive') === 'Active' ? 'bg-[#10B981]' : 'bg-[#64748B]'
                        }`} />
                        {user.status || 'INACTIVE'}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <span className="text-[12px] font-bold text-gray-400">#{user.id.substring(0, 6).toUpperCase()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Users Pagination */}
          <div className="px-10 py-6 bg-gray-50/30 flex items-center justify-between border-t border-gray-50">
            <span className="text-[12px] text-gray-400 font-bold uppercase tracking-tight">
              Page {usersPage} of {totalUsersPages || 1}
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                disabled={usersPage === 1}
                className="p-2 text-gray-400 hover:text-[#2563EB] disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              
              {Array.from({ length: totalUsersPages }).map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setUsersPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    usersPage === i + 1 
                      ? "bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/20" 
                      : "hover:bg-white text-gray-500"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button 
                onClick={() => setUsersPage(p => Math.min(totalUsersPages, p + 1))}
                disabled={usersPage === totalUsersPages || totalUsersPages === 0}
                className="p-2 text-gray-400 hover:text-[#2563EB] disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gradient-to-br from-[#1E3A8A] to-[#1E40AF] rounded-[2.5rem] p-10 flex items-center justify-between relative overflow-hidden shadow-xl">
          <div className="relative z-10 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">Performance Spike Detected</h2>
              <p className="text-blue-100 text-[14px] leading-relaxed max-w-md">
                The Engineering Quiz cohort is showing a 40% increase in standard deviation. Review room parameters.
              </p>
            </div>
            <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95">
              Investigate Node
            </button>
          </div>
          <Zap size={120} className="text-white/10 absolute right-[-20px] bottom-[-20px] rotate-12" />
        </div>

        <div className="bg-[#EBEFFF] rounded-[2.5rem] p-10 space-y-8 flex flex-col justify-center border border-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#2563EB] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#2563EB]/20">
              <ShieldCheck size={24} />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-[17px] font-black text-[#1E293B]">Security Health</h3>
              <p className="text-[13px] text-gray-500 font-medium">System integrity at 99.8%</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="w-full h-2 bg-white rounded-full overflow-hidden">
              <div className="w-[99.8%] h-full bg-[#2563EB] rounded-full" />
            </div>
            <div className="flex justify-end">
              <span className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest">Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
