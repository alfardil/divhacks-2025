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

export default function Judge1Page() {
  const [code, setCode] = useState(`def hello_world():
    print("Hello, World!")
    return "success"`);
  const [language, setLanguage] = useState("python");
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<FrontendJuryVerdict | null>(null);

  const submitToJudge1 = async () => {
    setLoading(true);
    setVerdict(null);

    try {
      const res = await fetch("http://localhost:8000/frontend-jury/evaluate-with-judge-1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code,
          language: language
        }),
      });

      const data = await res.json();
      setVerdict(data);
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  const testJudge1 = async () => {
    setLoading(true);
    setVerdict(null);

    try {
      const res = await fetch("http://localhost:8000/frontend-jury/test-judge-1");
      const data = await res.json();
      setVerdict(data);
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Judge 1 Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center space-x-4">
            <div className="text-6xl">👨‍💻</div>
            <div>
              <h1 className="text-4xl font-bold">Judge 1 - Prompting Quality</h1>
              <p className="text-blue-200 text-lg">Specialist in Prompt Engineering & LLM Interactions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Code Submission Area */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📝 Submit Code for Judge 1 Evaluation</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Programming Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full max-w-xs"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code to Evaluate
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-64 p-4 border border-gray-300 rounded-md font-mono text-sm"
                placeholder="Enter your code here..."
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={submitToJudge1}
                disabled={loading || !code.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold"
              >
                {loading ? "👨‍💻 Judge 1 Analyzing..." : "👨‍💻 Submit to Judge 1"}
              </button>
              
              <button
                onClick={testJudge1}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold"
              >
                {loading ? "🧪 Testing..." : "🧪 Test Judge 1"}
              </button>
            </div>
          </div>
        </div>

        {/* Judge 1 Verdict Display */}
        {verdict && (
          <div className="space-y-6">
            {/* Overall Verdict */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">⚖️ Judge 1 Verdict</h2>
                <div className={`inline-block px-6 py-3 rounded-full text-2xl font-bold ${getVerdictColor(verdict.verdict || 'UNKNOWN')}`}>
                  {(verdict.verdict || 'UNKNOWN').replace('_', ' ')}
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-bold">Score: </span>
                  <span className={`text-3xl font-bold ${getScoreColor(verdict.overall_score || 0)}`}>
                    {verdict.overall_score || 0}/10
                  </span>
                </div>
                <p className="text-gray-600 mt-2">Case ID: {verdict.case_id}</p>
                <p className="text-gray-600 italic">{verdict.summary}</p>
              </div>
            </div>

            {/* Judge 1 Detailed Analysis */}
            {verdict.judges.map((judge, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                {/* Judge Header */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="text-4xl">👨‍💻</div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{judge.judge_name}</h3>
                    <p className="text-gray-600">Prompt Engineering Specialist</p>
                  </div>
                  <span className={`ml-auto px-4 py-2 rounded-full text-lg font-semibold ${getVerdictColor(judge.verdict || 'UNKNOWN')}`}>
                    {(judge.verdict || 'UNKNOWN').replace('_', ' ')}
                  </span>
                </div>
                
                {/* Score */}
                <div className="mb-6">
                  <span className="text-xl font-semibold">Score: </span>
                  <span className={`text-2xl font-bold ${getScoreColor(judge.score || 0)}`}>
                    {judge.score || 0}/10
                  </span>
                </div>
                
                {/* Detailed Reasoning */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-bold text-gray-700 mb-3">🔍 Detailed Analysis:</h4>
                  <div className="text-sm text-gray-600 whitespace-pre-wrap">
                    {judge.reasoning}
                  </div>
                </div>
                
                {/* Issues Found */}
                {judge.issues.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-red-600 mb-3">⚠️ Issues Found ({judge.issues.length}):</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {judge.issues.map((issue, i) => (
                        <li key={i} className="p-2 bg-red-50 rounded">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Advice */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-bold text-blue-600 mb-2">💡 Judge 1's Advice:</h4>
                  <p className="text-blue-800">
                    {judge.advice || &ldquo;No specific advice provided&rdquo;}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Judge 1 Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-blue-900 mb-4">👨‍💻 About Judge 1</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-semibold mb-2">Specialties:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Prompt clarity and specificity</li>
                <li>System message effectiveness</li>
                <li>Error handling in prompts</li>
                <li>LLM best practices</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Evaluation Criteria:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Prompt structure and organization</li>
                <li>Token efficiency and optimization</li>
                <li>Input validation and error handling</li>
                <li>Output formatting and constraints</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
