"use client";

interface AccuracyAnalyticsProps {
  data?: any;
}

export default function AccuracyAnalytics({ data }: AccuracyAnalyticsProps) {
  const score = data?.score || 0;
  const hasKraepelin = data?.room?.questions?.some((q: any) => 
    q.type === "KRAEPELIN" || (q.stem && q.stem.toLowerCase().includes("kraepelin"))
  ) || false;

  // Simple Speed Calculation based on time
  const totalTime = data?.totalTimeMs || 0;
  const numQuestions = data?.room?.questions?.length || 1;
  const avgSeconds = (totalTime / numQuestions) / 1000;
  
  const speedPercentage = Math.max(10, Math.min(100, 100 - (avgSeconds * 1.5)));
  
  let speedLabel = "AVERAGE";
  if (speedPercentage > 80) speedLabel = "INCREDIBLE";
  else if (speedPercentage > 60) speedLabel = "FASTER";
  else if (speedPercentage < 40) speedLabel = "SLOW";

  return (
    <div className="w-80 space-y-6">
      {/* Accuracy Card */}
      <div className="bg-primary rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-xl shadow-primary/20">
        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
        
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-6 block">Total Accuracy</span>
        <h4 className="text-6xl font-black tracking-tighter mb-8 leading-none">{score}%</h4>
        
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 bg-white transition-all duration-1000" style={{ width: `${score}%` }}></div>
        </div>
      </div>

      {/* Speed Bars Card */}
      <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm space-y-8">
        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Calculation</h5>
        
        <div className="space-y-8">
          {/* Kraepelin - Conditionally Rendered */}
          {hasKraepelin && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                <span className="text-gray-900">Kraepelin</span>
                <span className="text-primary">Faster</span>
              </div>
              <div className="w-full h-1.5 bg-blue-50 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "90%" }}></div>
              </div>
            </div>
          )}

          {/* Logic Solving (Overall Speed) */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
              <span className="text-gray-900">Overall Speed</span>
              <span className="text-purple-600">{speedLabel}</span>
            </div>
            <div className="w-full h-1.5 bg-purple-50 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: `${speedPercentage}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
