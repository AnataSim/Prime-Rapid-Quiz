"use client";

import { useState, useEffect } from "react";
import { 
  Zap, 
  BarChart3, 
  Network, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  HelpCircle,
  Box,
  Wand2,
  Shield,
  User,
  RefreshCw,
  Settings2,
  ArrowRight,
  ShieldCheck,
  MessagesSquare
} from "lucide-react";


import { auth, db, googleProvider } from "@/lib/firebase";
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  signOut,
  User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { validatePassword } from "@/lib/validators";

import Dashboard from "./components/student/Dashboard";
import AdminDashboard from "./components/admin/AdminDashboard";
import CreatorDashboard from "./components/creator/CreatorDashboard";

// Mockup role data
const roleContent = {
  Student: {
    hero: {
      title: "Rapid Response Engine",
      description: "Experience zero-latency quiz competition designed for high-performance learning environments and competitive classrooms.",
      icon: <Zap className="w-5 h-5 fill-primary" />
    },
    cards: [
      {
        title: "Psychometric Insights",
        description: "Deep data analysis for students and creators alike.",
        icon: <BarChart3 className="w-6 h-6 text-purple-600" />,
        bgColor: "bg-purple-50",
        borderColor: "border-purple-100"
      },
      {
        title: "Creator Hub",
        description: "Seamlessly manage exams, grading, and live stats.",
        icon: <Network className="w-6 h-6 text-amber-500" />,
        bgColor: "bg-white",
        borderColor: "border-gray-100"
      }
    ],
    welcomeSubtitle: "Ignite your competitive learning journey."
  },
  Creator: {
    hero: {
      title: "Advanced Exam Creator",
      description: "Build complex quiz architectures with branching logic",
      icon: <Zap className="w-5 h-5 fill-primary" />
    },
    cards: [
      {
        title: "Performance Analytics",
        description: "Track real-time completion rates and difficulty indices across your entire student cohort.",
        icon: <BarChart3 className="w-6 h-6 text-primary" />,
        bgColor: "bg-white",
        borderColor: "border-gray-100"
      },
      {
        title: "Automated Grading",
        description: "Set custom rubrics and let our AI-assisted engine handle the evaluation of open-ended responses.",
        icon: <Network className="w-6 h-6 text-amber-500" />,
        bgColor: "bg-white",
        borderColor: "border-gray-100"
      }
    ],
    welcomeSubtitle: "Build complex quiz architectures with branching logic."
  },
  Admin: {
    hero: {
      title: "System Infrastructure",
      description: "Monitor and scale global quiz infrastructure. Ensure 99.9% uptime for high-stakes institutional assessments and competitive circuits.",
      icon: <Settings2 className="w-5 h-5 text-gray-700" />
    },
    cards: [
      {
        title: "Global Analytics",
        description: "Cross-platform data monitoring and institutional performance reporting.",
        icon: <BarChart3 className="w-6 h-6 text-primary" />,
        bgColor: "bg-white",
        borderColor: "border-gray-100"
      },
      {
        title: "User Management",
        description: "Control access levels, manage subscriptions, and oversee all system roles.",
        icon: <User className="w-6 h-6 text-primary" />,
        bgColor: "bg-white",
        borderColor: "border-gray-100"
      }
    ],
    welcomeSubtitle: "Establish your organizational infrastructure."
  }
};

type Role = "Student" | "Creator" | "Admin";

export default function AuthPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [activeRole, setActiveRole] = useState<Role>("Student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    keepSignedIn: false,
    agreeTerms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRoleChange = (role: Role) => {
    setActiveRole(role);
    setFormData({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      keepSignedIn: false,
      agreeTerms: false,
    });
    setAuthError("");
  };

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Global Mock State to share across roles
  const [globalRooms, setGlobalRooms] = useState<any[]>([]);
  const [globalLogs, setGlobalLogs] = useState<any[]>([]);

  // Auth state listener
  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        // Listen to user document changes in real-time
        unsubscribeDoc = onSnapshot(doc(db, "users", user.uid), (userDoc) => {
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setActiveRole(data.role as Role);
            setIsLoggedIn(true);
          }
        }, (error) => {
          console.error("Error fetching user document:", error);
        });
      } else {
        if (unsubscribeDoc) {
          unsubscribeDoc();
          unsubscribeDoc = null;
        }
        setIsLoggedIn(false);
        setUserData(null);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsLoading(true);
    
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        // Update status to Active
        await updateDoc(doc(db, "users", userCredential.user.uid), { status: "Active" });
      } else {
        if (activeRole === "Admin") {
          throw new Error("Admin registration is currently restricted. Please contact the system administrator.");
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match");
        }

        // Validate password complexity
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
          throw new Error(passwordError);
        }

        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        // Save user role and initial status to Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: formData.email,
          fullName: formData.fullName,
          role: activeRole,
          status: "Active",
          createdAt: serverTimestamp()
        });
      }
      // Explicitly set logged in state after successful standard login/register
      setIsLoggedIn(true);
    } catch (error: any) {
      console.error("Auth error:", error);
      setAuthError(error.message || "Failed to authenticate. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError("");
    setIsGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Check if user exists in Firestore
      const userDocRef = doc(db, "users", result.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        if (activeRole === "Admin") {
          // Check if this is an approved admin email (optional, for now just block)
          // if (result.user.email !== "your-email@gmail.com") 
          throw new Error("Public Admin registration via Google is disabled.");
        }
        // First time Google login, create their document with the selected role
        await setDoc(userDocRef, {
          email: result.user.email,
          fullName: result.user.displayName || "Google User",
          photoURL: result.user.photoURL,
          role: activeRole,
          status: "Active",
          createdAt: serverTimestamp()
        });
      } else {
        // If they already existed, ensure they are marked as Active and update their photo
        await updateDoc(userDocRef, { 
          status: "Active",
          photoURL: result.user.photoURL
        });
        
        // Update activeRole to their stored role
        const data = userDoc.data();
        if (data && data.role) {
          setActiveRole(data.role as Role);
        }
      }
      
      // Explicitly set logged in state
      setIsLoggedIn(true);
    } catch (error: any) {
      console.error("Google Auth error:", error);
      setAuthError(error.message || "Google sign-in failed. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Force update status to Inactive before signing out
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, { 
          status: "Inactive",
          lastLogout: serverTimestamp()
        });
      }
      await signOut(auth);
      setIsLoggedIn(false);
      setUserData(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const currentContent = roleContent[activeRole];

  if (isLoggedIn && firebaseUser) {
    if (activeRole === "Admin") {
      return <AdminDashboard onLogout={handleLogout} rooms={globalRooms} setRooms={setGlobalRooms} logs={globalLogs} user={{...firebaseUser, ...userData}} />;
    }
    if (activeRole === "Creator") {
      return <CreatorDashboard onLogout={handleLogout} rooms={globalRooms} setRooms={setGlobalRooms} user={{...firebaseUser, ...userData}} />;
    }
    return <Dashboard onLogout={handleLogout} rooms={globalRooms} setLogs={setGlobalLogs} logs={globalLogs} user={{...firebaseUser, ...userData}} />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans selection:bg-primary/10">
      
      {/* LEFT COLUMN - Brand & Features */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col items-center justify-center relative overflow-hidden bg-[#F6F8FD]">
        {/* Subtle Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="w-full max-w-lg z-10 space-y-12">
          {/* Logo */}
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">
            Prime Rapid Quiz
          </h1>

          <div className="space-y-6">
            {/* Hero Card */}
            <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group">
              <div className="w-11 h-11 bg-blue-50 text-primary rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                {currentContent.hero.icon}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">{currentContent.hero.title}</h2>
              <p className="text-[15px] text-gray-500 leading-relaxed mb-8">
                {currentContent.hero.description}
              </p>
              
              {/* Feature Image Placeholder */}
              <div className="w-full h-44 rounded-2xl overflow-hidden relative shadow-inner">
                <img 
                  src="/rapid_response_bg.png" 
                  alt="Feature visualization" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>

            {/* Small Cards */}
            <div className="grid grid-cols-2 gap-6">
              {currentContent.cards.map((card, idx) => (
                <div 
                  key={idx} 
                  className={`${card.bgColor} p-7 rounded-[1.75rem] border ${card.borderColor} shadow-sm hover:shadow-md transition-all duration-300 group`}
                >
                  <div className="mb-4 transform group-hover:-translate-y-1 transition-transform duration-300">
                    {card.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm tracking-tight">{card.title}</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Form */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-[420px]">
            
            {/* Header Content */}
            <div className="mb-10">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
                {isLogin ? "Welcome Back" : (activeRole === "Admin" ? "Create Admin Account" : "Create Account")}
              </h2>
              <p className="text-gray-500 text-[15px] leading-relaxed">
                {isLogin ? currentContent.welcomeSubtitle : (activeRole === "Admin" ? "Establish your organizational infrastructure." : "Start designing your elite quiz rooms.")}
              </p>
            </div>

            {/* Role Switcher */}
            <div className="flex p-1 bg-gray-100/80 rounded-2xl mb-10 border border-gray-100">
              {(["Student", "Creator", "Admin"] as Role[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleChange(role)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-bold rounded-xl transition-all duration-200 ${
                    activeRole === role
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {role === "Student" && <Box size={16} className={activeRole === role ? "text-white" : ""} />}
                  {role === "Creator" && <Wand2 size={16} className={activeRole === role ? "text-white" : ""} />}
                  {role === "Admin" && <Shield size={16} className={activeRole === role ? "text-white" : ""} />}
                  {role}
                </button>
              ))}
            </div>

            {/* Conditional Rendering: Form */}
              <div className="space-y-8 animate-in fade-in duration-500">
                {authError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                    {authError}
                  </div>
                )}
                <form className="space-y-6" onSubmit={handleStandardLogin}>
                  {/* Full Name */}
                  {!isLogin && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                        Full Name
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                          <User size={18} />
                        </div>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="Enter your full name"
                          required
                          className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-transparent focus:border-primary/20 focus:bg-white rounded-2xl text-sm outline-none transition-all font-medium placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@organization.com"
                        required
                        className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-transparent focus:border-primary/20 focus:bg-white rounded-2xl text-sm outline-none transition-all font-medium placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center pl-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Password
                      </label>
                      {isLogin && (
                        <button type="button" className="text-xs font-bold text-primary hover:text-blue-700 transition-colors">
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                        <Lock size={18} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                        className="w-full pl-12 pr-12 py-4 bg-gray-50/50 border border-transparent focus:border-primary/20 focus:bg-white rounded-2xl text-sm outline-none transition-all font-medium placeholder:text-gray-400 tracking-widest"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password (Register) */}
                  {!isLogin && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                        Confirm Password
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                          <RefreshCw size={18} />
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="••••••••"
                          required
                          className="w-full pl-12 pr-12 py-4 bg-gray-50/50 border border-transparent focus:border-primary/20 focus:bg-white rounded-2xl text-sm outline-none transition-all font-medium placeholder:text-gray-400 tracking-widest"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Options */}
                  <div className="flex items-center pl-1">
                    <input
                      type="checkbox"
                      id="opt-in"
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                    />
                    <label htmlFor="opt-in" className="ml-3 text-[13px] text-gray-500 font-medium">
                      {isLogin ? "Keep me signed in" : (
                        <>
                          I agree to the <button type="button" className="text-primary font-bold hover:underline">Terms of Service</button> and <button type="button" className="text-primary font-bold hover:underline">Privacy Policy</button>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || isGoogleLoading}
                    className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-bold py-4 rounded-2xl shadow-xl shadow-primary/25 transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw size={18} className="animate-spin" />
                        CONNECTING...
                      </div>
                    ) : isLogin ? (
                      <>
                        LAUNCH {activeRole.toUpperCase()} DASHBOARD
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    ) : (
                      <>
                        REGISTER AS {activeRole.toUpperCase()}
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                {/* Separator */}
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-gray-100"></div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest whitespace-nowrap">
                    Or continue with
                  </span>
                  <div className="h-px flex-1 bg-gray-100"></div>
                </div>

                {/* Social Login */}
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading || isGoogleLoading}
                    className="flex-1 flex items-center justify-center gap-3 py-3.5 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all font-bold text-[13px] text-gray-700 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isGoogleLoading ? (
                      <RefreshCw size={20} className="animate-spin text-gray-400" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    )}
                    {isGoogleLoading ? "Connecting..." : "Google"}
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-3 py-3.5 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all font-bold text-[13px] text-gray-700">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                    </svg>
                    GitHub
                  </button>
                </div>

                <p className="text-center text-[13px] text-gray-500 font-medium pt-2">
                  {isLogin ? (
                    activeRole === "Admin" ? (
                      <span className="text-gray-400 italic">Admin registration is restricted</span>
                    ) : (
                      <>
                        Don't have an account?{" "}
                        <button 
                          onClick={() => setIsLogin(false)}
                          className="text-primary font-bold hover:underline transition-colors focus:outline-none"
                        >
                          Register Now
                        </button>
                      </>
                    )
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button 
                        onClick={() => setIsLogin(true)}
                        className="text-primary font-bold hover:underline transition-colors focus:outline-none"
                      >
                        Login Here
                      </button>
                    </>
                  )}
                </p>
              </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 flex items-center justify-end gap-6">
          <button className="text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors tracking-widest uppercase">Privacy</button>
          <button className="text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors tracking-widest uppercase">Terms</button>
          <button className="w-8 h-8 rounded-full bg-gray-50 text-primary flex items-center justify-center hover:bg-blue-50 transition-all border border-gray-100">
            <HelpCircle size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}