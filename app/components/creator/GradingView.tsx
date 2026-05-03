import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDocs,
  getDoc
} from "firebase/firestore";
import { 
  CheckCircle2, 
  ChevronRight, 
  Users, 
  Clock, 
  BarChart3, 
  Search,
  LayoutGrid,
  CheckSquare,
  FileText,
  Calculator,
  ArrowLeft,
  User,
  MoreVertical,
  Circle,
  Eye,
  Type,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image as ImageIcon,
  Sigma,
  Brain
} from "lucide-react";

interface GradingRoom {
  id: string;
  title: string;
  description: string;
  icon: any;
  iconBg: string;
  status: "NEEDS REVIEW" | "COMPLETED";
  participantsCount: number;
  pendingReview: number;
  color: string;
  questions: any[];
}

interface StudentResponse {
  id: string;
  uid: string;
  name: string;
  studentId: string;
  status: "pending" | "graded" | "COMPLETED";
  avatar?: string;
  answers: any;
  accuracy?: number;
  finalScore?: number;
  pts?: number;
}

export default function GradingView({ user }: { user?: any }) {
  const [rooms, setRooms] = useState<GradingRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<GradingRoom | null>(null);
  const [activeTab, setActiveTab] = useState<"mcq" | "checkbox" | "essay" | "kraepelin">("mcq");
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const handleGradeEssay = async (studentId: string, isCorrect: boolean, questionIdx: number) => {
    if (!selectedRoom?.id) return;

    try {
      const studentRef = doc(db, "rooms", selectedRoom.id, "participants", studentId);
      // Save per-question essay grade using dot-notation field path
      await updateDoc(studentRef, {
        status: "graded",
        [`essayGrades.${questionIdx}`]: isCorrect,
      });
      alert(`Essay graded as ${isCorrect ? "Correct ✅" : "Incorrect ❌"}.`);
    } catch (error) {
      console.error("Error grading essay:", error);
      alert("Failed to submit grade.");
    }
  };

  // 1. Fetch Rooms for this Creator
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, "rooms"), where("creatorId", "==", user.uid));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const roomsData = await Promise.all(snapshot.docs.map(async (roomDoc) => {
        const data = roomDoc.data();
        
        // Fetch participants to count pending
        const participantsSnapshot = await getDocs(collection(db, "rooms", roomDoc.id, "participants"));
        const participants = participantsSnapshot.docs.map(d => d.data());
        
        // A room needs review only if it has essay questions AND participants are in "COMPLETED" status
        const hasEssay = (data.questions || []).some((q: any) => q.type === "ESS");
        const pendingCount = hasEssay 
          ? participants.filter(p => p.status === "COMPLETED").length 
          : 0;

        return {
          id: roomDoc.id,
          title: data.title || "Untitled Quiz",
          description: data.description || "Room created for assessment.",
          icon: Brain,
          iconBg: "bg-[#F5F3FF]",
          color: "#7C3AED",
          status: pendingCount > 0 ? "NEEDS REVIEW" : "COMPLETED",
          participantsCount: participants.length,
          pendingReview: pendingCount,
          questions: data.questions || [],
        } as GradingRoom;
      }));

      setRooms(roomsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // 2. Fetch Participants when a room is selected
  useEffect(() => {
    if (!selectedRoom?.id) return;

    const q = query(collection(db, "rooms", selectedRoom.id, "participants"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data.uid,
          name: data.fullName || "Unknown Student",
          studentId: data.uid?.substring(0, 4) || "0000",
          status: data.status,
          avatar: data.photoURL,
          answers: data.answers || {},
          accuracy: data.accuracy,
          finalScore: data.finalScore,
          pts: data.pts
        } as StudentResponse;
      });

      setStudents(studentsData);
      if (studentsData.length > 0 && !selectedStudent) {
        setSelectedStudent(studentsData[0]);
      }
    });

    return () => unsubscribe();
  }, [selectedRoom?.id]);

  if (!selectedRoom) {
    return (
      <div className="p-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-3">
          <h1 className="text-[32px] font-black text-[#1E293B] tracking-tight">Grading Selection</h1>
          <p className="text-[15px] text-[#64748B] font-medium leading-relaxed">
            Choose a completed quiz room to begin evaluation.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room) => (
              <div 
                key={room.id}
                className="bg-white rounded-[2.5rem] p-10 border border-[#F1F5F9] shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex flex-col space-y-8 group hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-14 h-14 ${room.iconBg} rounded-2xl flex items-center justify-center`} style={{ color: room.color }}>
                    <room.icon size={28} />
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${
                    room.status === "NEEDS REVIEW" ? "bg-[#FFF1F2] text-[#E11D48]" : "bg-[#EEF2FF] text-[#2563EB]"
                  }`}>
                    {room.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[22px] font-black text-[#1E293B] tracking-tight break-all">{room.title}</h3>
                  <p className="text-[14px] text-[#94A3B8] font-medium leading-relaxed min-h-[48px] break-all">
                    {room.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#F1F5F9]">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Participants</p>
                    <p className="text-[18px] font-black text-[#1E293B]">{room.participantsCount}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Pending Review</p>
                    <p className={`text-[18px] font-black ${room.pendingReview > 0 ? "text-[#E11D48]" : "text-[#1E293B]"}`}>
                      {room.pendingReview}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedRoom(room)}
                  className="w-full bg-[#2563EB] text-white py-4 rounded-[1.25rem] text-[13px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/25 hover:bg-[#1D4ED8] transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Review Results <Eye size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const renderContent = () => {
    if (!selectedRoom || !selectedStudent) return null;

    // Normalize all questions: DB stores `stem`, not `question`.
    // correctAnswerIdx computed from options[i].correct since QuestionEditor never stores it explicitly.
    const allNormalized = selectedRoom.questions.map((q: any, origIdx: number) => ({
      ...q,
      _originalIdx: origIdx,                              // preserve index for student answer lookup
      question: q.stem || q.question || "(No question text)",
      correctAnswerIdx: (q.correctAnswerIdx !== undefined && q.correctAnswerIdx >= 0)
        ? q.correctAnswerIdx
        : (q.options?.findIndex((o: any) => o.correct === true) ?? -1),
    }));

    const filteredQuestions = allNormalized.filter(q => {
      if (activeTab === "mcq") return q.type === "MCQ";
      if (activeTab === "checkbox") return q.type === "CHK";
      if (activeTab === "essay") return q.type === "ESS";
      if (activeTab === "kraepelin") return q.type === "KRA";
      return false;
    });

    if (filteredQuestions.length === 0) {
      return (
        <div className="bg-white rounded-[2rem] p-20 border border-[#F1F5F9] text-center space-y-4">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto text-gray-300">
             <Search size={40} />
          </div>
          <div className="space-y-1">
            <h3 className="text-[18px] font-black text-[#1E293B]">No Questions Found</h3>
            <p className="text-[14px] text-[#94A3B8] font-medium">This room doesn't contain any questions of this type.</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      /* ─────────────── MCQ ─────────────── */
      case "mcq":
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-[2rem] p-8 border border-[#F1F5F9] flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Total MCQ</p>
                  <p className="text-[28px] font-black text-[#1E293B]">{filteredQuestions.length}</p>
                </div>
                <div className="w-12 h-12 bg-[#F5F3FF] text-[#7C3AED] rounded-2xl flex items-center justify-center">
                  <List size={24} />
                </div>
              </div>
              <div className="bg-white rounded-[2rem] p-8 border border-[#F1F5F9] flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Student Performance</p>
                  <div className="flex items-baseline gap-3">
                    <p className="text-[28px] font-black text-[#7C3AED]">{Math.round(selectedStudent.accuracy || 0)}%</p>
                    <span className="text-[12px] font-bold text-[#64748B]">Overall Accuracy</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {filteredQuestions.map((q, qIdx) => {
                const studentAnswerIdx = selectedStudent.answers[q._originalIdx];
                const correctIdx = q.correctAnswerIdx;
                const isCorrect = studentAnswerIdx !== undefined && studentAnswerIdx === correctIdx;
                const selectedOption = q.options?.[studentAnswerIdx];
                const correctOption = q.options?.[correctIdx];

                return (
                  <div key={q._originalIdx} className="bg-white rounded-[2rem] p-8 border border-[#F1F5F9] space-y-6">
                    {/* Question header */}
                    <div className="flex items-start gap-4">
                      <div className={`w-7 h-7 flex-shrink-0 mt-0.5 rounded-full flex items-center justify-center ${isCorrect ? "bg-[#10B981]" : studentAnswerIdx !== undefined ? "bg-[#EF4444]" : "bg-gray-200"}`}>
                        {isCorrect
                          ? <CheckCircle2 size={14} className="text-white" />
                          : <Circle size={10} className="text-white fill-white" />}
                      </div>
                      <div className="space-y-1 flex-1 overflow-hidden">
                        <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Question {qIdx + 1}</p>
                        <p className="text-[15px] text-[#1E293B] font-medium leading-relaxed break-all">{q.question}</p>
                      </div>
                    </div>

                    {/* Options grid */}
                    <div className={`grid ${q.options?.some((o: any) => o.text?.length > 35) ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"} gap-3`}>
                      {q.options?.map((opt: any, optIdx: number) => {
                        const isSelected = studentAnswerIdx === optIdx;
                        const isKey = correctIdx === optIdx;
                        const border = isKey
                          ? "border-[#10B981] bg-[#F0FDF4]"
                          : isSelected
                          ? "border-[#EF4444] bg-[#FEF2F2]"
                          : "border-transparent bg-[#F8FAFC]";
                        return (
                          <div key={optIdx} className={`p-4 rounded-2xl border-2 flex items-center justify-between ${border}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                                isKey ? "bg-[#10B981] text-white" : isSelected ? "bg-[#EF4444] text-white" : "bg-[#E2E8F0] text-[#64748B]"
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </div>
                              <span className={`text-[14px] font-bold break-all ${isKey || isSelected ? "text-[#1E293B]" : "text-[#64748B]"}`}>{opt.text}</span>
                            </div>
                            {isKey && <span className="text-[9px] font-black text-[#10B981] uppercase tracking-widest">Correct</span>}
                            {isSelected && !isKey && <span className="text-[9px] font-black text-[#EF4444] uppercase tracking-widest">Selected</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#F1F5F9]">
                      <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-[#F1F5F9] space-y-1">
                        <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Candidate Selected</p>
                        <p className={`text-[14px] font-bold break-all ${isCorrect ? "text-[#10B981]" : studentAnswerIdx !== undefined ? "text-[#EF4444]" : "text-[#94A3B8]"}`}>
                          {selectedOption?.text || (studentAnswerIdx !== undefined ? `Option ${studentAnswerIdx + 1}` : "No Answer")}
                        </p>
                      </div>
                      <div className="bg-[#F0FDF4] rounded-2xl p-4 border border-[#D1FAE5] space-y-1">
                        <p className="text-[10px] font-black text-[#10B981] uppercase tracking-widest">Correct Answer</p>
                        <p className="text-[14px] font-bold text-[#10B981] break-all">
                          {correctOption?.text || (correctIdx >= 0 ? `Option ${correctIdx + 1}` : "—")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      /* ─────────────── CHECKBOX ─────────────── */
      case "checkbox":
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white rounded-[2rem] p-8 border border-[#F1F5F9] flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Checkbox Responses</p>
                <p className="text-[22px] font-black text-[#1E293B]">{filteredQuestions.length} Question{filteredQuestions.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="bg-[#2563EB] rounded-2xl px-5 py-3 text-white text-center">
                <p className="text-[10px] font-black opacity-70 uppercase tracking-widest">Status</p>
                <p className="text-[14px] font-black uppercase">{selectedStudent.status || "N/A"}</p>
              </div>
            </div>

            <div className="space-y-6">
              {filteredQuestions.map((q, qIdx) => {
                const studentSelection: number[] = selectedStudent.answers[q._originalIdx] || [];
                const correctIndices: number[] = q.options?.reduce((acc: number[], opt: any, idx: number) =>
                  opt.correct ? [...acc, idx] : acc, []) || [];
                const isCorrect = correctIndices.length === studentSelection.length &&
                  correctIndices.every((i: number) => studentSelection.includes(i));

                return (
                  <div key={q._originalIdx} className="bg-white rounded-[2rem] p-10 border border-[#F1F5F9] space-y-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1 overflow-hidden">
                        <p className="text-[13px] font-bold text-[#2563EB]">Question {qIdx + 1}</p>
                        <h3 className="text-[18px] font-bold text-[#1E293B] break-all">{q.question}</h3>
                      </div>
                      <div className={`flex-shrink-0 flex items-center gap-2 ${isCorrect ? "text-[#10B981] bg-[#ECFDF5]" : "text-[#EF4444] bg-[#FEF2F2]"} px-4 py-1.5 rounded-full text-[11px] font-black`}>
                        {isCorrect ? <CheckCircle2 size={14} /> : <Circle size={10} className="fill-current" />}
                        {isCorrect ? "CORRECT" : "INCORRECT"}
                      </div>
                    </div>

                    <div className={`grid ${q.options?.some((o: any) => o.text?.length > 35) ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"} gap-4`}>
                      {q.options?.map((opt: any, optIdx: number) => {
                        const isSelected = studentSelection.includes(optIdx);
                        const isCorrectOpt = opt.correct;
                        return (
                          <div key={optIdx} className={`p-5 rounded-[1.25rem] border-2 flex items-center justify-between transition-all ${
                            isSelected ? "bg-white border-[#2563EB] shadow-sm" : "bg-[#F8FAFC] border-transparent"
                          }`}>
                            <div className="flex items-center gap-4">
                              <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${
                                isSelected ? "bg-[#2563EB] border-[#2563EB]" : "border-[#CBD5E1]"
                              }`}>
                                {isSelected && <CheckSquare size={14} className="text-white" />}
                              </div>
                              <span className={`text-[14px] font-bold break-all ${isSelected ? "text-[#1E293B]" : "text-[#64748B]"}`}>
                                {opt.text}
                              </span>
                            </div>
                            {isCorrectOpt && (
                              <span className="text-[9px] font-black text-[#10B981] uppercase tracking-widest">Key Answer</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      /* ─────────────── ESSAY ─────────────── */
      case "essay":
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            {filteredQuestions.map((q, qIdx) => {
              const response = selectedStudent.answers[q._originalIdx] || "";
              return (
                <div key={q._originalIdx} className="bg-white rounded-[2rem] p-12 border border-[#F1F5F9] space-y-8">
                  {/* Question */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-[#7C3AED]">
                      <FileText size={18} />
                      <span className="text-[11px] font-black tracking-widest uppercase">Question {qIdx + 1} — Essay</span>
                    </div>
                    <p className="text-[16px] text-[#1E293B] font-medium leading-relaxed break-all">{q.question}</p>
                  </div>

                  {/* Student response */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[#94A3B8]">
                      <User size={16} />
                      <span className="text-[10px] font-black tracking-widest uppercase">Candidate Response</span>
                    </div>
                    <div className="bg-[#F8F9FF] rounded-3xl p-8 border border-[#E2E8F0] min-h-[130px]">
                      <p className="text-[15px] text-[#475569] leading-relaxed whitespace-pre-line break-all">
                        {response || <span className="italic text-[#CBD5E1]">No response provided.</span>}
                      </p>
                    </div>
                  </div>

                  {/* Per-question grade buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleGradeEssay(selectedStudent.id, true, q._originalIdx)}
                      className="flex-1 bg-[#10B981] text-white py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-[#059669] transition-all flex items-center justify-center gap-2"
                    >
                      Correct <CheckCircle2 size={16} />
                    </button>
                    <button
                      onClick={() => handleGradeEssay(selectedStudent.id, false, q._originalIdx)}
                      className="flex-1 bg-[#EF4444] text-white py-4 rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-[#DC2626] transition-all flex items-center justify-center gap-2"
                    >
                      Incorrect <Circle size={10} className="fill-white" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );

      /* ─────────────── KRAEPELIN ─────────────── */
      case "kraepelin":
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            {filteredQuestions.map((q, qIdx) => {
              const kraepelinAnswers: any[] = selectedStudent.answers[q._originalIdx] || [];

              // DB values set by creator (used only for fallback row when student has no data)
              const dbFirst  = parseInt(q.kraepelin?.first  || "0");
              const dbSecond = parseInt(q.kraepelin?.second || "0");
              const dbAnswer = parseInt(q.kraepelin?.answer || String((dbFirst + dbSecond) % 10));

              // Build display rows: use real student answers if available,
              // otherwise show a placeholder row from creator's DB question
              const rows = Array.isArray(kraepelinAnswers) && kraepelinAnswers.length > 0
                ? kraepelinAnswers
                : [{ a: dbFirst, b: dbSecond, input: null, expected: dbAnswer }];

              return (
                <div key={q._originalIdx} className="bg-white rounded-[2rem] p-12 border border-[#F1F5F9] space-y-8">
                  <h2 className="text-[22px] font-black text-[#1E293B]">Kraepelin Operation Log</h2>

                  <div className="divide-y divide-[#F1F5F9]">
                    {rows.map((row: any, idx: number) => {
                      const a        = parseInt(row.a) || 0;
                      const b        = parseInt(row.b) || 0;
                      const expected = parseInt(row.expected) || (a + b) % 10;
                      const hasInput = row.input !== null && row.input !== undefined;
                      const input    = hasInput ? parseInt(row.input) : null;
                      const isCorrect = hasInput && input === expected;

                      return (
                        <div key={idx} className="py-6 flex items-center justify-between">
                          <div className="flex items-center gap-8">
                            {/* Row number */}
                            <div className="w-10 h-10 bg-[#EEF2FF] text-[#2563EB] rounded-xl flex items-center justify-center text-[13px] font-black">
                              {(idx + 1).toString().padStart(2, "0")}
                            </div>

                            {/* Calculation: only show a + b */}
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Calculation</p>
                              <p className="text-[20px] font-black text-[#1E293B]">
                                {a} + {b}
                              </p>
                            </div>

                            {/* Student Input from DB */}
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Student Input</p>
                              {hasInput ? (
                                <p className={`text-[20px] font-black ${isCorrect ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                                  {input}
                                </p>
                              ) : (
                                <p className="text-[16px] font-medium text-[#CBD5E1] italic">—</p>
                              )}
                            </div>
                          </div>

                          {/* Result badge */}
                          {hasInput ? (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black ${
                              isCorrect ? "bg-[#ECFDF5] text-[#10B981]" : "bg-[#FEF2F2] text-[#EF4444]"
                            }`}>
                              {isCorrect ? <CheckCircle2 size={14} /> : <Circle size={10} className="fill-current" />}
                              {isCorrect ? "Benar" : "Salah"}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#F8FAFC] text-[#94A3B8] text-[11px] font-black">
                              <Circle size={10} className="fill-current opacity-30" />
                              Not Answered
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );


      default:
        return null;
    }
  };

  return (

    <div className="flex flex-col h-full animate-in fade-in duration-700">
      <div className="p-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setSelectedRoom(null)}
            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-[#F1F5F9] text-[#64748B] hover:text-[#2563EB] hover:shadow-lg transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-1">
            <h1 className="text-[32px] font-black text-[#1E293B] tracking-tight">Grading Queue</h1>
            <p className="text-[15px] text-[#64748B] font-medium leading-relaxed">
              Reviewing responses for <span className="text-[#2563EB] font-bold">{selectedRoom.title}</span>
            </p>
          </div>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border border-[#F1F5F9] flex items-center gap-4">
          <Users className="text-[#94A3B8]" size={20} />
          <p className="text-[14px] font-black text-[#1E293B]">{students.filter(s => s.status === "graded").length}/{students.length} Graded</p>
        </div>
      </div>

      <div className="px-12 pb-8 flex gap-4 overflow-x-auto no-scrollbar">
        {[
          { id: "mcq", label: "Multiple Choice", icon: LayoutGrid, type: "MCQ" },
          { id: "checkbox", label: "Checkbox", icon: CheckSquare, type: "CHK" },
          { id: "essay", label: "Essay", icon: FileText, type: "ESS" },
          { id: "kraepelin", label: "Kraepelin", icon: Calculator, type: "KRA" },
        ].map((tab) => {
          const hasQuestions = selectedRoom.questions.some((q: any) => q.type === tab.type);
          return (
            <button
              key={tab.id}
              onClick={() => hasQuestions && setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[200px] h-24 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 transition-all border ${
                !hasQuestions 
                  ? "opacity-30 cursor-not-allowed grayscale" 
                  : activeTab === tab.id 
                    ? "bg-[#2563EB] border-[#2563EB] text-white shadow-xl shadow-blue-500/20" 
                    : "bg-white border-[#F1F5F9] text-[#64748B] hover:border-[#CBD5E1]"
              }`}
            >
              <tab.icon size={22} />
              <div className="flex flex-col items-center">
                <span className="text-[13px] font-black">{tab.label}</span>
                {!hasQuestions && <span className="text-[9px] font-bold opacity-60">NOT AVAILABLE</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex px-12 pb-12 gap-8 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 flex flex-col space-y-6">
          <div className="bg-white rounded-[2rem] p-6 border border-[#F1F5F9] flex-1 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between">
               <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Pending Review</p>
               <span className="w-5 h-5 bg-[#EEF2FF] text-[#2563EB] rounded-full flex items-center justify-center text-[10px] font-black">
                 {students.filter(s => s.status === "COMPLETED" || s.status === "pending").length}
               </span>
            </div>
            
            <div className="space-y-3">
              {students.map((student) => (
                <div 
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border-2 flex items-center justify-between ${
                    selectedStudent?.id === student.id 
                      ? "bg-white border-[#2563EB] shadow-md shadow-blue-500/5" 
                      : "bg-[#F8FAFC] border-transparent hover:bg-white hover:border-[#F1F5F9]"
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className={`text-[14px] font-black break-all ${selectedStudent?.id === student.id ? "text-[#1E293B]" : "text-[#64748B]"}`}>
                      {student.name}
                    </p>
                    <p className="text-[11px] text-[#94A3B8] font-medium">ID: #{student.studentId}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full border-2 ${
                    student.status === "graded" ? "bg-[#10B981] border-[#10B981]" : "border-[#CBD5E1]"
                  }`} />
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-[#F8F9FF] rounded-[2rem] p-8 border border-[#E2E8F0] space-y-4">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#2563EB] shadow-sm">
               <Clock size={20} />
             </div>
             <p className="text-[13px] text-[#64748B] font-medium">Auto-save is enabled. Your feedback is synced in real-time.</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
