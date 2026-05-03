"use client";

import { useState } from "react";
import { 
  User, 
  Bell, 
  Lock, 
  Palette, 
  ShieldAlert, 
  Pencil, 
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from "firebase/auth";
import { validatePassword } from "@/lib/validators";

export default function CreatorSettingsView({ user }: { user?: any }) {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState(true);

  
  const [fullName, setFullName] = useState(user?.fullName || user?.displayName || "");
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
      setStatus({ type: 'success', message: 'Profile updated successfully!' });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setStatus({ type: 'error', message: error.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !currentPassword) {
      setStatus({ type: 'error', message: 'Please enter both current and new passwords.' });
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
        // Re-authenticate first
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
        
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setStatus({ type: 'success', message: 'Password changed successfully!' });
      }
    } catch (error: any) {
      console.error("Error changing password:", error);
      setStatus({ type: 'error', message: error.message || 'Failed to change password. Re-authentication might be required.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (!user?.uid) return;
    
    const confirmDelete = window.confirm(
      "WARNING: This will permanently delete your account and all associated data. This action cannot be undone. Are you sure?"
    );
    
    if (!confirmDelete) return;

    setIsSaving(true);
    setStatus(null);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No authenticated user found.");

      // 1. Delete all rooms created by this creator
      const roomsRef = collection(db, "rooms");
      const q = query(roomsRef, where("creatorId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // 2. Delete Firestore Document
      const userRef = doc(db, "users", user.uid);
      await deleteDoc(userRef);

      // 3. Delete Auth Account
      try {
        await deleteUser(currentUser);
      } catch (authError: any) {
        if (authError.code === 'auth/requires-recent-login') {
          throw new Error("Sensitive operations require a recent login. Please logout and login again before deleting your account.");
        }
        throw authError;
      }

      // Success - page will redirect via onAuthStateChanged in page.tsx
    } catch (error: any) {
      console.error("Error deactivating account:", error);
      setStatus({ type: 'error', message: error.message || 'Failed to deactivate account.' });
      setIsSaving(false);
    }
  };

  return (
    <div className="p-12 max-w-[1200px] mx-auto space-y-12 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="space-y-3">
        <h1 className="text-[28px] font-extrabold text-[#1E293B] tracking-tight">User Settings</h1>
        <p className="text-[15px] text-[#64748B] font-medium leading-relaxed">
          Manage your profile information, platform preferences, and security protocols.
        </p>
        
        {status && (
          <div className={`flex items-center gap-3 p-4 rounded-2xl border ${status.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'} animate-in fade-in slide-in-from-top-4 duration-300`}>
            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-bold">{status.message}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-x-16 gap-y-12">
        {/* LEFT COLUMN */}
        <div className="space-y-12">
          
          {/* Profile Settings */}
          <div className="space-y-5">
            <div className="space-y-1.5">
              <h2 className="text-[18px] font-bold text-[#1E293B] tracking-tight">Profile Settings</h2>
              <p className="text-[13px] text-[#64748B] font-medium leading-relaxed max-w-xs">
                Manage your public identity and account core details. This information is visible to other students.
              </p>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="space-y-5">
            <div className="space-y-1.5">
              <h2 className="text-[18px] font-bold text-[#1E293B] tracking-tight">Notification Preferences</h2>
              <p className="text-[13px] text-[#64748B] font-medium leading-relaxed max-w-xs">
                Control how you receive updates about performance and system status.
              </p>
            </div>
          </div>

          {/* Security */}
          <div className="space-y-5">
            <div className="space-y-1.5">
              <h2 className="text-[18px] font-bold text-[#1E293B] tracking-tight">Security</h2>
              <p className="text-[13px] text-[#64748B] font-medium leading-relaxed max-w-xs">
                Protect your account with high-entropy passwords and multi-factor authentication.
              </p>
            </div>
          </div>



          {/* Account Actions */}
          <div className="space-y-5">
            <div className="space-y-1.5">
              <h2 className="text-[18px] font-bold text-[#1E293B] tracking-tight">Account Actions</h2>
              <p className="text-[13px] text-[#64748B] font-medium leading-relaxed max-w-xs">
                Permanent actions regarding your account status and data.
              </p>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN - Cards */}
        <div className="space-y-8">
          
          {/* Profile Card */}
          <div className="bg-white rounded-[2rem] p-8 flex items-center gap-8 shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-[#F1F5F9]">
            <div className="relative">
              <div className="w-[88px] h-[88px] rounded-[1.5rem] overflow-hidden">
                <img 
                  src={imgError || !photoURL ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || "Felix"}` : photoURL} 
                  alt="User avatar" 
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                  onLoad={() => setImgError(false)}
                />
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#2563EB] text-white rounded-lg flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                <Pencil size={12} fill="currentColor" />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.15em] pl-0.5">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#F1F5FF] border-transparent focus:border-[#2563EB]/20 focus:bg-white rounded-2xl text-[14px] outline-none transition-all font-bold text-[#334155]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.15em] pl-0.5">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  disabled // Email updates in Firebase are complex, keeping it read-only for now or update it in state
                  className="w-full px-4 py-3.5 bg-[#F1F5FF] border-transparent rounded-2xl text-[14px] font-bold text-[#94A3B8] cursor-not-allowed"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.15em] pl-0.5">Profile Image URL</label>
                <input 
                  type="text" 
                  value={photoURL}
                  onChange={(e) => {
                    setPhotoURL(e.target.value);
                    setImgError(false);
                  }}
                  placeholder="https://example.com/your-image.png"
                  className="w-full px-4 py-3.5 bg-[#F1F5FF] border-transparent focus:border-[#2563EB]/20 focus:bg-white rounded-2xl text-[14px] outline-none transition-all font-bold text-[#334155]"
                />
              </div>
            </div>
          </div>

          {/* Notifications Card Row */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-[2rem] p-6 flex items-center justify-between shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-[#F1F5F9]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#F5F3FF] text-[#7C3AED] rounded-2xl flex items-center justify-center">
                  <Mail size={22} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#1E293B]">Email Alerts</h3>
                  <p className="text-[12px] text-[#94A3B8] font-medium leading-tight">Weekly performance summaries</p>
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
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#FFFBEB] text-[#D97706] rounded-2xl flex items-center justify-center">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#1E293B]">System Updates</h3>
                  <p className="text-[12px] text-[#94A3B8] font-medium leading-tight">New feature announcements</p>
                </div>
              </div>
              <button 
                onClick={() => setSystemUpdates(!systemUpdates)}
                className={`w-12 h-[26px] rounded-full transition-all relative ${systemUpdates ? 'bg-[#92400E]' : 'bg-[#E2E8F0]'}`}
              >
                <div className={`absolute top-[3px] w-5 h-5 bg-white rounded-full transition-all shadow-sm ${systemUpdates ? 'left-[23px]' : 'left-[3px]'}`}></div>
              </button>
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-white rounded-[2rem] p-8 space-y-6 shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-[#F1F5F9]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-[#2563EB] uppercase tracking-[0.2em] block pl-0.5">Change Password</span>
              <button 
                onClick={handlePasswordChange}
                disabled={isSaving}
                className="text-[10px] font-black text-[#2563EB] uppercase hover:underline disabled:opacity-50"
              >
                Apply Password Change
              </button>
            </div>
            <div className="grid grid-cols-3 gap-5">
              <input 
                type="password" 
                placeholder="Current Password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-4 bg-[#F1F5FF] border-transparent focus:border-[#2563EB]/20 focus:bg-white rounded-2xl text-[14px] outline-none transition-all font-medium placeholder:text-[#94A3B8]"
              />
              <input 
                type="password" 
                placeholder="New Password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-4 bg-[#F1F5FF] border-transparent focus:border-[#2563EB]/20 focus:bg-white rounded-2xl text-[14px] outline-none transition-all font-medium placeholder:text-[#94A3B8]"
              />
              <input 
                type="password" 
                placeholder="Confirm New" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-4 bg-[#F1F5FF] border-transparent focus:border-[#2563EB]/20 focus:bg-white rounded-2xl text-[14px] outline-none transition-all font-medium placeholder:text-[#94A3B8]"
              />
            </div>
          </div>



          {/* Deactivate Card */}
          <div className="bg-white rounded-[2rem] p-8 flex items-center justify-between shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-[#F1F5F9]">
            <div>
              <h3 className="text-[16px] font-bold text-[#1E293B]">Deactivate Account</h3>
              <p className="text-[13px] text-[#94A3B8] font-medium leading-relaxed">Temporarily disable your profile and access</p>
            </div>
            <button 
              onClick={handleDeactivateAccount}
              disabled={isSaving}
              className="px-8 py-2.5 border border-[#FCA5A5] text-[#EF4444] text-[11px] font-black rounded-full hover:bg-[#FEF2F2] transition-colors uppercase tracking-[0.15em] flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Deactivate
            </button>
          </div>

          {/* Controls Footer */}
          <div className="pt-4 flex items-center justify-between">
            <span className="text-[12px] text-[#94A3B8] font-medium italic">Settings synced with Firebase Auth</span>
            <div className="flex gap-4">
              <button 
                onClick={() => setStatus(null)}
                className="px-12 py-4 bg-white border border-[#F1F5F9] rounded-2xl text-[14px] font-black text-[#475569] hover:bg-[#F8FAFC] transition-all shadow-sm"
              >
                CANCEL
              </button>
              <button 
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="px-12 py-4 bg-[#2563EB] text-white rounded-2xl text-[14px] font-black hover:bg-[#1D4ED8] transition-all shadow-xl shadow-[#2563EB]/25 flex items-center gap-2 disabled:opacity-70"
              >
                {isSaving && <Loader2 size={16} className="animate-spin" />}
                SAVE CHANGES
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
