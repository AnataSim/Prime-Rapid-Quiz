"use client";

import { useState } from "react";
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Mail,
  HelpCircle
} from "lucide-react";

const faqs = [
  {
    question: "How are \"Rapid\" scores calculated?",
    answer: "Our scoring algorithm balances accuracy with time-to-complete. A \"Rapid\" score is calculated using a weighted average of your response speed relative to the global average for that specific question difficulty, combined with your absolute accuracy percentage."
  },
  {
    question: "Can I retake a proctored exam if I lose connection?",
    answer: "Usually, yes. Contact your instructor and the exam support team immediately to report the disconnection."
  },
  {
    question: "What are the subscription tiers available?",
    answer: "No, there are no premium subscription tiers available; the platform and its features are entirely free. Regarding the scoring mechanism, our algorithm balances your exact accuracy with your overall time-to-complete. To generate your \"Rapid\" score, the system calculates a weighted average comparing your individual response speed against the global average for that specific question difficulty. This time-based metric is then integrated with your absolute accuracy percentage, offering a holistic evaluation that rewards both quick reflexes and correct answers."
  },
  {
    question: "How do I export my performance data?",
    answer: "Unfortunately, our system does not currently offer a feature to export or download your performance data as an external file (such as CSV, Excel, or PDF). However, you can still track all of your statistics and progress comprehensively within the platform. To monitor your results, please navigate to the Leaderboard menu. There, you can view a detailed summary of your performance, compare your scores with other users, and check your achievement metrics, which are continuously updated by the system in real-time."
  },
  {
    question: "Is my personal data secure?",
    answer: "Yes, your personal data is completely secure. The system is built with robust safeguards to guarantee the protection and privacy of your information. All security protocols, access controls, and data management rules are strictly configured and continuously monitored by the system administrators. This ensures that your information remains protected against unauthorized access at all times and is handled in full compliance with the platform's established security standards."
  }
];

export default function HelpView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          How can we help?
        </h1>
        
        {/* Search Bar */}
        <div className="relative max-w-3xl mx-auto pt-6">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-primary pt-6">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Search for articles, guides, or troubleshooting..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-2xl text-sm outline-none transition-all shadow-sm focus:shadow-md placeholder:text-gray-400 font-medium"
          />
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Frequently Asked Questions</h2>
          <p className="text-sm text-gray-500 font-medium">Commonly asked questions about our platform and assessments.</p>
        </div>

        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-sm"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left group"
                >
                  <span className="font-bold text-gray-900 text-[15px] group-hover:text-primary transition-colors">
                    {faq.question}
                  </span>
                  <div className={`p-1 rounded-lg transition-all ${openIndex === index ? 'bg-primary/5 text-primary' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    {openIndex === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>
                
                <div 
                  className={`px-6 transition-all duration-300 ease-in-out overflow-hidden ${
                    openIndex === index ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-[14px] text-gray-500 leading-relaxed font-medium">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
              <HelpCircle className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 font-medium">No results found for "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Still Need Help Section */}
      <div className="bg-[#EEF2FF] rounded-[2.5rem] p-12 text-center space-y-6 relative overflow-hidden group">
        {/* Decorative background circle */}
        <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500"></div>
        <div className="absolute bottom-[-50%] left-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500"></div>

        <div className="relative z-10 space-y-4">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Still need help?</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed font-medium">
            If you couldn't find what you were looking for, our support team is just a message away.
          </p>
          <button className="bg-primary hover:bg-primary-dark text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mx-auto">
            <Mail size={18} />
            CONTACT SUPPORT
          </button>
        </div>
      </div>
    </div>
  );
}
