"use client";

import { useState } from "react";

interface JudgeResponse {
  judge_id: string;
  judge_name: string;
  score: number;
  verdict: string;
  reasoning: string;
  issues: string[];
  advice: string;
}

interface FrontendJuryVerdict {
  case_id: string;
  overall_score: number;
  verdict: string;
  judges: JudgeResponse[];
  summary: string;
}

export default function Home() {
  const [code, setCode] = useState(`def hello_world():
    print("Hello, World!")
    return "success"`);
  const [language, setLanguage] = useState("python");
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<FrontendJuryVerdict | null>(null);
  
  // Gemini chatbot state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  
  // Jury selection state
  const [selectedJudges, setSelectedJudges] = useState({
    judge_1: true,
    judge_2: true,
    judge_3: true,
    judge_4: true
  });

  const submitToSelectedJudges = async () => {
    setLoading(true);
    setVerdict(null);

    try {
      const res = await fetch("http://localhost:8000/frontend-jury/evaluate-selected-judges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code,
          language: language,
          selectedJudges: selectedJudges
        }),
      });

      const data = await res.json();
      setVerdict(data);
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  const toggleJudge = (judgeId: string) => {
    setSelectedJudges(prev => ({
      ...prev,
      [judgeId]: !prev[judgeId as keyof typeof prev]
    }));
  };

  const sendGeminiMessage = async () => {
    if (!chatMessage.trim()) return;
    
    setChatLoading(true);
    setChatResponse("");
    
    try {
      const res = await fetch("http://localhost:8000/gemini/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: chatMessage
        }),
      });
      
      const data = await res.json();
      setChatResponse(data.response || "No response");
    } catch (error) {
      setChatResponse(`Error: ${error}`);
    }
    
    setChatLoading(false);
  };


  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "GOOD": return "text-green-600 bg-green-100";
      case "NEEDS_IMPROVEMENT": return "text-yellow-600 bg-yellow-100";
      case "EVALUATION_ERROR": return "text-red-600 bg-red-100";
      case "UNKNOWN": return "text-gray-600 bg-gray-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 8-bit Court Header */}
      <div className="bg-gradient-to-r from-amber-800 to-amber-900 text-white py-12 relative overflow-hidden">
        {/* 8-bit pixel pattern background */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='pixel' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Crect width='10' height='10' fill='%23ffffff'/%3E%3Crect x='10' y='10' width='10' height='10' fill='%23ffffff'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23pixel)'/%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="flex items-center justify-center space-x-8">
            {/* 8-bit Judge Characters with Selection */}
            <div className="flex space-x-4">
              <div className="text-center">
                <div className="text-5xl mb-3 filter drop-shadow-lg" style={{
                  fontFamily: 'monospace',
                  textShadow: '4px 4px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000',
                  opacity: selectedJudges.judge_1 ? 1 : 0.5
                }}>
                  👨‍💻
                </div>
                <div className={`px-2 py-1 rounded-lg border-2 ${selectedJudges.judge_1 ? 'bg-black bg-opacity-50 border-yellow-400' : 'bg-gray-600 bg-opacity-50 border-gray-500'}`}>
                  <div className={`text-sm font-bold ${selectedJudges.judge_1 ? 'text-yellow-300' : 'text-gray-400'}`} style={{ fontFamily: 'monospace' }}>
                    JUDGE 1
                  </div>
                  <div className={`text-xs ${selectedJudges.judge_1 ? 'text-yellow-200' : 'text-gray-500'}`} style={{ fontFamily: 'monospace' }}>
                    PROMPT
                  </div>
                </div>
                <button
                  onClick={() => toggleJudge('judge_1')}
                  className={`mt-2 px-3 py-1 rounded text-xs font-bold ${selectedJudges.judge_1 ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                  style={{ fontFamily: 'monospace' }}
                >
                  {selectedJudges.judge_1 ? 'SELECTED' : 'SELECT'}
                </button>
              </div>
              
              <div className="text-center">
                <div className="text-5xl mb-3 filter drop-shadow-lg" style={{
                  fontFamily: 'monospace',
                  textShadow: '4px 4px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000',
                  opacity: selectedJudges.judge_2 ? 1 : 0.5
                }}>
                  👩‍💼
                </div>
                <div className={`px-2 py-1 rounded-lg border-2 ${selectedJudges.judge_2 ? 'bg-black bg-opacity-50 border-yellow-400' : 'bg-gray-600 bg-opacity-50 border-gray-500'}`}>
                  <div className={`text-sm font-bold ${selectedJudges.judge_2 ? 'text-yellow-300' : 'text-gray-400'}`} style={{ fontFamily: 'monospace' }}>
                    JUDGE 2
                  </div>
                  <div className={`text-xs ${selectedJudges.judge_2 ? 'text-yellow-200' : 'text-gray-500'}`} style={{ fontFamily: 'monospace' }}>
                    DATABASE
                  </div>
                </div>
                <button
                  onClick={() => toggleJudge('judge_2')}
                  className={`mt-2 px-3 py-1 rounded text-xs font-bold ${selectedJudges.judge_2 ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                  style={{ fontFamily: 'monospace' }}
                >
                  {selectedJudges.judge_2 ? 'SELECTED' : 'SELECT'}
                </button>
              </div>
              
              <div className="text-center">
                <div className="text-5xl mb-3 filter drop-shadow-lg" style={{
                  fontFamily: 'monospace',
                  textShadow: '4px 4px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000',
                  opacity: selectedJudges.judge_3 ? 1 : 0.5
                }}>
                  🛡️
                </div>
                <div className={`px-2 py-1 rounded-lg border-2 ${selectedJudges.judge_3 ? 'bg-black bg-opacity-50 border-yellow-400' : 'bg-gray-600 bg-opacity-50 border-gray-500'}`}>
                  <div className={`text-sm font-bold ${selectedJudges.judge_3 ? 'text-yellow-300' : 'text-gray-400'}`} style={{ fontFamily: 'monospace' }}>
                    JUDGE 3
                  </div>
                  <div className={`text-xs ${selectedJudges.judge_3 ? 'text-yellow-200' : 'text-gray-500'}`} style={{ fontFamily: 'monospace' }}>
                    SECURITY
                  </div>
                </div>
                <button
                  onClick={() => toggleJudge('judge_3')}
                  className={`mt-2 px-3 py-1 rounded text-xs font-bold ${selectedJudges.judge_3 ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                  style={{ fontFamily: 'monospace' }}
                >
                  {selectedJudges.judge_3 ? 'SELECTED' : 'SELECT'}
                </button>
              </div>
              
              <div className="text-center">
                <div className="text-5xl mb-3 filter drop-shadow-lg" style={{
                  fontFamily: 'monospace',
                  textShadow: '4px 4px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000',
                  opacity: selectedJudges.judge_4 ? 1 : 0.5
                }}>
                  ⚡
                </div>
                <div className={`px-2 py-1 rounded-lg border-2 ${selectedJudges.judge_4 ? 'bg-black bg-opacity-50 border-yellow-400' : 'bg-gray-600 bg-opacity-50 border-gray-500'}`}>
                  <div className={`text-sm font-bold ${selectedJudges.judge_4 ? 'text-yellow-300' : 'text-gray-400'}`} style={{ fontFamily: 'monospace' }}>
                    JUDGE 4
                  </div>
                  <div className={`text-xs ${selectedJudges.judge_4 ? 'text-yellow-200' : 'text-gray-500'}`} style={{ fontFamily: 'monospace' }}>
                    EFFICIENCY
                  </div>
                </div>
                <button
                  onClick={() => toggleJudge('judge_4')}
                  className={`mt-2 px-3 py-1 rounded text-xs font-bold ${selectedJudges.judge_4 ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                  style={{ fontFamily: 'monospace' }}
                >
                  {selectedJudges.judge_4 ? 'SELECTED' : 'SELECT'}
                </button>
              </div>
            </div>
            
            <div className="text-center">
              <h1 className="text-6xl font-bold mb-4" style={{ 
                fontFamily: 'monospace',
                textShadow: '4px 4px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000'
              }}>
                LLM COURT
              </h1>
              <p className="text-2xl text-yellow-200" style={{ fontFamily: 'monospace' }}>
                CODE EVALUATION SYSTEM
              </p>
              <div className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg border-2 border-red-400 inline-block" style={{ fontFamily: 'monospace' }}>
                OPIK POWERED
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Code Submission Area - 8-bit Style */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl p-8 mb-8 border-4 border-yellow-400 relative">
          {/* 8-bit border effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-lg -z-10 transform translate-x-1 translate-y-1"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-yellow-300 mb-6 text-center" style={{ fontFamily: 'monospace' }}>
              [ SUBMIT CODE FOR EVALUATION ]
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-bold text-yellow-200 mb-3" style={{ fontFamily: 'monospace' }}>
                  SELECT LANGUAGE:
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full max-w-xs bg-gray-700 text-white border-2 border-yellow-400 rounded-lg px-4 py-3 font-mono text-lg focus:border-yellow-300 focus:outline-none"
                >
                  <option value="python">PYTHON</option>
                  <option value="javascript">JAVASCRIPT</option>
                  <option value="typescript">TYPESCRIPT</option>
                  <option value="java">JAVA</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
              
              <div>
                <label className="block text-lg font-bold text-yellow-200 mb-3" style={{ fontFamily: 'monospace' }}>
                  ENTER CODE:
                </label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-80 p-6 bg-black text-green-400 border-2 border-yellow-400 rounded-lg font-mono text-sm focus:border-yellow-300 focus:outline-none resize-none"
                  placeholder="// Enter your code here..."
                  style={{ 
                    fontFamily: 'monospace',
                    lineHeight: '1.5'
                  }}
                />
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={submitToSelectedJudges}
                  disabled={loading || !code.trim() || Object.values(selectedJudges).every(v => !v)}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-8 py-4 rounded-lg font-bold text-xl border-2 border-red-400 disabled:border-gray-500 transform hover:scale-105 transition-all duration-200"
                  style={{ fontFamily: 'monospace' }}
                >
                  {loading ? "[ JUDGES DELIBERATING... ]" : "[ SUBMIT TO SELECTED JURY ]"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Judge Verdict Display - 8-bit Style */}
        {verdict && (
          <div className="space-y-8">
            {/* Overall Verdict */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl p-8 border-4 border-yellow-400 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-lg -z-10 transform translate-x-1 translate-y-1"></div>
              
              <div className="relative z-10 text-center">
                <h2 className="text-4xl font-bold text-yellow-300 mb-6" style={{ fontFamily: 'monospace' }}>
                  [ COURT VERDICT ]
                </h2>
                
                <div className={`inline-block px-8 py-4 rounded-lg text-3xl font-bold border-4 ${getVerdictColor(verdict.verdict || 'UNKNOWN')}`} style={{ fontFamily: 'monospace' }}>
                  {(verdict.verdict || 'UNKNOWN').replace('_', ' ')}
                </div>
                
                <div className="mt-6">
                  <span className="text-3xl font-bold text-yellow-200" style={{ fontFamily: 'monospace' }}>SCORE: </span>
                  <span className={`text-4xl font-bold ${getScoreColor(verdict.overall_score || 0)}`} style={{ fontFamily: 'monospace' }}>
                    {verdict.overall_score || 0}/10
                  </span>
                </div>
                
                <div className="mt-4 text-yellow-200" style={{ fontFamily: 'monospace' }}>
                  <p>CASE ID: {verdict.case_id}</p>
                  <p className="italic">{verdict.summary}</p>
                </div>
              </div>
            </div>

            {/* Judge 1 Detailed Analysis */}
            {verdict.judges.map((judge, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl p-8 border-4 border-blue-400 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-300 to-blue-500 rounded-lg -z-10 transform translate-x-1 translate-y-1"></div>
                
                <div className="relative z-10">
                  {/* Judge Header */}
                  <div className="flex items-center space-x-6 mb-8">
                    <div className="text-6xl">
                      {judge.judge_id === 'judge_1' ? '👨‍💻' : 
                       judge.judge_id === 'judge_2' ? '👩‍💼' :
                       judge.judge_id === 'judge_3' ? '🛡️' : '⚡'}
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-blue-300" style={{ fontFamily: 'monospace' }}>
                        {judge.judge_name}
                      </h3>
                      <p className="text-blue-200 text-lg" style={{ fontFamily: 'monospace' }}>
                        {judge.judge_id === 'judge_1' ? 'PROMPT ENGINEERING SPECIALIST' : 
                         judge.judge_id === 'judge_2' ? 'DATABASE OPTIMIZATION EXPERT' :
                         judge.judge_id === 'judge_3' ? 'SECURITY & SAFETY AUDITOR' : 'COST & EFFICIENCY ANALYST'}
                      </p>
                    </div>
                    <span className={`ml-auto px-6 py-3 rounded-lg text-xl font-bold border-2 ${getVerdictColor(judge.verdict || 'UNKNOWN')}`} style={{ fontFamily: 'monospace' }}>
                      {(judge.verdict || 'UNKNOWN').replace('_', ' ')}
                    </span>
                  </div>
                  
                  {/* Score */}
                  <div className="mb-8 text-center">
                    <span className="text-2xl font-bold text-blue-200" style={{ fontFamily: 'monospace' }}>SCORE: </span>
                    <span className={`text-3xl font-bold ${getScoreColor(judge.score || 0)}`} style={{ fontFamily: 'monospace' }}>
                      {judge.score || 0}/10
                    </span>
                  </div>
                  
                  {/* Concise Analysis - Only 3 Lines */}
                  <div className="mb-8 p-6 bg-black bg-opacity-50 rounded-lg border-2 border-green-400">
                    <h4 className="font-bold text-green-300 mb-4 text-xl" style={{ fontFamily: 'monospace' }}>
                      [ QUICK ANALYSIS ]
                    </h4>
                    <div className="text-green-200 text-sm font-mono leading-relaxed">
                      {judge.reasoning.split('\n').slice(0, 3).join('\n')}
                    </div>
                  </div>
                  
                  {/* Issues Found - Max 3 */}
                  {judge.issues.length > 0 && (
                    <div className="mb-8">
                      <h4 className="font-bold text-red-300 mb-4 text-xl" style={{ fontFamily: 'monospace' }}>
                        [ TOP ISSUES: {Math.min(judge.issues.length, 3)} ]
                      </h4>
                      <ul className="space-y-2">
                        {judge.issues.slice(0, 3).map((issue, i) => (
                          <li key={i} className="p-3 bg-red-900 bg-opacity-50 rounded border-l-4 border-red-400 text-red-200 font-mono text-sm">
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Advice */}
                  <div className="p-6 bg-blue-900 bg-opacity-50 rounded-lg border-2 border-blue-400">
                    <h4 className="font-bold text-blue-300 mb-3 text-xl" style={{ fontFamily: 'monospace' }}>
                      [ {judge.judge_id === 'judge_1' ? 'JUDGE 1' : 
                         judge.judge_id === 'judge_2' ? 'JUDGE 2' :
                         judge.judge_id === 'judge_3' ? 'JUDGE 3' : 'JUDGE 4'} ADVICE ]
                    </h4>
                    <p className="text-blue-200 font-mono">
                      {judge.advice || "No specific advice provided"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 8-bit Footer */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 border-4 border-yellow-400 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-lg -z-10 transform translate-x-1 translate-y-1"></div>
            <div className="relative z-10 text-yellow-200" style={{ fontFamily: 'monospace' }}>
              <p className="text-lg">[ OPIK POWERED EVALUATION SYSTEM ]</p>
              <p className="text-sm mt-2">[ ALL LLM CALLS TRACKED AND ANALYZED ]</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gemini Chatbot - Fixed Position Corner */}
      <div className="fixed bottom-4 right-4 z-50">
        {/* Chat Toggle Button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-4 rounded-full shadow-lg border-2 border-purple-400 transform hover:scale-110 transition-all duration-200"
          style={{ fontFamily: 'monospace' }}
        >
          🤖
        </button>

        {/* Chat Window */}
        {chatOpen && (
          <div className="absolute bottom-16 right-0 w-80 h-96 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl border-4 border-purple-400 p-4">
            <div className="h-full flex flex-col">
              {/* Chat Header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-400">
                <h3 className="text-purple-300 font-bold" style={{ fontFamily: 'monospace' }}>
                  GEMINI CHAT
                </h3>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-purple-300 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Chat Response */}
              <div className="flex-1 mb-3 p-3 bg-black bg-opacity-50 rounded border border-green-400 overflow-y-auto">
                <div className="text-green-200 text-sm font-mono">
                  {chatLoading ? "Thinking..." : chatResponse || "Ask me anything!"}
                </div>
              </div>

              {/* Chat Input */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendGeminiMessage()}
                  placeholder="Type message..."
                  className="w-full p-2 bg-gray-700 text-white border border-purple-400 rounded text-sm font-mono focus:outline-none focus:border-purple-300"
                />
                <button
                  onClick={sendGeminiMessage}
                  disabled={chatLoading || !chatMessage.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-2 rounded text-sm font-bold"
                  style={{ fontFamily: 'monospace' }}
                >
                  {chatLoading ? "SENDING..." : "SEND"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
