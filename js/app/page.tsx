"use client";

import { API_ENDPOINTS, buildApiUrl } from "@/lib/api-config";
import { useEffect, useState } from "react";

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
    judge_4: true,
  });

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Read URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get("code");
    const languageParam = urlParams.get("language");

    if (codeParam) {
      setCode(decodeURIComponent(codeParam));
    }

    if (languageParam) {
      setLanguage(decodeURIComponent(languageParam));
    }
  }, []);

  const submitToSelectedJudges = async () => {
    setLoading(true);
    setVerdict(null);

    try {
      const res = await fetch(
        buildApiUrl(API_ENDPOINTS.FRONTEND_JURY.EVALUATE_SELECTED_JUDGES),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: code,
            language: language,
            selectedJudges: selectedJudges,
          }),
        }
      );

      const data = await res.json();
      setVerdict(data);
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  const toggleJudge = (judgeId: string) => {
    setSelectedJudges((prev) => ({
      ...prev,
      [judgeId]: !prev[judgeId as keyof typeof prev],
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Read file content and set it as code
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCode(content);
      };
      reader.readAsText(file);
    }
  };

  const sendGeminiMessage = async () => {
    if (!chatMessage.trim()) return;

    setChatLoading(true);
    setChatResponse("");

    try {
      const res = await fetch(buildApiUrl(API_ENDPOINTS.GEMINI.CHAT), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: chatMessage,
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
      case "GOOD":
        return "bg-green-900/50 text-green-200 border-green-400";
      case "OPTIMIZED":
        return "bg-green-900/50 text-green-200 border-green-400";
      case "SECURE":
        return "bg-green-900/50 text-green-200 border-green-400";
      case "EFFICIENT":
        return "bg-green-900/50 text-green-200 border-green-400";
      case "NEEDS_IMPROVEMENT":
        return "bg-yellow-900/50 text-yellow-200 border-yellow-400";
      case "NEEDS_OPTIMIZATION":
        return "bg-yellow-900/50 text-yellow-200 border-yellow-400";
      case "VULNERABLE":
        return "bg-red-900/50 text-red-200 border-red-400";
      case "INEFFICIENT":
        return "bg-red-900/50 text-red-200 border-red-400";
      case "EVALUATION_ERROR":
        return "bg-red-900/50 text-red-200 border-red-400";
      case "UNKNOWN":
        return "bg-amber-900/50 text-amber-200 border-amber-400";
      default:
        return "bg-amber-900/50 text-amber-200 border-amber-400";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Dark Court Header */}
      <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white py-12 relative overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='dots' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='20' cy='20' r='1' fill='%23ffffff'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23dots)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          {/* Title Section with Legal Decorations */}
          <div className="flex items-center justify-between mb-12">
            {/* Left Side Legal Decorations */}
            <div className="flex items-center space-x-8 opacity-60">
              {/* Scales of Justice */}
              <div className="w-16 h-16">
                <svg viewBox="0 0 100 100" className="w-full h-full text-amber-400">
                  {/* Base */}
                  <rect x="45" y="80" width="10" height="20" fill="currentColor" />
                  {/* Pillar */}
                  <rect x="47" y="20" width="6" height="60" fill="currentColor" />
                  {/* Crossbar */}
                  <rect x="20" y="25" width="60" height="4" fill="currentColor" />
                  {/* Left Scale */}
                  <circle cx="30" cy="35" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M 30 35 L 30 25" stroke="currentColor" strokeWidth="2" />
                  {/* Right Scale */}
                  <circle cx="70" cy="35" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M 70 35 L 70 25" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              
              {/* Gavel */}
              <div className="w-16 h-16">
                <svg viewBox="0 0 100 100" className="w-full h-full text-amber-300">
                  {/* Gavel Head */}
                  <rect x="20" y="20" width="20" height="20" rx="3" fill="currentColor" />
                  {/* Gavel Handle */}
                  <rect x="28" y="40" width="4" height="35" fill="currentColor" />
                  {/* Base */}
                  <rect x="15" y="75" width="30" height="8" rx="2" fill="currentColor" />
                </svg>
              </div>
              
              {/* Law Books */}
              <div className="w-16 h-16">
                <svg viewBox="0 0 100 100" className="w-full h-full text-amber-500">
                  {/* Book 1 */}
                  <rect x="15" y="25" width="20" height="30" rx="2" fill="currentColor" />
                  <rect x="17" y="27" width="16" height="26" rx="1" fill="#8B4513" />
                  {/* Book 2 */}
                  <rect x="25" y="20" width="20" height="30" rx="2" fill="currentColor" />
                  <rect x="27" y="22" width="16" height="26" rx="1" fill="#8B4513" />
                  {/* Book 3 */}
                  <rect x="35" y="15" width="20" height="30" rx="2" fill="currentColor" />
                  <rect x="37" y="17" width="16" height="26" rx="1" fill="#8B4513" />
                </svg>
              </div>
            </div>

            {/* Center Title */}
            <div className="text-center flex-1">
              <h1 className="text-6xl font-bold mb-4 text-white">
                Gavel: Opik&apos;s LLM Court
              </h1>
              <p className="text-xl text-gray-300 mb-6">Code Evaluation System</p>
            </div>

            {/* Right Side Legal Decorations */}
            <div className="flex items-center space-x-8 opacity-60">
              {/* Podium */}
              <div className="w-16 h-16">
                <svg viewBox="0 0 100 100" className="w-full h-full text-amber-400">
                  {/* Podium Base */}
                  <rect x="20" y="60" width="60" height="25" rx="5" fill="currentColor" />
                  {/* Podium Top */}
                  <rect x="25" y="40" width="50" height="25" rx="3" fill="currentColor" />
                  {/* Podium Stand */}
                  <rect x="45" y="20" width="10" height="25" fill="currentColor" />
                  {/* Microphone */}
                  <circle cx="50" cy="15" r="3" fill="#8B4513" />
                  <rect x="49" y="15" width="2" height="8" fill="#8B4513" />
                </svg>
              </div>
              
              {/* Courtroom Seal */}
              <div className="w-16 h-16">
                <svg viewBox="0 0 100 100" className="w-full h-full text-amber-300">
                  {/* Outer Circle */}
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3" />
                  {/* Inner Circle */}
                  <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="2" />
                  {/* Center Star */}
                  <polygon points="50,20 55,35 70,35 58,45 63,60 50,50 37,60 42,45 30,35 45,35" fill="currentColor" />
                  {/* Text Ring */}
                  <text x="50" y="75" textAnchor="middle" fontSize="8" fill="currentColor" className="font-bold">COURT OF CODE</text>
                </svg>
              </div>
              
              {/* Legal Scroll */}
              <div className="w-16 h-16">
                <svg viewBox="0 0 100 100" className="w-full h-full text-amber-500">
                  {/* Scroll Body */}
                  <rect x="25" y="30" width="50" height="40" rx="3" fill="currentColor" />
                  {/* Scroll Rollers */}
                  <rect x="20" y="25" width="8" height="50" rx="4" fill="#8B4513" />
                  <rect x="72" y="25" width="8" height="50" rx="4" fill="#8B4513" />
                  {/* Text Lines */}
                  <rect x="30" y="40" width="40" height="2" fill="#8B4513" />
                  <rect x="30" y="45" width="35" height="2" fill="#8B4513" />
                  <rect x="30" y="50" width="38" height="2" fill="#8B4513" />
                  <rect x="30" y="55" width="32" height="2" fill="#8B4513" />
                </svg>
              </div>
            </div>
          </div>

          {/* Judge Selection Section - Centered under title */}
          <div className="flex justify-center">
            <div className="flex space-x-8">
              <div className="text-center">
                {/* Custom SVG Avatar for Bob */}
                <div
                  className="mb-4 transition-all duration-300 cursor-pointer"
                  style={{
                    opacity: selectedJudges.judge_1 ? 1 : 0.4,
                    transform: selectedJudges.judge_1
                      ? "scale(1.05)"
                      : "scale(1)",
                  }}
                  onClick={() => toggleJudge("judge_1")}
                >
                  <div className="w-24 h-24 mx-auto">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {/* Bob - Guy with Pen and Paper */}
                      {/* Head */}
                      <circle
                        cx="50"
                        cy="32"
                        r="16"
                        fill="#D2B48C"
                        stroke="#8B4513"
                        strokeWidth="2"
                      />
                      {/* Hair */}
                      <path
                        d="M 35 20 Q 50 12 65 20 Q 60 25 50 25 Q 40 25 35 20"
                        fill="#8B4513"
                      />
                      {/* Eyes */}
                      <circle cx="44" cy="28" r="2.5" fill="#000" />
                      <circle cx="56" cy="28" r="2.5" fill="#000" />
                      <circle cx="44.5" cy="27.5" r="1" fill="#fff" />
                      <circle cx="56.5" cy="27.5" r="1" fill="#fff" />
                      {/* Nose */}
                      <ellipse cx="50" cy="32" rx="1.5" ry="2" fill="#CD853F" />
                      {/* Mouth */}
                      <path
                        d="M 46 36 Q 50 39 54 36"
                        stroke="#8B4513"
                        strokeWidth="1.5"
                        fill="none"
                      />
                      {/* Body - Casual Shirt */}
                      <rect
                        x="35"
                        y="48"
                        width="30"
                        height="45"
                        rx="8"
                        fill="#3B82F6"
                        stroke="#1E40AF"
                        strokeWidth="2"
                      />
                      {/* Arms */}
                      <rect
                        x="28"
                        y="55"
                        width="8"
                        height="25"
                        rx="4"
                        fill="#D2B48C"
                      />
                      <rect
                        x="64"
                        y="55"
                        width="8"
                        height="25"
                        rx="4"
                        fill="#D2B48C"
                      />
                      {/* Hands */}
                      <circle cx="32" cy="85" r="4" fill="#D2B48C" />
                      <circle cx="68" cy="85" r="4" fill="#D2B48C" />
                      {/* Pen in right hand */}
                      <rect x="70" y="80" width="2" height="8" fill="#000" />
                      <rect x="69" y="78" width="4" height="2" fill="#FF0000" />
                      {/* Paper in left hand */}
                      <rect
                        x="25"
                        y="75"
                        width="12"
                        height="15"
                        rx="1"
                        fill="#FFFFFF"
                        stroke="#000"
                        strokeWidth="1"
                      />
                      <rect x="27" y="77" width="8" height="1" fill="#000" />
                      <rect x="27" y="79" width="6" height="1" fill="#000" />
                      <rect x="27" y="81" width="7" height="1" fill="#000" />
                    </svg>
                  </div>
                </div>
                <div
                  className={`px-4 py-3 rounded-xl border transition-all duration-300 ${
                    selectedJudges.judge_1
                      ? "bg-gray-700/50 border-gray-500 shadow-lg"
                      : "bg-gray-800/30 border-gray-600"
                  }`}
                >
                  <div
                    className={`text-sm font-bold ${
                      selectedJudges.judge_1 ? "text-white" : "text-gray-400"
                    }`}
                  >
                    Bob
                  </div>
                  <div
                    className={`text-xs ${
                      selectedJudges.judge_1 ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Prompt Quality
                  </div>
                </div>
                <button
                  onClick={() => toggleJudge("judge_1")}
                  className={`mt-3 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                    selectedJudges.judge_1
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600"
                  }`}
                >
                  {selectedJudges.judge_1 ? "Selected" : "Select"}
                </button>
              </div>

              <div className="text-center">
                {/* Custom SVG Avatar for Bobby */}
                <div
                  className="mb-4 transition-all duration-300 cursor-pointer"
                  style={{
                    opacity: selectedJudges.judge_2 ? 1 : 0.4,
                    transform: selectedJudges.judge_2
                      ? "scale(1.05)"
                      : "scale(1)",
                  }}
                  onClick={() => toggleJudge("judge_2")}
                >
                  <div className="w-24 h-24 mx-auto">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {/* Bobby - Scientist with Goggles */}
                      {/* Head */}
                      <circle
                        cx="50"
                        cy="32"
                        r="16"
                        fill="#F4C2A1"
                        stroke="#D2691E"
                        strokeWidth="2"
                      />
                      {/* Hair */}
                      <path
                        d="M 35 20 Q 50 10 65 20 Q 60 25 50 25 Q 40 25 35 20"
                        fill="#8B4513"
                      />
                      {/* Goggles */}
                      <circle
                        cx="44"
                        cy="28"
                        r="6"
                        fill="none"
                        stroke="#000"
                        strokeWidth="2"
                      />
                      <circle
                        cx="56"
                        cy="28"
                        r="6"
                        fill="none"
                        stroke="#000"
                        strokeWidth="2"
                      />
                      <rect
                        x="50"
                        y="22"
                        width="0"
                        height="12"
                        stroke="#000"
                        strokeWidth="2"
                      />
                      <circle
                        cx="44"
                        cy="28"
                        r="4"
                        fill="#87CEEB"
                        opacity="0.7"
                      />
                      <circle
                        cx="56"
                        cy="28"
                        r="4"
                        fill="#87CEEB"
                        opacity="0.7"
                      />
                      {/* Nose */}
                      <ellipse cx="50" cy="32" rx="1.5" ry="2" fill="#D2691E" />
                      {/* Mouth */}
                      <path
                        d="M 46 36 Q 50 39 54 36"
                        stroke="#8B4513"
                        strokeWidth="1.5"
                        fill="none"
                      />
                      {/* Body - Lab Coat */}
                      <rect
                        x="35"
                        y="48"
                        width="30"
                        height="45"
                        rx="8"
                        fill="#FFFFFF"
                        stroke="#000"
                        strokeWidth="2"
                      />
                      {/* Lab Coat Buttons */}
                      <circle cx="50" cy="55" r="1" fill="#000" />
                      <circle cx="50" cy="65" r="1" fill="#000" />
                      <circle cx="50" cy="75" r="1" fill="#000" />
                      {/* Arms */}
                      <rect
                        x="28"
                        y="55"
                        width="8"
                        height="25"
                        rx="4"
                        fill="#F4C2A1"
                      />
                      <rect
                        x="64"
                        y="55"
                        width="8"
                        height="25"
                        rx="4"
                        fill="#F4C2A1"
                      />
                      {/* Hands */}
                      <circle cx="32" cy="85" r="4" fill="#F4C2A1" />
                      <circle cx="68" cy="85" r="4" fill="#F4C2A1" />
                      {/* Test Tube */}
                      <rect
                        x="70"
                        y="75"
                        width="3"
                        height="12"
                        fill="#87CEEB"
                        stroke="#000"
                        strokeWidth="1"
                      />
                      <rect x="69" y="72" width="5" height="3" fill="#000" />
                    </svg>
                  </div>
                </div>
                <div
                  className={`px-4 py-3 rounded-xl border transition-all duration-300 ${
                    selectedJudges.judge_2
                      ? "bg-gray-700/50 border-gray-500 shadow-lg"
                      : "bg-gray-800/30 border-gray-600"
                  }`}
                >
                  <div
                    className={`text-sm font-bold ${
                      selectedJudges.judge_2 ? "text-white" : "text-gray-400"
                    }`}
                  >
                    Bobby
                  </div>
                  <div
                    className={`text-xs ${
                      selectedJudges.judge_2 ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Database Optimization
                  </div>
                </div>
                <button
                  onClick={() => toggleJudge("judge_2")}
                  className={`mt-3 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                    selectedJudges.judge_2
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600"
                  }`}
                >
                  {selectedJudges.judge_2 ? "Selected" : "Select"}
                </button>
              </div>

              <div className="text-center">
                {/* Custom SVG Avatar for Bobert */}
                <div
                  className="mb-4 transition-all duration-300 cursor-pointer"
                  style={{
                    opacity: selectedJudges.judge_3 ? 1 : 0.4,
                    transform: selectedJudges.judge_3
                      ? "scale(1.05)"
                      : "scale(1)",
                  }}
                  onClick={() => toggleJudge("judge_3")}
                >
                  <div className="w-24 h-24 mx-auto">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {/* Bobert - Guy in Sunglasses, Tie and Suit */}
                      {/* Head */}
                      <circle
                        cx="50"
                        cy="32"
                        r="16"
                        fill="#D2B48C"
                        stroke="#8B4513"
                        strokeWidth="2"
                      />
                      {/* Hair */}
                      <path
                        d="M 35 20 Q 50 12 65 20 Q 60 25 50 25 Q 40 25 35 20"
                        fill="#8B4513"
                      />
                      {/* Sunglasses */}
                      <rect
                        x="40"
                        y="25"
                        width="8"
                        height="6"
                        rx="3"
                        fill="#000"
                      />
                      <rect
                        x="52"
                        y="25"
                        width="8"
                        height="6"
                        rx="3"
                        fill="#000"
                      />
                      <rect x="48" y="27" width="4" height="2" fill="#000" />
                      {/* Nose */}
                      <ellipse cx="50" cy="32" rx="1.5" ry="2" fill="#CD853F" />
                      {/* Mouth */}
                      <path
                        d="M 46 36 Q 50 39 54 36"
                        stroke="#8B4513"
                        strokeWidth="1.5"
                        fill="none"
                      />
                      {/* Body - Suit */}
                      <rect
                        x="35"
                        y="48"
                        width="30"
                        height="45"
                        rx="8"
                        fill="#000000"
                        stroke="#333"
                        strokeWidth="2"
                      />
                      {/* Tie */}
                      <rect
                        x="48"
                        y="48"
                        width="4"
                        height="20"
                        fill="#FF0000"
                      />
                      <rect x="47" y="48" width="6" height="8" fill="#FF0000" />
                      {/* Arms */}
                      <rect
                        x="28"
                        y="55"
                        width="8"
                        height="25"
                        rx="4"
                        fill="#D2B48C"
                      />
                      <rect
                        x="64"
                        y="55"
                        width="8"
                        height="25"
                        rx="4"
                        fill="#D2B48C"
                      />
                      {/* Hands */}
                      <circle cx="32" cy="85" r="4" fill="#D2B48C" />
                      <circle cx="68" cy="85" r="4" fill="#D2B48C" />
                    </svg>
                  </div>
                </div>
                <div
                  className={`px-4 py-3 rounded-xl border transition-all duration-300 ${
                    selectedJudges.judge_3
                      ? "bg-gray-700/50 border-gray-500 shadow-lg"
                      : "bg-gray-800/30 border-gray-600"
                  }`}
                >
                  <div
                    className={`text-sm font-bold ${
                      selectedJudges.judge_3 ? "text-white" : "text-gray-400"
                    }`}
                  >
                    Bobert
                  </div>
                  <div
                    className={`text-xs ${
                      selectedJudges.judge_3 ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Security & Safety
                  </div>
                </div>
                <button
                  onClick={() => toggleJudge("judge_3")}
                  className={`mt-3 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                    selectedJudges.judge_3
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600"
                  }`}
                >
                  {selectedJudges.judge_3 ? "Selected" : "Select"}
                </button>
              </div>

              <div className="text-center">
                {/* Custom SVG Avatar for Bro */}
                <div
                  className="mb-4 transition-all duration-300 cursor-pointer"
                  style={{
                    opacity: selectedJudges.judge_4 ? 1 : 0.4,
                    transform: selectedJudges.judge_4
                      ? "scale(1.05)"
                      : "scale(1)",
                  }}
                  onClick={() => toggleJudge("judge_4")}
                >
                  <div className="w-24 h-24 mx-auto">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {/* Bro - Bank Robber with Mask, Hat and Striped Shirt */}
                      {/* Head */}
                      <circle
                        cx="50"
                        cy="32"
                        r="16"
                        fill="#D2B48C"
                        stroke="#8B4513"
                        strokeWidth="2"
                      />
                      {/* Hat */}
                      <rect
                        x="40"
                        y="15"
                        width="20"
                        height="8"
                        rx="4"
                        fill="#000"
                      />
                      <rect x="35" y="20" width="30" height="3" fill="#000" />
                      {/* Mask */}
                      <rect
                        x="35"
                        y="25"
                        width="30"
                        height="12"
                        rx="6"
                        fill="#000"
                      />
                      <circle cx="44" cy="31" r="2" fill="#FFF" />
                      <circle cx="56" cy="31" r="2" fill="#FFF" />
                      {/* Nose */}
                      <ellipse cx="50" cy="32" rx="1.5" ry="2" fill="#CD853F" />
                      {/* Mouth */}
                      <path
                        d="M 46 36 Q 50 39 54 36"
                        stroke="#8B4513"
                        strokeWidth="1.5"
                        fill="none"
                      />
                      {/* Body - Striped Shirt */}
                      <rect
                        x="35"
                        y="48"
                        width="30"
                        height="45"
                        rx="8"
                        fill="#FFFFFF"
                        stroke="#000"
                        strokeWidth="2"
                      />
                      {/* Stripes */}
                      <rect x="35" y="50" width="30" height="3" fill="#000" />
                      <rect x="35" y="58" width="30" height="3" fill="#000" />
                      <rect x="35" y="66" width="30" height="3" fill="#000" />
                      <rect x="35" y="74" width="30" height="3" fill="#000" />
                      <rect x="35" y="82" width="30" height="3" fill="#000" />
                      {/* Arms */}
                      <rect
                        x="28"
                        y="55"
                        width="8"
                        height="25"
                        rx="4"
                        fill="#D2B48C"
                      />
                      <rect
                        x="64"
                        y="55"
                        width="8"
                        height="25"
                        rx="4"
                        fill="#D2B48C"
                      />
                      {/* Hands */}
                      <circle cx="32" cy="85" r="4" fill="#D2B48C" />
                      <circle cx="68" cy="85" r="4" fill="#D2B48C" />
                      {/* Money Bag */}
                      <rect
                        x="25"
                        y="75"
                        width="8"
                        height="12"
                        rx="2"
                        fill="#8B4513"
                        stroke="#000"
                        strokeWidth="1"
                      />
                      <rect x="26" y="77" width="6" height="1" fill="#000" />
                      <rect x="26" y="79" width="6" height="1" fill="#000" />
                      <rect x="26" y="81" width="6" height="1" fill="#000" />
                    </svg>
                  </div>
                </div>
                <div
                  className={`px-4 py-3 rounded-xl border transition-all duration-300 ${
                    selectedJudges.judge_4
                      ? "bg-gray-700/50 border-gray-500 shadow-lg"
                      : "bg-gray-800/30 border-gray-600"
                  }`}
                >
                  <div
                    className={`text-sm font-bold ${
                      selectedJudges.judge_4 ? "text-white" : "text-gray-400"
                    }`}
                  >
                    Bro
                  </div>
                  <div
                    className={`text-xs ${
                      selectedJudges.judge_4 ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Cost & Efficiency
                  </div>
                </div>
                <button
                  onClick={() => toggleJudge("judge_4")}
                  className={`mt-3 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                    selectedJudges.judge_4
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600"
                  }`}
                >
                  {selectedJudges.judge_4 ? "Selected" : "Select"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Courtroom Desk - Top Down View */}
        <div className="relative mb-8">
          {/* Dark Brown Wooden Desk Surface - More Square */}
          <div className="bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900 rounded-lg p-8 shadow-2xl relative overflow-hidden max-w-6xl mx-auto">
            {/* Darker wood grain texture */}
            <div className="absolute inset-0 opacity-30">
              <div className="w-full h-full" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='wood' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 50 Q 25 30 50 50 T 100 50' stroke='%238B4513' stroke-width='2' fill='none' opacity='0.4'/%3E%3Cpath d='M0 60 Q 25 40 50 60 T 100 60' stroke='%23A0522D' stroke-width='1' fill='none' opacity='0.3'/%3E%3Cpath d='M0 70 Q 25 50 50 70 T 100 70' stroke='%238B4513' stroke-width='1.5' fill='none' opacity='0.35'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23wood)'/%3E%3C/svg%3E")`,
              }} />
            </div>
            
            {/* Desk edge shadow */}
            <div className="absolute inset-0 rounded-lg shadow-inner"></div>
            
            {/* Present Evidence Title */}
            <h2 className="text-3xl font-bold text-white mb-8 text-center drop-shadow-lg relative z-10">
              Present Evidence
            </h2>
            
            {/* Papers on Desk */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Paper 1 - File Upload */}
              <div className="relative">
                {/* Paper shadow */}
                <div className="absolute -bottom-2 -right-2 w-full h-full bg-gray-800 rounded-lg transform rotate-1"></div>
                {/* Paper */}
                <div className="relative bg-white rounded-lg p-6 shadow-lg transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                  {/* Paper lines */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="w-full h-full" style={{
                      backgroundImage: `repeating-linear-gradient(transparent, transparent 24px, #e5e7eb 24px, #e5e7eb 25px)`,
                    }} />
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload</h3>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".py,.js,.ts,.java,.cpp,.c,.h,.hpp,.cs,.php,.rb,.go,.rs,.kt,.swift,.scala,.r,.m,.pl,.sh,.sql,.html,.css,.xml,.json,.yaml,.yml,.md,.txt"
                      onChange={handleFileUpload}
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-all duration-300 group"
                    >
                      <svg
                        className="w-8 h-8 mb-2 text-gray-400 group-hover:text-gray-600 transition-colors duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-300">
                        Click to upload files
                      </p>
                    </label>
                  </div>
                </div>
              </div>

              {/* Paper 2 - Large Code Writing Area */}
              <div className="relative lg:col-span-2">
                {/* Paper shadow */}
                <div className="absolute -bottom-2 -right-2 w-full h-full bg-gray-800 rounded-lg transform -rotate-1"></div>
                {/* Paper */}
                <div className="relative bg-white rounded-lg p-6 shadow-lg transform rotate-1 hover:rotate-0 transition-transform duration-300 h-full">
                  {/* Paper lines */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="w-full h-full" style={{
                      backgroundImage: `repeating-linear-gradient(transparent, transparent 24px, #e5e7eb 24px, #e5e7eb 25px)`,
                    }} />
                  </div>
                  
                  <div className="relative z-10 h-full flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Write</h3>
                    <div className="flex-1 flex flex-col space-y-3">
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full max-w-xs bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
                      >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                      </select>
                      <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="flex-1 w-full p-4 bg-white text-gray-800 border border-gray-300 rounded font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none transition-all duration-200"
                        placeholder="// Write your code here..."
                        style={{
                          fontFamily: "monospace",
                          lineHeight: "1.6",
                          minHeight: "400px",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pen on the right side */}
            <div className="absolute top-8 right-8 z-20">
              <div className="relative">
                {/* Pen shadow */}
                <div className="absolute top-1 left-1 w-2 h-16 bg-gray-800 rounded-full transform rotate-12"></div>
                {/* Pen */}
                <div className="relative w-2 h-16 bg-gradient-to-b from-gray-600 to-gray-800 rounded-full transform rotate-12 shadow-lg">
                  {/* Pen tip */}
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-gray-900 rounded-full"></div>
                  {/* Pen clip */}
                  <div className="absolute top-2 -left-1 w-1 h-8 bg-gray-700 rounded-full"></div>
                </div>
              </div>
            </div>
            
            {/* Submit Button - Like a Court Stamp */}
            <div className="flex justify-center mt-8 relative z-10">
              <button
                onClick={submitToSelectedJudges}
                disabled={
                  loading ||
                  (!code.trim() && !uploadedFile) ||
                  Object.values(selectedJudges).every((v) => !v)
                }
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-500 disabled:to-gray-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-105 transition-all duration-200 border-4 border-white"
              >
                {loading ? "Judges Deliberating..." : "⚖️ Present Evidence to Jury"}
              </button>
            </div>
          </div>
        </div>

        {/* Judge Verdict Display - Dark Style */}
        {verdict && (
          <div className="space-y-8">
            {/* Overall Verdict */}
            <div className="bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-600">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-6">
                  Court Verdict
                </h2>

                <div
                  className={`inline-block px-8 py-4 rounded-xl text-2xl font-bold border-2 ${getVerdictColor(
                    verdict.verdict || "UNKNOWN"
                  )}`}
                >
                  {(verdict.verdict || "UNKNOWN").replace("_", " ")}
                </div>

                <div className="mt-6">
                  <span className="text-2xl font-semibold text-gray-300">
                    Score:{" "}
                  </span>
                  <span
                    className={`text-3xl font-bold ${getScoreColor(
                      verdict.overall_score || 0
                    )}`}
                  >
                    {verdict.overall_score || 0}/10
                  </span>
                </div>

                <div className="mt-4 text-gray-400">
                  <p className="text-sm">Case ID: {verdict.case_id}</p>
                  <p className="italic text-gray-300">{verdict.summary}</p>
                </div>
              </div>
            </div>

            {/* Individual Judge Analysis */}
            {verdict.judges.map((judge, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-600"
              >
                {/* Judge Header */}
                <div className="flex items-center space-x-6 mb-8">
                  <div className="text-5xl">
                    {judge.judge_id === "judge_1"
                      ? "👨‍⚖️"
                      : judge.judge_id === "judge_2"
                      ? "👩‍⚖️"
                      : judge.judge_id === "judge_3"
                      ? "🛡️"
                      : "⚡"}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white">
                      {judge.judge_id === "judge_1"
                        ? "Bob"
                        : judge.judge_id === "judge_2"
                        ? "Bobby"
                        : judge.judge_id === "judge_3"
                        ? "Bobert"
                        : "Bro"}{" "}
                      - {judge.judge_name.split(" - ")[1]}
                    </h3>
                    <p className="text-gray-300 text-lg">
                      {judge.judge_id === "judge_1"
                        ? "Prompt Engineering Specialist"
                        : judge.judge_id === "judge_2"
                        ? "Database Optimization Expert"
                        : judge.judge_id === "judge_3"
                        ? "Security & Safety Auditor"
                        : "Cost & Efficiency Analyst"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-4 py-2 rounded-lg text-lg font-semibold border-2 ${getVerdictColor(
                        judge.verdict || "UNKNOWN"
                      )}`}
                    >
                      {(judge.verdict || "UNKNOWN").replace("_", " ")}
                    </span>
                    <div className="mt-2">
                      <span className="text-lg font-semibold text-gray-300">
                        Score:{" "}
                      </span>
                      <span
                        className={`text-2xl font-bold ${getScoreColor(
                          judge.score || 0
                        )}`}
                      >
                        {judge.score || 0}/10
                      </span>
                    </div>
                  </div>
                </div>

                {/* Analysis */}
                <div className="mb-8 p-6 bg-gray-900 rounded-xl border border-gray-500">
                  <h4 className="font-semibold text-white mb-4 text-lg">
                    Analysis
                  </h4>
                  <div className="text-gray-300 text-sm leading-relaxed">
                    {judge.reasoning.split("\n").slice(0, 3).join("\n")}
                  </div>
                </div>

                {/* Issues Found */}
                {judge.issues.length > 0 && (
                  <div className="mb-8">
                    <h4 className="font-semibold text-white mb-4 text-lg">
                      Top Issues ({Math.min(judge.issues.length, 3)})
                    </h4>
                    <ul className="space-y-3">
                      {judge.issues.slice(0, 3).map((issue, i) => (
                        <li
                          key={i}
                          className="p-4 bg-red-900/30 rounded-lg border-l-4 border-red-400 text-red-200 text-sm"
                        >
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Advice */}
                <div className="p-6 bg-blue-900/30 rounded-xl border border-blue-400">
                  <h4 className="font-semibold text-blue-200 mb-3 text-lg">
                    {judge.judge_id === "judge_1"
                      ? "Bob"
                      : judge.judge_id === "judge_2"
                      ? "Bobby"
                      : judge.judge_id === "judge_3"
                      ? "Bobert"
                      : "Bro"}{" "}
                    Advice
                  </h4>
                  <p className="text-blue-100">
                    {judge.advice || "No specific advice provided"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dark Footer */}
        <div className="mt-12 text-center">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-600">
            <div className="text-gray-300">
              <p className="text-lg font-semibold">
                Opik Powered Evaluation System
              </p>
              <p className="text-sm mt-2 text-gray-400">
                All LLM calls tracked and analyzed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gemini Chatbot - Dark Corner */}
      <div className="fixed bottom-4 right-4 z-50">
        {/* Chat Toggle Button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 rounded-full shadow-lg transform hover:scale-110 transition-all duration-200"
        >
          🤖
        </button>

        {/* Chat Window */}
        {chatOpen && (
          <div className="absolute bottom-16 right-0 w-80 h-96 bg-gray-800 rounded-xl shadow-2xl border border-gray-600 p-4">
            <div className="h-full flex flex-col">
              {/* Chat Header */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-500">
                <h3 className="text-white font-semibold">Gemini Chat</h3>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Chat Response */}
              <div className="flex-1 mb-3 p-3 bg-gray-900 rounded-lg border border-gray-500 overflow-y-auto">
                <div className="text-gray-300 text-sm">
                  {chatLoading
                    ? "Thinking..."
                    : chatResponse || "Ask me anything!"}
                </div>
              </div>

              {/* Chat Input */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendGeminiMessage()}
                  placeholder="Type message..."
                  className="w-full p-3 bg-gray-700 text-white border border-gray-500 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-300"
                />
                <button
                  onClick={sendGeminiMessage}
                  disabled={chatLoading || !chatMessage.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  {chatLoading ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
