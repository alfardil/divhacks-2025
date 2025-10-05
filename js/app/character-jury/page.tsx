"use client";

import { useState } from "react";
import { buildApiUrl, API_ENDPOINTS } from "@/lib/api-config";

interface JudgeCharacter {
  name: string;
  title: string;
  avatar: string;
  personality: string;
  verdict: string;
  score: number;
  charges: string[];
  advice: string;
  reasoning: string;
  emoji: string;
}

interface CharacterJuryVerdict {
  case_id: string;
  overall_score: number;
  total_charges: number;
  verdict: string;
  judges: JudgeCharacter[];
  recommendations: string[];
  court_notes: string;
}

export default function CharacterJuryPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<CharacterJuryVerdict | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const submitToCharacterJury = async () => {
    if (!file) return;

    setLoading(true);
    setVerdict(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        buildApiUrl(API_ENDPOINTS.CHARACTER_JURY.UPLOAD_FILE),
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      setVerdict(data);
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  const testSampleFile = async () => {
    setLoading(true);
    setVerdict(null);

    try {
      const res = await fetch(
        buildApiUrl(API_ENDPOINTS.CHARACTER_JURY.TEST_SAMPLE)
      );
      const data = await res.json();
      setVerdict(data);
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "NOT_GUILTY":
        return "text-green-600 bg-green-100";
      case "GUILTY":
        return "text-red-600 bg-red-100";
      case "ERROR":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Court Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center space-x-4">
            <div className="text-6xl">🎭</div>
            <div>
              <h1 className="text-4xl font-bold">Character Jury Court</h1>
              <p className="text-purple-200 text-lg">
                Where AI Judges with Personality Evaluate Your Code
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* File Upload Area */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            📁 Submit Your Code File
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose a code file to evaluate
              </label>
              <input
                type="file"
                accept=".py,.js,.ts,.java,.cpp,.cc,.txt"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
            </div>

            {file && (
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Selected file:</strong> {file.name} (
                  {(file.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={submitToCharacterJury}
                disabled={loading || !file}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold"
              >
                {loading
                  ? "🎭 Characters Deliberating..."
                  : "🎭 Submit to Character Jury"}
              </button>

              <button
                onClick={testSampleFile}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold"
              >
                {loading ? "🧪 Testing..." : "🧪 Test Sample File"}
              </button>
            </div>
          </div>
        </div>

        {/* Character Jury Verdict Display */}
        {verdict && (
          <div className="space-y-6">
            {/* Overall Verdict */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">🏛️ Court Verdict</h2>
                <div
                  className={`inline-block px-6 py-3 rounded-full text-2xl font-bold ${getVerdictColor(
                    verdict.verdict
                  )}`}
                >
                  {verdict.verdict.replace("_", " ")}
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-bold">Overall Score: </span>
                  <span
                    className={`text-3xl font-bold ${getScoreColor(
                      verdict.overall_score
                    )}`}
                  >
                    {verdict.overall_score}/10
                  </span>
                </div>
                <p className="text-gray-600 mt-2">Case ID: {verdict.case_id}</p>
                <p className="text-gray-600">
                  Total Charges: {verdict.total_charges}
                </p>
                <p className="text-gray-600 italic mt-2">
                  {verdict.court_notes}
                </p>
              </div>
            </div>

            {/* Character Judge Panels */}
            <div className="grid md:grid-cols-2 gap-6">
              {verdict.judges.map((judge, index) => (
                <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                  {/* Judge Header */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="text-4xl">{judge.avatar}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {judge.name}
                      </h3>
                      <p className="text-gray-600 text-sm">{judge.title}</p>
                      <p className="text-xs text-gray-500 italic">
                        {judge.personality}
                      </p>
                    </div>
                    <span
                      className={`ml-auto px-3 py-1 rounded-full text-sm font-semibold ${getVerdictColor(
                        judge.verdict
                      )}`}
                    >
                      {judge.verdict.replace("_", " ")}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="mb-4">
                    <span className="text-lg font-semibold">Score: </span>
                    <span
                      className={`text-xl font-bold ${getScoreColor(
                        judge.score
                      )}`}
                    >
                      {judge.score}/10
                    </span>
                  </div>

                  {/* Reasoning */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-md">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      💭 Reasoning:
                    </h4>
                    <p className="text-sm text-gray-600 italic">
                      &ldquo;{judge.reasoning}&rdquo;
                    </p>
                  </div>

                  {/* Charges */}
                  {judge.charges.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-red-600 mb-2">
                        ⚖️ Charges:
                      </h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {judge.charges.map((charge, i) => (
                          <li key={i}>{charge}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Advice */}
                  <div className="p-3 bg-blue-50 rounded-md">
                    <h4 className="font-semibold text-blue-600 mb-2">
                      💡 Advice:
                    </h4>
                    <p className="text-sm text-blue-800">
                      &ldquo;{judge.advice}&rdquo;
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            {verdict.recommendations.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-blue-900 mb-4">
                  📋 Court Recommendations
                </h3>
                <ul className="space-y-2">
                  {verdict.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span className="text-blue-800">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
