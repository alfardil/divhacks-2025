"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buildApiUrl, API_ENDPOINTS } from "@/lib/api-config";
import { Scale, Upload, Code2, CheckCircle2, AlertCircle } from "lucide-react";

interface Judge {
  id: string;
  name: string;
  title: string;
  specialty: string;
  icon: string;
}

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

const JUDGES: Judge[] = [
  {
    id: "bob",
    name: "Bob",
    title: "Prompt Quality",
    specialty: "Evaluates prompt engineering and LLM interactions",
    icon: "/favicon.ico",
  },
  {
    id: "jabby",
    name: "Jabby",
    title: "Cognitive Complexity",
    specialty: "Analyzes code complexity and maintainability",
    icon: "/favicon.ico",
  },
  {
    id: "robert",
    name: "Robert",
    title: "Security & Safety",
    specialty: "Reviews security practices and vulnerabilities",
    icon: "/favicon.ico",
  },
  {
    id: "bro",
    name: "Bro",
    title: "Code & Efficiency",
    specialty: "Assesses performance and optimization",
    icon: "/favicon.ico",
  },
];

export default function GavelPage() {
  const [selectedJudges, setSelectedJudges] = useState<string[]>([]);
  const [code, setCode] = useState(`def hello_world():
    print("Hello, World!")
    return "success"`);
  const [language, setLanguage] = useState("python");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<FrontendJuryVerdict | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedCode, setOptimizedCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const toggleJudge = (judgeId: string) => {
    setSelectedJudges((prev) =>
      prev.includes(judgeId)
        ? prev.filter((id) => id !== judgeId)
        : [...prev, judgeId]
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCode(content);
      };
      reader.readAsText(selectedFile);
    }
  };

  const submitToJury = async () => {
    if (!code.trim() || selectedJudges.length === 0) return;

    setLoading(true);
    setVerdict(null);

    try {
      // Map UI-selected judges to backend expected keys
      const selectedForBackend = {
        judge_1: selectedJudges.includes("bob"), // Prompt Quality
        judge_2: selectedJudges.includes("jabby"), // Cognitive Complexity
        judge_3: selectedJudges.includes("robert"), // Security & Safety
        judge_4: selectedJudges.includes("bro"), // Code & Efficiency
      };

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
            selectedJudges: selectedForBackend,
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

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "GOOD":
        return "text-green-400";
      case "NEEDS_IMPROVEMENT":
        return "text-yellow-400";
      case "EVALUATION_ERROR":
        return "text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-yellow-400";
    return "text-red-400";
  };

  // Ensure we never render literal escape sequences like "\n"; convert to actual newlines
  const formatMultiline = (text: string | undefined | null): string => {
    if (!text) return "";
    return text
      .replace(/\\r/g, "")
      .replace(/\\t/g, "\t")
      .replace(/\\n/g, "\n")
      .trim();
  };

  const sanitizeOptimized = (text: string): string => {
    if (!text) return "";
    const fenceStart = text.indexOf("```");
    if (fenceStart !== -1) {
      const firstNewline = text.indexOf("\n", fenceStart);
      const startIdx = firstNewline !== -1 ? firstNewline + 1 : fenceStart + 3;
      const fenceEnd = text.lastIndexOf("```");
      if (fenceEnd !== -1 && fenceEnd > startIdx) {
        return text.slice(startIdx, fenceEnd).trim();
      }
      return text.slice(startIdx).trim();
    }
    return text.trim();
  };

  // no-op mapping now that we render in <pre><code>

  const buildRecommendationsText = (): string => {
    if (!verdict) return "";
    // Concatenate advice and issues from all judges as actionable recs
    const lines: string[] = [];
    for (const j of verdict.judges) {
      if (j.advice) lines.push(`Advice from ${j.judge_name}: ${j.advice}`);
      if (j.issues && j.issues.length) {
        lines.push(`Issues from ${j.judge_name}:`);
        for (const iss of j.issues) lines.push(`- ${iss}`);
      }
    }
    return lines.join("\n");
  };

  const optimizeWithGemini = async () => {
    if (!verdict) return;
    setOptimizedCode("");
    setOptimizing(true);
    try {
      const recs = buildRecommendationsText();
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.GEMINI.OPTIMIZE_CODE),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            language,
            recommendations: recs,
          }),
        }
      );

      if (!response.body) {
        const text = await response.text();
        setOptimizedCode(text);
        setOptimizing(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setOptimizedCode((prev) => prev + chunk);
      }
    } catch (e) {
      setOptimizedCode(`Error optimizing: ${e}`);
    }
    setOptimizing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Gavel</h1>
                <p className="text-xs text-muted-foreground">LLM Court</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Code2 className="w-4 h-4" />
              <span>Powered by Opik</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Judge Selection */}
        <section className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Select Judges
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose the AI judges to evaluate your code submission
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {JUDGES.map((judge) => {
              const isSelected = selectedJudges.includes(judge.id);
              return (
                <button
                  key={judge.id}
                  onClick={() => toggleJudge(judge.id)}
                  className={`relative p-6 rounded-xl border transition-all text-left group hover:border-primary/50 ${
                    isSelected
                      ? "bg-primary/5 border-primary"
                      : "bg-card border-border hover:bg-card/80"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 mb-4 overflow-hidden">
                    <img
                      src={judge.icon || "/favicon.ico"}
                      alt={judge.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (!target.src.endsWith("/favicon.ico")) {
                          target.src = "/favicon.ico";
                        }
                      }}
                    />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {judge.name}
                  </h3>
                  <p className="text-xs font-medium text-primary mb-2">
                    {judge.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {judge.specialty}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Evidence Submission */}
        <section className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Present Evidence
            </h2>
            <p className="text-sm text-muted-foreground">
              Upload a file or write code directly for evaluation
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">Upload File</h3>
              </div>
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Python, JavaScript, TypeScript, Java, C++
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".py,.js,.ts,.java,.cpp,.cc,.txt"
                  onChange={handleFileUpload}
                />
              </label>
              {file && (
                <div className="mt-4 p-3 bg-secondary rounded-lg border border-border">
                  <p className="text-sm text-foreground font-medium">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}
            </div>

            {/* Code Editor Section */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Write Code</h3>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-48 p-4 bg-secondary border border-border rounded-lg font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="Enter your code here..."
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <Button
              onClick={submitToJury}
              disabled={loading || !code.trim() || selectedJudges.length === 0}
              size="lg"
              className="px-8"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Scale className="w-4 h-4 mr-2" />
                  Present Evidence to Jury
                </>
              )}
            </Button>
          </div>
        </section>

        {/* Verdict Display */}
        {verdict && (
          <section className="space-y-6">
            {/* Overall Verdict */}
            <div className="bg-card border border-border rounded-xl p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
                  <Scale className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Court Verdict
                </h2>
                <div
                  className={`inline-block px-6 py-2 rounded-full text-lg font-semibold border ${
                    verdict.verdict === "GOOD"
                      ? "bg-green-500/10 border-green-500/20 text-green-400"
                      : verdict.verdict === "NEEDS_IMPROVEMENT"
                      ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}
                >
                  {verdict.verdict.replace("_", " ")}
                </div>
                <div className="mt-6 flex items-center justify-center gap-2">
                  <span className="text-lg text-muted-foreground">
                    Overall Score:
                  </span>
                  <span
                    className={`text-4xl font-bold ${getScoreColor(
                      verdict.overall_score
                    )}`}
                  >
                    {verdict.overall_score}
                    <span className="text-2xl text-muted-foreground">/10</span>
                  </span>
                </div>
                {/* Case ID intentionally omitted */}
                {verdict.summary && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto whitespace-pre-wrap">
                    {formatMultiline(verdict.summary)}
                  </p>
                )}
              </div>
            </div>

            {/* Judge Verdicts */}
            <div className="grid lg:grid-cols-2 gap-6">
              {verdict.judges.map((judge, index) => {
                // Map backend judge IDs to UI judge IDs for display assets/text
                const backendToUiId: Record<string, string> = {
                  judge_1: "bob",
                  judge_2: "jabby",
                  judge_3: "robert",
                  judge_4: "bro",
                };
                const mappedId =
                  backendToUiId[judge.judge_id] || judge.judge_id;
                const judgeInfo = JUDGES.find((j) => j.id === mappedId);
                return (
                  <div
                    key={index}
                    className="bg-card border border-border rounded-xl p-6"
                  >
                    {/* Judge Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex-shrink-0 overflow-hidden">
                          <img
                            src={judgeInfo?.icon || "/favicon.ico"}
                            alt={judge.judge_name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target =
                                e.currentTarget as HTMLImageElement;
                              if (!target.src.endsWith("/favicon.ico")) {
                                target.src = "/favicon.ico";
                              }
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {judge.judge_name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {judgeInfo?.title || "Judge"}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          judge.verdict === "GOOD"
                            ? "bg-green-500/10 border-green-500/20 text-green-400"
                            : judge.verdict === "NEEDS_IMPROVEMENT"
                            ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                            : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}
                      >
                        {judge.verdict.replace("_", " ")}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="mb-6 pb-6 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Score:
                        </span>
                        <span
                          className={`text-2xl font-bold ${getScoreColor(
                            judge.score
                          )}`}
                        >
                          {judge.score}
                          <span className="text-lg text-muted-foreground">
                            /10
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Reasoning */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-primary" />
                        Analysis
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {formatMultiline(judge.reasoning)}
                      </p>
                    </div>

                    {/* Issues */}
                    {judge.issues.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-red-400 mb-3">
                          Issues Found ({judge.issues.length})
                        </h4>
                        <ul className="space-y-2">
                          {judge.issues.map((issue, i) => (
                            <li
                              key={i}
                              className="text-sm text-muted-foreground p-3 bg-red-500/5 border border-red-500/10 rounded-lg"
                            >
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Advice */}
                    {judge.advice && (
                      <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg">
                        <h4 className="text-sm font-semibold text-primary mb-2">
                          Recommendation
                        </h4>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {formatMultiline(judge.advice)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Optimize CTA */}
        {verdict && (
          <div className="mt-4 flex items-center justify-center">
            <Button
              onClick={optimizeWithGemini}
              disabled={optimizing}
              size="lg"
              className="px-8"
            >
              {optimizing ? "Optimizing..." : "Optimize"}
            </Button>
          </div>
        )}

        {/* Optimized Code Output */}
        {optimizedCode && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-foreground">
                Optimized Code
              </h3>
              <button
                className="text-xs px-3 py-1 rounded border border-border hover:bg-card/60"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      sanitizeOptimized(optimizedCode)
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  } catch {}
                }}
                disabled={optimizing}
                title={
                  optimizing
                    ? "Wait for streaming to finish"
                    : "Copy to clipboard"
                }
              >
                {optimizing ? "Copy (disabled)" : copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm bg-card border border-border rounded-lg p-4 overflow-auto">
              <code
                className={`language-${
                  language === "cpp"
                    ? "cpp"
                    : language === "typescript"
                    ? "ts"
                    : language === "javascript"
                    ? "js"
                    : language
                }`}
              >
                {sanitizeOptimized(optimizedCode)}
              </code>
            </pre>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Opik Powered Evaluation System • All LLM calls tracked and analyzed
          </p>
        </div>
      </footer>
    </div>
  );
}
