"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, getDoc, setDoc, deleteDoc, serverTimestamp, updateDoc, increment, getDocs, query } from "firebase/firestore";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ActiveQuiz from "./ActiveQuiz";
import JoinRoom from "./JoinRoom";
import LiveRoomSidebar from "./LiveRoomSidebar";
import RoomLobby from "./RoomLobby";
import PerformanceView from "./PerformanceView";
import LeaderboardsView from "./LeaderboardsView";
import HelpView from "./HelpView";
import SettingsView from "./SettingsView";

type QuizStatus = "JOINING" | "LOBBY" | "ACTIVE" | "FINISHED";

export default function Dashboard({ onLogout, rooms = [], setLogs, logs = [], user }: { onLogout: () => void, rooms?: any[], setLogs?: any, logs?: any[], user?: any }) {
  const [activeTab, setActiveTab] = useState("join");
  const [quizStatus, setQuizStatus] = useState<QuizStatus>("JOINING");
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [liveRooms, setLiveRooms] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "rooms"), (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLiveRooms(roomsData);
    });
    return () => unsubscribe();
  }, []);

  // Synchronize activeRoom with the latest data from liveRooms
  const activeRoomData = activeRoom 
    ? liveRooms.find(r => r.id === activeRoom.id) || activeRoom 
    : null;

  // Auto-transition to ACTIVE if room status changes to LIVE
  useEffect(() => {
    if (quizStatus === "LOBBY" && activeRoomData?.status === "LIVE") {
      setQuizStatus("ACTIVE");
    }
  }, [activeRoomData?.status, quizStatus]);

  const [joinError, setJoinError] = useState<string | null>(null);
  const [rejoinStatus, setRejoinStatus] = useState<"none" | "pending" | "approved">("none");
  const [targetRoomId, setTargetRoomId] = useState<string | null>(null);

  // Handle Join Action
  const handleJoin = async (code: string) => {
    setJoinError(null);
    
    const foundRoom = liveRooms.find(r => 
      (r.accessCode && r.accessCode.toLowerCase() === code.toLowerCase()) || 
      (r.title && r.title.toLowerCase() === code.toLowerCase())
    );
    
    if (!foundRoom) return false;

    // BLOCK JOINING ENDED ROOMS
    if (foundRoom.status === "ENDED") {
      setJoinError("Room ini sudah berakhir. Kamu tidak bisa join lagi.");
      setRejoinStatus("none"); 
      setTargetRoomId(null); // Clear target room to prevent rejoin requests
      return false;
    }
    
    if (user?.uid) {
      // 1. Check if user is already a participant
      const participantRef = doc(db, "rooms", foundRoom.id, "participants", user.uid);
      const participantSnap = await getDoc(participantRef);

      if (participantSnap.exists()) {
        const pData = participantSnap.data();
        
        // 2. If already exists, check if they have an approved rejoin request
        const rejoinRef = doc(db, "rooms", foundRoom.id, "rejoinRequests", user.uid);
        const rejoinSnap = await getDoc(rejoinRef);
        const rejoinData = rejoinSnap.exists() ? rejoinSnap.data() : null;

        if (rejoinData?.status === "approved") {
          // Allowed to rejoin!
          console.log("Rejoin approved, entering room...");
          setRejoinStatus("none");
          
          // Delete the request so it's a one-time use pass
          const rejoinRef = doc(db, "rooms", foundRoom.id, "rejoinRequests", user.uid);
          await deleteDoc(rejoinRef);
        } else {
          // Not approved yet, show re-join request flow
          setTargetRoomId(foundRoom.id);
          if (rejoinData?.status === "pending") {
            setJoinError("Permintaan join ulang sedang menunggu persetujuan Creator.");
            setRejoinStatus("pending");
          } else {
            setJoinError("Kamu sudah terdaftar di room ini. Ingin meminta izin pengerjaan ulang ke Creator?");
            setRejoinStatus("none");
          }
          return "REJOIN_REQUIRED";
        }
      }

      // If we reach here, it's either a first-time join or an approved rejoin
      setActiveRoom(foundRoom);
      
      // IF LIVE, GO STRAIGHT TO ACTIVE
      if (foundRoom.status === "LIVE") {
        setQuizStatus("ACTIVE");
      } else {
        setQuizStatus("LOBBY");
      }
      
      setActiveTab("quiz");

      // Register participant in real-time
      await setDoc(doc(db, "rooms", foundRoom.id, "participants", user.uid), {
        uid: user.uid,
        fullName: user.fullName || user.displayName || "Student",
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || "Student"}`,
        status: "READY",
        pts: 0,
        joinedAt: serverTimestamp()
      }, { merge: true }); // Use merge to avoid overwriting existing data if rejoining

      // Only increment if it's a first-time join
      if (!participantSnap.exists()) {
        await updateDoc(doc(db, "rooms", foundRoom.id), {
          participantsCount: increment(1)
        });
      }
      
      return true;
    }
    return false;
  };

  const handleRequestRejoin = async () => {
    if (targetRoomId && user?.uid) {
      setRejoinStatus("pending");
      await setDoc(doc(db, "rooms", targetRoomId, "rejoinRequests", user.uid), {
        studentName: user.fullName || user.displayName || "Student",
        status: "pending",
        requestedAt: serverTimestamp()
      });
      setJoinError("Permintaan telah dikirim. Tunggu persetujuan Creator.");
    }
  };

  // Handle Start Action
  const handleStart = () => {
    setQuizStatus("ACTIVE");
  };

  // Handle Leave/Back Action
  const handleLeave = async () => {
    if (activeRoom && user?.uid) {
      try {
        await deleteDoc(doc(db, "rooms", activeRoom.id, "participants", user.uid));
        // Decrement global participants count
        updateDoc(doc(db, "rooms", activeRoom.id), {
          participantsCount: increment(-1)
        });
      } catch (error) {
        console.error("Error removing participant:", error);
      }
    }
    setQuizStatus("JOINING");
    setActiveTab("join");
    setActiveRoom(null);
  };

  const [performanceData, setPerformanceData] = useState<any>(null);

  // Handle Quiz Completion
  const handleQuizFinish = async (accuracy: number = 0, answers: any = {}, totalTimeMs: number = 0) => {
    const currentRoom = activeRoomData;
    let finalXP = 0;
    
    // Sanitize answers: Firestore doesn't support 'undefined' values
    const sanitizedAnswers = { ...answers };
    Object.keys(sanitizedAnswers).forEach(key => {
      if (sanitizedAnswers[key] === undefined) {
        sanitizedAnswers[key] = null; // Use null instead of undefined
      }
    });

    if (currentRoom && user?.uid) {
      try {
        // 1. Fetch current participant data to get accumulated XP (pts)
        const participantRef = doc(db, "rooms", currentRoom.id, "participants", user.uid);
        const pSnap = await getDoc(participantRef);
        const pData = pSnap.exists() ? pSnap.data() : { pts: 0 };
        const totalXP = pData.pts || 0;
        finalXP = totalXP;

        // Calculate Overall Speed
        const totalQuestions = currentRoom.questions?.length || 1;
        const avgSpeedMs = totalTimeMs / totalQuestions;
        
        // Determine if manual grading is needed (only for Essay type)
        const hasEssay = currentRoom.questions?.some((q: any) => q.type === "ESS");
        const finalStatus = hasEssay ? "COMPLETED" : "graded";

        // 2. Update participant status in the room's participant collection
        await updateDoc(participantRef, {
          status: finalStatus,
          totalTimeMs: totalTimeMs,
          finalScore: totalXP, // Using XP as the main score
          accuracy: accuracy,
          avgSpeedMs: avgSpeedMs,
          answers: sanitizedAnswers, 
          finishedAt: serverTimestamp()
        });

        // Delete rejoin request so it must be requested again for future attempts
        const rejoinRef = doc(db, "rooms", currentRoom.id, "rejoinRequests", user.uid);
        await deleteDoc(rejoinRef);

        // 3. Fetch all participants to calculate current rank and percentile
        const participantsSnapshot = await getDocs(query(collection(db, "rooms", currentRoom.id, "participants")));
        const participantsData = participantsSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() as any }));
        
        // Sort participants by score (desc) and time (asc)
        participantsData.sort((a: any, b: any) => {
          if ((b.pts || 0) !== (a.pts || 0)) return (b.pts || 0) - (a.pts || 0);
          return (a.totalTimeMs || 0) - (b.totalTimeMs || 0);
        });

        const myRank = participantsData.findIndex(p => p.uid === user.uid) + 1;
        const totalCount = participantsData.length;
        const myPercentile = totalCount <= 1 ? 100 : Math.round(((totalCount - myRank + 1) / totalCount) * 100);

        // 4. Save to User's Private History collection
        await setDoc(doc(db, "users", user.uid, "quizHistory", currentRoom.id), {
          roomId: currentRoom.id,
          roomTitle: currentRoom.title,
          score: totalXP, // Main score is total XP earned
          accuracy: accuracy,
          totalTimeMs: totalTimeMs,
          avgSpeedMs: avgSpeedMs,
          rank: myRank,
          percentile: `${myPercentile}%`,
          answers: sanitizedAnswers,
          completedAt: serverTimestamp()
        });

      } catch (error) {
        console.error("Error finalizing quiz history:", error);
      }
    }

    setPerformanceData({
      score: accuracy, // Keeping internal accuracy for existing UI components if needed
      totalTimeMs,
      room: currentRoom,
      answers: sanitizedAnswers
    });
    setQuizStatus("FINISHED");
    setActiveTab("performance");

    if (setLogs) {
      setLogs((prev: any) => [
        {
          id: Math.random().toString(),
          roomId: currentRoom?.id,
          roomTitle: currentRoom?.title || "Unknown Room",
          studentName: user?.fullName || "Student",
          score: finalXP || accuracy,
          answers: sanitizedAnswers,
          date: new Date().toLocaleDateString()
        },
        ...prev
      ]);
    }
  };

  // Logic to determine main content
  const renderMainContent = () => {
    if (activeTab === "performance") {
      return <PerformanceView data={performanceData} user={user} room={activeRoomData} />;
    }

    if (activeTab === "join") {
      return (
        <JoinRoom 
          onJoin={handleJoin} 
          user={user} 
          joinError={joinError}
          rejoinStatus={rejoinStatus}
          onRequestRejoin={handleRequestRejoin}
          showRejoinButton={rejoinStatus === "none" && !!targetRoomId}
        />
      );
    }
    
    if (activeTab === "quiz") {
      if (quizStatus === "JOINING") {
        return (
          <JoinRoom 
            onJoin={handleJoin} 
            user={user} 
            joinError={joinError}
            rejoinStatus={rejoinStatus}
            onRequestRejoin={handleRequestRejoin}
            showRejoinButton={rejoinStatus === "none" && !!targetRoomId}
          />
        );
      }
      if (quizStatus === "LOBBY") {
        return <RoomLobby onStart={handleStart} onLeave={handleLeave} room={activeRoomData} />;
      }
      if (quizStatus === "ACTIVE") {
        return <ActiveQuiz onFinish={handleQuizFinish} room={activeRoomData} user={user} />;
      }
    }

    if (activeTab === "leaderboards") {
      return <LeaderboardsView user={user} />;
    }

    if (activeTab === "help") {
      return <HelpView />;
    }

    if (activeTab === "settings") {
      return <SettingsView user={user} />;
    }

    return null;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F6FB] overflow-x-hidden">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
      <div className="flex flex-1 pt-16">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} user={user} />
        
        <main className="flex-1 flex ml-64 overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {renderMainContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
