"use client";

import { 
  ChevronDown, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  ShieldCheck,
  UserX,
  Zap,
  Edit,
  Trash2,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";

export default function AdminUsersView() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const [editingUser, setEditingUser] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Fetch Users via API (bypasses Firestore Security Rules)
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      console.error("Fetch users error:", err);
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Analytics
  const analytics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 24 * 1000);
    
    const newRegs = users.filter(u => {
      const createdAt = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      return createdAt > thirtyDaysAgo;
    }).length;

    const total = users.length;
    const usersWithRole = users.filter(u => u.role && u.role !== "").length;
    const roleAssignedPercent = total > 0 ? Math.round((usersWithRole / total) * 100) : 0;

    return {
      newRegistrations: newRegs,
      verifiedRolesPercent: roleAssignedPercent,
      totalAccounts: total
    };
  }, [users]);

  // Filtering
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchRole = filterRole === "All" || u.role?.toLowerCase() === filterRole.toLowerCase();
      const matchStatus = filterStatus === "All" || (u.status || "Active").toLowerCase() === filterStatus.toLowerCase();
      return matchRole && matchStatus;
    });
  }, [users, filterRole, filterStatus]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderPagination = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage, "...", totalPages);
      }
    }

    return pages.map((p, i) => (
      <button
        key={i}
        onClick={() => typeof p === "number" && setCurrentPage(p)}
        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
          currentPage === p 
          ? "bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/20" 
          : p === "..." ? "text-gray-400 cursor-default" : "hover:bg-white text-gray-500"
        }`}
      >
        {p}
      </button>
    ));
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const payload: any = {
        id: editingUser.id,
        fullName: editingUser.fullName,
        photoURL: editingUser.photoURL,
        role: editingUser.role,
        verified: editingUser.verified || false,
      };
      if (editingUser.password) payload.password = editingUser.password;

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchUsers();
      setShowEditModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    try {
      const res = await fetch(`/api/admin/users?id=${uid}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      await fetchUsers();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  return (
    <div className="p-10 space-y-8 animate-in fade-in duration-700">
      {/* Top Header & Filters */}
      <div className="flex items-start gap-8">
        <div className="space-y-2 relative">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Filter by Role</label>
          <div 
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center bg-white px-5 py-3 rounded-2xl gap-4 cursor-pointer hover:bg-gray-50 border border-gray-100 min-w-[200px] transition-all"
          >
            <span className="text-[13px] font-bold text-[#1E293B] flex-1">{filterRole}</span>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${showRoleDropdown ? "rotate-180" : ""}`} />
          </div>
          {showRoleDropdown && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              {["All", "Admin", "Creator", "Student"].map((r) => (
                <div 
                  key={r}
                  onClick={() => { setFilterRole(r); setShowRoleDropdown(false); setCurrentPage(1); }}
                  className="px-5 py-2.5 text-[13px] font-bold text-gray-600 hover:bg-blue-50 hover:text-primary cursor-pointer transition-colors"
                >
                  {r}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 relative">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Filter by Status</label>
          <div 
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="flex items-center bg-white px-5 py-3 rounded-2xl gap-4 cursor-pointer hover:bg-gray-50 border border-gray-100 min-w-[200px] transition-all"
          >
            <span className="text-[13px] font-bold text-[#1E293B] flex-1">{filterStatus} Status</span>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`} />
          </div>
          {showStatusDropdown && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              {["All", "Active", "Inactive"].map((s) => (
                <div 
                  key={s}
                  onClick={() => { setFilterStatus(s); setShowStatusDropdown(false); setCurrentPage(1); }}
                  className="px-5 py-2.5 text-[13px] font-bold text-gray-600 hover:bg-blue-50 hover:text-primary cursor-pointer transition-colors"
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Table Card */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-[#F1F5F9] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">User ID</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Profile</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Role</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto"></div>
                   <p className="text-gray-400 font-bold uppercase tracking-widest text-[11px] mt-4">Loading users...</p>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="py-20 text-center space-y-4">
                  <AlertCircle size={40} className="text-red-400 mx-auto" />
                  <p className="text-red-400 font-bold text-[13px]">{error}</p>
                  <button
                    onClick={fetchUsers}
                    className="px-6 py-2 bg-[#2563EB] text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all inline-flex items-center gap-2"
                  >
                    <RefreshCw size={14} /> Retry
                  </button>
                </td>
              </tr>
            ) : currentUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                   <p className="text-gray-400 font-bold uppercase tracking-widest">No Users Found</p>
                </td>
              </tr>
            ) : (
              currentUsers.map((user, idx) => (
                <tr key={user.id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-none">
                  <td className="px-10 py-6">
                    <span className="text-[15px] font-black text-[#2563EB] break-all">#{user.id.substring(0, 6).toUpperCase()}</span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                        <img 
                          src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                          alt={user.fullName} 
                          className="w-full h-full object-cover"
                          onError={(e: any) => { e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`; }}
                        />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-[15px] font-bold text-[#1E293B] break-all line-clamp-1">{user.fullName || "User"}</h3>
                        <p className="text-[11px] text-gray-400 font-medium break-all line-clamp-1">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex justify-center">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest ${
                        user.role?.toLowerCase() === 'student' ? 'bg-[#F5F3FF] text-[#7C3AED]' :
                        user.role?.toLowerCase() === 'creator' ? 'bg-[#FFF7ED] text-[#EA580C]' :
                        'bg-[#F0F9FF] text-[#0284C7]'
                      }`}>
                        {user.role?.toUpperCase() || "STUDENT"}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex justify-center items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${(user.status || 'Active') === 'Active' ? 'bg-[#10B981]' : 'bg-[#94A3B8]'}`} />
                      <span className={`text-[13px] font-bold ${(user.status || 'Active') === 'Active' ? 'text-[#10B981]' : 'text-[#64748B]'}`}>
                        {user.status || 'Active'}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex justify-center items-center gap-3">
                      <button 
                        onClick={() => { setEditingUser({...user}); setShowEditModal(true); }}
                        className="p-2 hover:bg-blue-50 text-gray-400 hover:text-primary rounded-lg transition-all"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(user.id)}
                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-10 py-6 bg-gray-50/30 flex items-center justify-between border-t border-gray-50">
          <span className="text-[12px] text-gray-400 font-bold uppercase tracking-tight">
            Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
          </span>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-2 text-gray-400 hover:text-[#2563EB] transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            {renderPagination()}
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-2 text-gray-400 hover:text-[#2563EB] transition-colors disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-[#1E293B] tracking-tight">Edit Profile</h2>
                  <p className="text-[13px] text-gray-500 font-medium">Update account information for #{editingUser.id.substring(0,6)}</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Full Name</label>
                  <input 
                    type="text" 
                    value={editingUser.fullName}
                    onChange={(e) => setEditingUser({...editingUser, fullName: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold outline-none focus:border-primary/30 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Photo URL</label>
                  <input 
                    type="text" 
                    value={editingUser.photoURL}
                    onChange={(e) => setEditingUser({...editingUser, photoURL: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold outline-none focus:border-primary/30 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Account Role</label>
                    <select 
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold outline-none focus:border-primary/30 transition-all"
                    >
                      <option value="student">Student</option>
                      <option value="creator">Creator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Reset Password</label>
                    <input 
                      type="text" 
                      placeholder="New password..."
                      onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold outline-none focus:border-primary/30 transition-all"
                    />
                  </div>
                </div>

                {/* Verified Status */}
                <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                  <input 
                    type="checkbox"
                    id="verified-toggle"
                    checked={editingUser.verified || false}
                    onChange={(e) => setEditingUser({...editingUser, verified: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <label htmlFor="verified-toggle" className="flex items-center gap-2 cursor-pointer">
                    <ShieldCheck size={18} className="text-blue-500" />
                    <span className="text-[13px] font-bold text-blue-900">Verified Professional Account</span>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-4 text-[13px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-primary text-white py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowDeleteConfirm(null)} />
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 p-10 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-[#1E293B]">Confirm Deletion?</h3>
              <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                This action is permanent. All user data and linked database records will be erased.
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-4 text-[13px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 rounded-2xl transition-all"
              >
                No, Back
              </button>
              <button 
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="flex-1 bg-red-500 text-white py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-600 transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* New Registrations */}
        <div className="bg-[#EBEFFF] rounded-[2.5rem] p-8 border border-white flex items-center gap-6">
          <div className="w-14 h-14 bg-[#2563EB] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#2563EB]/20">
            <UserPlus size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-[#2563EB] uppercase tracking-widest mb-1">New Registrations</p>
            <h4 className="text-3xl font-black text-[#1E293B]">+{analytics.newRegistrations}</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Last 30 Days</p>
          </div>
        </div>

        {/* Verified Roles */}
        <div className="bg-[#F3E8FF] rounded-[2.5rem] p-8 border border-white flex items-center gap-6">
          <div className="w-14 h-14 bg-[#7C3AED] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#7C3AED]/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-[#7C3AED] uppercase tracking-widest mb-1">Verified Roles</p>
            <h4 className="text-3xl font-black text-[#1E293B]">{analytics.verifiedRolesPercent}%</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Professional Ratio</p>
          </div>
        </div>

        {/* Dormant Accounts */}
        <div className="bg-[#EEF2FF] rounded-[2.5rem] p-8 border border-white flex items-center gap-6">
          <div className="w-14 h-14 bg-[#475569] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#475569]/20">
            <UserX size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-[#475569] uppercase tracking-widest mb-1">Dormant Accounts</p>
            <h4 className="text-3xl font-black text-[#1E293B]">{analytics.totalAccounts}</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">Total Created</p>
          </div>
        </div>
      </div>

      {/* Bottom Section (Spike & Security) */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 pb-10">
        <div className="bg-gradient-to-br from-[#1E3A8A] to-[#1E40AF] rounded-[2.5rem] p-10 flex items-center justify-between relative overflow-hidden shadow-xl">
          <div className="relative z-10 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">Performance Spike Detected</h2>
              <p className="text-blue-100 text-[14px] leading-relaxed max-w-md">
                The Engineering Quiz cohort is showing a 40% increase in standard deviation. Review room parameters.
              </p>
            </div>
            <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
              Investigate Node
            </button>
          </div>
          <Zap size={120} className="text-white/10 absolute right-[-20px] bottom-[-20px] rotate-12" />
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 space-y-8 flex flex-col justify-center border border-[#F1F5F9] shadow-[0_2px_20px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F1F5FF] text-[#2563EB] rounded-2xl flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-[17px] font-black text-[#1E293B]">Security Health</h3>
              <p className="text-[13px] text-gray-500 font-medium">System integrity at 99.8%</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
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
