"use client";

import { useState } from "react";
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  MessageCircle, 
  HelpCircle,
  ExternalLink
} from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: "1",
    question: "How do I create a multi-section quiz?",
    answer: "Navigate to the Question Editor and click \"Add Section\" in the left-hand sidebar. You can drag and drop questions between sections or define section-specific time limits and instructions."
  },
  {
    id: "2",
    question: "How can I manage room access for students?",
    answer: "You can manage and configure room access directly during the room creation process. When setting up a new room, the platform provides specific configuration options that allow you to dictate exactly who is allowed to join. Within these settings, you can easily establish entry permissions, apply access limits, and ensure that only your authorized students can enter the session."
  },
  {
    id: "3",
    question: "Are there tips for faster manual grading?",
    answer: "Yes, manual grading gets easier over time. With a little practice, you will get used to the workflow and become much faster. To speed things up, try grading the same question for all students consecutively so you can focus on one rubric. Additionally, keeping a quick list of pre-written feedback to copy and paste will save you a lot of repetitive typing."
  },
  {
    id: "4",
    question: "Can I export my quiz performance data?",
    answer: "Currently, the platform does not offer a feature to export or download quiz performance data into an external file. However, you can still easily track and review all of your students' detailed performance results and overall progress directly within the Grading menu."
  }
];

export default function CreatorSupportView() {
  const [openId, setOpenId] = useState<string | null>("2"); // Open the second one by default as seen in one of the screenshots

  return (
    <div className="p-12 max-w-6xl mx-auto space-y-16 animate-in fade-in duration-700 pb-24">
      {/* Header Section */}
      <div className="text-center space-y-10">
        <h1 className="text-[48px] font-black text-[#1E293B] tracking-tight">How can we help?</h1>
        
        <div className="relative max-w-4xl mx-auto group">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2563EB] transition-colors" size={24} />
          <input 
            type="text" 
            placeholder="Search for articles, guides, or troubleshooting..."
            className="w-full pl-20 pr-8 py-7 bg-white border border-[#F1F5F9] rounded-[2.5rem] text-[16px] font-medium outline-none shadow-[0_2px_15px_rgba(0,0,0,0.02)] focus:border-[#2563EB]/20 focus:shadow-xl focus:shadow-blue-500/5 transition-all placeholder:text-gray-300"
          />
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-[24px] font-black text-[#1E293B] tracking-tight">Frequently Asked Questions</h2>
          <p className="text-[15px] text-[#94A3B8] font-medium">Commonly asked questions about our creator tools and assessment management.</p>
        </div>

        <div className="space-y-4">
          {FAQ_DATA.map((item) => (
            <div 
              key={item.id}
              className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${
                openId === item.id ? "border-[#2563EB]/10 shadow-lg shadow-blue-500/5" : "border-[#F1F5F9] hover:border-gray-200"
              }`}
            >
              <button 
                onClick={() => setOpenId(openId === item.id ? null : item.id)}
                className="w-full px-8 py-6 flex items-center justify-between text-left"
              >
                <span className={`text-[16px] font-bold ${openId === item.id ? "text-[#1E293B]" : "text-[#475569]"}`}>
                  {item.question}
                </span>
                {openId === item.id ? (
                  <ChevronUp size={20} className="text-[#2563EB]" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400" />
                )}
              </button>
              
              <div className={`transition-all duration-500 ease-in-out ${
                openId === item.id ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
              }`}>
                <div className="px-8 pb-8 pt-2">
                  <p className="text-[14px] text-[#64748B] leading-relaxed font-medium">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-[#F5F8FF] rounded-[3rem] p-16 text-center space-y-8 border border-blue-100/50">
        <div className="space-y-3">
          <h3 className="text-[24px] font-black text-[#1E293B]">Still need assistance?</h3>
          <p className="text-[15px] text-[#64748B] font-medium max-w-md mx-auto leading-relaxed">
            If you couldn't find the answers you need, our dedicated Creator Support team is here to help.
          </p>
        </div>
        
        <button className="bg-[#2563EB] text-white px-10 py-4 rounded-[1.25rem] text-[13px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/25 hover:bg-[#1D4ED8] transition-all active:scale-95 flex items-center justify-center gap-3 mx-auto">
          Contact Support <ExternalLink size={16} />
        </button>
      </div>

      {/* Quick Links / Footer Info */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-12 pt-8 text-[#94A3B8]">
        <div className="flex items-center gap-3 cursor-pointer hover:text-[#2563EB] transition-colors">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <HelpCircle size={20} />
          </div>
          <span className="text-[13px] font-bold">Documentation</span>
        </div>
        <div className="flex items-center gap-3 cursor-pointer hover:text-[#2563EB] transition-colors">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <MessageCircle size={20} />
          </div>
          <span className="text-[13px] font-bold">Community Forum</span>
        </div>
      </div>
    </div>
  );
}
