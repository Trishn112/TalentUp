import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Code2, Terminal, Play, CheckCircle2, ChevronRight, BookOpen, Trophy, ArrowLeft, Copy, Trash2, RotateCcw, AlignLeft } from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";
import Editor from "react-simple-code-editor";
import Prism from "../lib/prism";
import { formatCode, handleSmartIndent } from "../lib/editor-utils";
import CodeLinter from "./CodeLinter";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const LANGUAGES = [
  { id: "javascript", name: "JavaScript", icon: "🟨" },
  { id: "python", name: "Python", icon: "🟦" },
  { id: "java", name: "Java", icon: "☕" },
  { id: "cpp", name: "C++", icon: "🔵" },
];

const TOPICS = [
  "Arrays & Hashing",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Binary Search",
  "Linked List",
  "Trees",
  "Graphs",
  "Dynamic Programming",
];

export default function Practo({ onBack }: { onBack: () => void }) {
  const [selectedLang, setSelectedLang] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<any>(null);
  const [solution, setSolution] = useState("");
  const [feedback, setFeedback] = useState<any>(null);

  const generateProblem = async () => {
    if (!selectedLang || !selectedTopic) return;
    setLoading(true);
    setFeedback(null);
    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a LeetCode-style DSA problem for topic: ${selectedTopic} in ${selectedLang}. 
        Include: title, difficulty (Easy, Medium, Hard), description, examples, and a starter code template.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              description: { type: Type.STRING },
              examples: { type: Type.ARRAY, items: { type: Type.STRING } },
              starterCode: { type: Type.STRING },
            },
            required: ["title", "difficulty", "description", "examples", "starterCode"]
          }
        }
      });
      
      let text = result.text;
      if (!text || text === "undefined") {
        throw new Error("AI returned an empty or undefined response. Please try again.");
      }
      
      // Clean the response text in case it's wrapped in markdown code blocks
      text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      
      try {
        const parsedProblem = JSON.parse(text);
        if (!parsedProblem || typeof parsedProblem !== "object") {
          throw new Error("Invalid problem format received");
        }
        setProblem(parsedProblem);
        setSolution("");
      } catch (parseError) {
        console.error("Failed to parse problem JSON:", text);
        throw new Error("AI returned invalid JSON format for the problem");
      }
    } catch (error) {
      console.error("Error generating problem:", error);
      alert(error instanceof Error ? error.message : "Failed to generate problem. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const checkSolution = async () => {
    if (!solution) return;
    setLoading(true);
    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Evaluate this DSA solution for the problem: ${problem.title}. 
        Language: ${selectedLang}.
        Solution: ${solution}.
        Provide feedback on correctness, time complexity, and space complexity.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isCorrect: { type: Type.BOOLEAN },
              feedback: { type: Type.STRING },
              timeComplexity: { type: Type.STRING },
              spaceComplexity: { type: Type.STRING },
              improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["isCorrect", "feedback", "timeComplexity", "spaceComplexity", "improvements"]
          }
        }
      });

      let text = result.text;
      if (!text || text === "undefined") {
        throw new Error("AI returned an empty or undefined response for the evaluation.");
      }

      // Clean the response text in case it's wrapped in markdown code blocks
      text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();

      try {
        const parsedFeedback = JSON.parse(text);
        if (!parsedFeedback || typeof parsedFeedback !== "object") {
          throw new Error("Invalid feedback format received");
        }
        setFeedback(parsedFeedback);
      } catch (parseError) {
        console.error("Failed to parse feedback JSON:", text);
        throw new Error("AI returned invalid JSON format for the evaluation");
      }
    } catch (error) {
      console.error("Error checking solution:", error);
      alert(error instanceof Error ? error.message : "Failed to evaluate solution. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(solution || problem?.starterCode || "");
  };

  const clearCode = () => {
    if (window.confirm("Are you sure you want to clear the editor?")) {
      setSolution("");
    }
  };

  const resetCode = () => {
    if (window.confirm("Reset to starter code?")) {
      setSolution(problem.starterCode);
    }
  };

  const handleFormatCode = () => {
    const formatted = formatCode(solution || problem?.starterCode || "");
    setSolution(formatted);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/40 dark:text-white/40 transition-all"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Practo</h2>
            <p className="text-black/50 dark:text-white/50">Master DSA with AI-powered LeetCode-style practice.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
            <Trophy size={18} />
            <span className="font-bold">1,240 XP</span>
          </div>
        </div>
      </div>

      {!problem ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Terminal size={20} className="text-orange-500" />
                Select Language
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setSelectedLang(lang.id)}
                    className={`p-4 rounded-2xl border-2 transition-all text-center space-y-2 ${
                      selectedLang === lang.id
                        ? "border-orange-500 bg-orange-500/5"
                        : "border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 hover:border-black/10 dark:hover:border-white/10"
                    }`}
                  >
                    <span className="text-2xl">{lang.icon}</span>
                    <p className="font-bold">{lang.name}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <BookOpen size={20} className="text-orange-500" />
                Choose Topic
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {TOPICS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className={`p-4 rounded-xl border transition-all text-left flex items-center justify-between group ${
                      selectedTopic === topic
                        ? "border-orange-500 bg-orange-500/5 text-orange-500"
                        : "border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                    }`}
                  >
                    <span className="font-medium">{topic}</span>
                    <ChevronRight size={16} className={`transition-transform ${selectedTopic === topic ? "translate-x-1" : "group-hover:translate-x-1"}`} />
                  </button>
                ))}
              </div>
            </section>

            <button
              disabled={!selectedLang || !selectedTopic || loading}
              onClick={generateProblem}
              className="w-full py-4 rounded-2xl bg-orange-500 text-black font-bold text-lg hover:bg-orange-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Terminal className="animate-pulse" /> : <Play size={20} />}
              {loading ? "Generating Problem..." : "Start Practice Session"}
            </button>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-4">
              <h4 className="font-bold">Your Stats</h4>
              <div className="space-y-3">
                {[
                  { label: "Problems Solved", value: "42" },
                  { label: "Accuracy", value: "84%" },
                  { label: "Streak", value: "5 Days" },
                ].map((stat, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-black/40 dark:text-white/40">{stat.label}</span>
                    <span className="font-bold">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="p-8 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">{problem.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  problem.difficulty === "Easy" ? "bg-green-500/10 text-green-500" :
                  problem.difficulty === "Medium" ? "bg-orange-500/10 text-orange-500" :
                  "bg-red-500/10 text-red-500"
                }`}>
                  {problem.difficulty}
                </span>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-black/60 dark:text-white/60 leading-relaxed">{problem.description}</p>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-widest text-orange-500">Examples</h4>
                {problem.examples.map((ex: string, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-black/10 dark:bg-black/40 font-mono text-sm">
                    {ex}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setProblem(null)}
                className="text-sm text-black/40 dark:text-white/40 hover:text-orange-500 transition-colors"
              >
                ← Choose another problem
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-8 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <Code2 size={18} className="text-orange-500" />
                    Solution Editor
                  </h4>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={copyCode}
                      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-black/40 dark:text-white/40 hover:text-orange-500 transition-all"
                      title="Copy Code"
                    >
                      <Copy size={14} />
                    </button>
                    <button 
                      onClick={clearCode}
                      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-black/40 dark:text-white/40 hover:text-red-400 transition-all"
                      title="Clear Editor"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button 
                      onClick={resetCode}
                      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-black/40 dark:text-white/40 hover:text-blue-400 transition-all"
                      title="Reset to Starter Code"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button 
                      onClick={handleFormatCode}
                      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-black/40 dark:text-white/40 hover:text-blue-400 transition-all"
                      title="Format Code"
                    >
                      <AlignLeft size={14} />
                    </button>
                  </div>
                </div>
                <span className="text-xs font-mono text-black/40 dark:text-white/40 uppercase">{selectedLang}</span>
              </div>
              <div className="code-editor-container min-h-[400px] border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-[#1e1e1e]">
                <Editor
                  value={solution || problem.starterCode}
                  onValueChange={(code) => setSolution(code)}
                  highlight={(code) => {
                    const lang = selectedLang === "cpp" ? "cpp" : 
                                 selectedLang === "java" ? "java" : 
                                 selectedLang === "python" ? "python" : 
                                 selectedLang === "typescript" ? "typescript" :
                                 selectedLang === "go" ? "go" : "javascript";
                    return Prism.highlight(code, Prism.languages[lang] || Prism.languages.javascript, lang);
                  }}
                  padding={20}
                  className="font-mono text-sm min-h-[400px]"
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 14,
                    minHeight: "400px",
                    backgroundColor: "transparent",
                    color: "#d4d4d4",
                  }}
                  onKeyDown={(e) => handleSmartIndent(e as any, solution || problem.starterCode, setSolution)}
                  onPaste={() => {
                    setTimeout(() => {
                      setSolution(prev => formatCode(prev));
                    }, 0);
                  }}
                  insertSpaces={true}
                  tabSize={2}
                />
              </div>

              <CodeLinter code={solution || problem.starterCode} language={selectedLang} />

              <button
                disabled={loading || !solution}
                onClick={checkSolution}
                className="w-full py-4 rounded-xl bg-orange-500 text-black font-bold hover:bg-orange-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Terminal className="animate-pulse" /> : <Play size={18} />}
                {loading ? "Evaluating..." : "Run & Submit"}
              </button>

              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-6 rounded-2xl border ${
                      feedback.isCorrect ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {feedback.isCorrect ? (
                        <CheckCircle2 className="text-green-500" />
                      ) : (
                        <Terminal className="text-red-500" />
                      )}
                      <h5 className={`font-bold ${feedback.isCorrect ? "text-green-500" : "text-red-500"}`}>
                        {feedback.isCorrect ? "Accepted" : "Wrong Answer"}
                      </h5>
                    </div>
                    <p className="text-sm mb-4 opacity-80">{feedback.feedback}</p>
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono mb-4">
                      <div className="p-2 rounded bg-black/10 dark:bg-white/5">
                        <span className="opacity-40">Time:</span> {feedback.timeComplexity}
                      </div>
                      <div className="p-2 rounded bg-black/10 dark:bg-white/5">
                        <span className="opacity-40">Space:</span> {feedback.spaceComplexity}
                      </div>
                    </div>
                    {feedback.improvements?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase opacity-40">Improvements</p>
                        <ul className="text-xs space-y-1 list-disc list-inside opacity-60">
                          {feedback.improvements.map((imp: string, i: number) => (
                            <li key={i}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
