"use client";

import { useState } from "react";
import { 
  Pencil,
  Mail,
  Bell,
  Settings as SettingsIcon,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { validatePassword } from "@/lib/validators";

export default function AdminSettingsView({ user }: { user?: any }) {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState(true);
  const [newRoomNotif, setNewRoomNotif] = useState(false);


  const [fullName, setFullName] = useState(user?.fullName || user?.displayName || "Admin");
  const [email, setEmail] = useState(user?.email || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [imgError, setImgError] = useState(false);

  const handleSaveChanges = async () => {
    if (!user?.uid) return;
    setIsSaving(true);
    setStatus(null);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        fullName: fullName,
        email: email,
        photoURL: photoURL
      });
      setStatus({ type: 'success', message: 'Admin profile updated successfully!' });
    } catch (error: any) {
      console.error("Error updating admin profile:", error);
      setStatus({ type: 'error', message: error.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !currentPassword) {
      setStatus({ type: 'error', message: 'Please enter current and new passwords.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    // Validate password complexity
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setStatus({ type: 'error', message: passwordError });
      return;
    }

    setIsSaving(true);
    setStatus(null);
    try {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email) {
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
        
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setStatus({ type: 'success', message: 'Admin password changed successfully!' });
      }
    } catch (error: any) {
      console.error("Error changing admin password:", error);
      setStatus({ type: 'error', message: error.message || 'Failed to change password.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-12 max-w-[1200px] mx-auto space-y-16 animate-in fade-in duration-700">
      {/* Profile Settings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-16 items-start">
        <div className="space-y-3">
          <h2 className="text-[20px] font-black text-[#1E293B] tracking-tight">Profile Settings</h2>
          <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
            Manage your public identity and account core details. This information is visible to other administrators.
          </p>
          
          {status && (
            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${status.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'} animate-in fade-in slide-in-from-top-4 duration-300`}>
              {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span className="text-sm font-bold">{status.message}</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 flex flex-col gap-10 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-[#F1F5F9]">
          <div className="flex items-center gap-10">
            <div className="relative">
              <div className="w-[110px] h-[110px] rounded-[2rem] overflow-hidden border-4 border-[#F8F9FF] shadow-md">
                <img 
                  src={imgError || !photoURL ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || "Admin"}` : photoURL} 
                  alt="Admin avatar" 
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                  onLoad={() => setImgError(false)}
                />
              </div>
              <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#2563EB] text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                <Pencil size={14} fill="currentColor" />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.2em] pl-1">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-5 py-4 bg-[#F5F8FF] border-transparent focus:border-[#2563EB]/20 focus:bg-white rounded-[1.25rem] text-[14px] outline-none transition-all font-bold text-[#334155]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.2em] pl-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  disabled
                  className="w-full px-5 py-4 bg-[#F5F8FF] border-transparent rounded-[1.25rem] text-[14px] font-bold text-[#94A3B8] cursor-not-allowed"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.2em] pl-1">Profile Image URL</label>
                <input 
                  type="text" 
                  value={photoURL}
                  onChange={(e) => {
                    setPhotoURL(e.target.value);
                    setImgError(false);
                  }}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full px-5 py-4 bg-[#F5F8FF] border-transparent focus:border-[#2563EB]/20 focus:bg-white rounded-[1.25rem] text-[14px] outline-none transition-all font-bold text-[#334155]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-gray-50">
            <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.2em] pl-1">Administrative Role</label>
            <div className="flex items-center justify-between w-full px-5 py-4 bg-[#F5F8FF] rounded-[1.25rem] cursor-pointer hover:bg-[#F1F5FF] transition-all">
              <span className="text-[14px] font-bold text-[#334155]">Super Administrator</span>
              <ChevronDown size={18} className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-16 items-start">
        <div className="space-y-3">
          <h2 className="text-[20px] font-black text-[#1E293B] tracking-tight">Notification Preferences</h2>
          <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
            Control how you receive updates about student performance and system status.
          </p>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-[2rem] p-6 flex items-center justify-between shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-[#F1F5F9]">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-[#F5F3FF] text-[#7C3AED] rounded-2xl flex items-center justify-center">
                <Mail size={22} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#1E293B]">Email Alerts</h3>
                <p className="text-[12px] text-[#94A3B8] font-medium">Weekly performance summaries</p>
              </div>
            </div>
            <button 
              onClick={() => setEmailAlerts(!emailAlerts)}
              className={`w-12 h-[26px] rounded-full transition-all relative ${emailAlerts ? 'bg-[#7C3AED]' : 'bg-[#E2E8F0]'}`}
            >
              <div className={`absolute top-[3px] w-5 h-5 bg-white rounded-full transition-all shadow-sm ${emailAlerts ? 'left-[23px]' : 'left-[3px]'}`}></div>
            </button>
          </div>

          <div className="bg-white rounded-[2rem] p-6 flex items-center justify-between shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-[#F1F5F9]">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-[#FFFBEB] text-[#D97706] rounded-2xl flex items-center justify-center">
                <SettingsIcon size={22} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#1E293B]">System Updates</h3>
                <p className="text-[12px] text-[#94A3B8] font-medium">New feature announcements</p>
              </div>
            </div>
            <button 
              onClick={() => setSystemUpdates(!systemUpdates)}
              className={`w-12 h-[26px] rounded-full transition-all relative ${systemUpdates ? 'bg-[#92400E]' : 'bg-[#E2E8F0]'}`}
            >
              <div className={`absolute top-[3px] w-5 h-5 bg-white rounded-full transition-all shadow-sm ${systemUpdates ? 'left-[23px]' : 'left-[3px]'}`}></div>
            </button>
          </div>

          <div className="bg-white rounded-[2rem] p-6 flex items-center justify-between shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-[#F1F5F9]">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-[#F0F9FF] text-[#0284C7] rounded-2xl flex items-center justify-center">
                <Bell size={22} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#1E293B]">New Room Notifications</h3>
                <p className="text-[12px] text-[#94A3B8] font-medium">Real-time alerts when a new quiz room is created</p>
              </div>
            </div>
            <button 
              onClick={() => setNewRoomNotif(!newRoomNotif)}
              className={`w-12 h-[26px] rounded-full transition-all relative ${newRoomNotif ? 'bg-[#0284C7]' : 'bg-[#E2E8F0]'}`}
            >
              <div className={`absolute top-[3px] w-5 h-5 bg-white rounded-full transition-all shadow-sm ${newRoomNotif ? 'left-[23px]' : 'left-[3px]'}`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-16 items-start">
        <div className="space-y-3">
          <h2 className="text-[20px] font-black text-[#1E293B] tracking-tight">Security</h2>
          <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
            Protect your account with high-entropy passwords.
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 space-y-8 shadow-[0_2px_20px_rgba(0,0,0,0.02)] border border-[#F1F5F9]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-[#2563EB] uppercase tracking-[0.2em] block pl-1">Change Password</span>
            <button 
              onClick={handlePasswordChange}
              disabled={isSaving}
              className="text-[10px] font-black text-[#2563EB] uppercase hover:underline disabled:opacity-50"
            >
              Apply New Password
            </button>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <input 
              type="password" 
              placeholder="Current Password" 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-5 py-4 bg-[#F5F8FF] border-transparent focus:border-[#2563EB]/20 focus:bg-white rounded-[1.25rem] text-[14px] outline-none transition-all font-medium placeholder:text-[#94A3B8]"
            />
            <input 
              type="password" 
              placeholder="New Password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-5 py-4 bg-[#F5F8FF] border-transparent focus:border-[#2563EB]/20 focus:bg-white rounded-[1.25rem] text-[14px] outline-none transition-all font-medium placeholder:text-[#94A3B8]"
            />
            <input 
              type="password" 
              placeholder="Confirm New" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-5 py-4 bg-[#F5F8FF] border-transparent focus:border-[#2563EB]/20 focus:bg-white rounded-[1.25rem] text-[14px] outline-none transition-all font-medium placeholder:text-[#94A3B8]"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-6 pb-10">
        <button 
          onClick={() => setStatus(null)}
          className="px-12 py-4 bg-white border border-[#F1F5F9] rounded-2xl text-[14px] font-black text-[#475569] hover:bg-[#F8FAFC] transition-all shadow-sm"
        >
          Cancel
        </button>
        <button 
          onClick={handleSaveChanges}
          disabled={isSaving}
          className="px-12 py-4 bg-[#2563EB] text-white rounded-2xl text-[14px] font-black hover:bg-[#1D4ED8] transition-all shadow-xl shadow-[#2563EB]/25 flex items-center gap-2 disabled:opacity-70"
        >
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
