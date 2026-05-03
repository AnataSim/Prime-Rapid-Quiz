"use client";

import LeaderboardTable from "./LeaderboardTable";
import AccuracyAnalytics from "./AccuracyAnalytics";
import QuestionReview from "./QuestionReview";

interface PerformanceViewProps {
  data?: any;
  user?: any;
  room?: any;
}

export default function PerformanceView({ data, user, room }: PerformanceViewProps) {
  const roomTitle = room?.title || data?.room?.title || "Unknown Assessment";
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <div className="flex-1 p-12 flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-y-auto h-screen scrollbar-hide">
      
      {/* Header Area */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Review Session</span>
        </div>
        <h2 className="text-5xl font-extrabold text-gray-900 tracking-tight">{roomTitle}</h2>
        <p className="text-gray-400 font-medium max-w-2xl leading-relaxed">
          Performance analysis for the psychometric evaluation held on {dateStr}. Review your logic pathways and room standings below.
        </p>
      </div>

      {/* Top Stats Section */}
      <div className="flex gap-8 items-start">
        <LeaderboardTable room={room || data?.room} user={user} />
        <AccuracyAnalytics data={data} />
      </div>

      {/* Question Review Section */}
      <div className="max-w-5xl">
        <QuestionReview data={data} />
      </div>

    </div>
  );
}
