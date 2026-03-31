import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Code2, Terminal, Play, CheckCircle2, ChevronRight, BookOpen, Trophy, ArrowLeft, Copy, Trash2, RotateCcw, AlignLeft, ChevronLeft, XCircle, User, Flame, Target } from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";
import Editor from "react-simple-code-editor";
import Prism from "../lib/prism";
import { formatCode, handleSmartIndent } from "../lib/editor-utils";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const LANGUAGES = [
  { id: "javascript", name: "JavaScript", icon: "🟨", prism: "javascript" },
  { id: "python", name: "Python", icon: "🟦", prism: "python" },
  { id: "java", name: "Java", icon: "☕", prism: "java" },
  { id: "cpp", name: "C++", icon: "🔵", prism: "cpp" },
];

const TOPICS = [
  "Arrays & Hashing", "Two Pointers", "Sliding Window",
  "Stack", "Binary Search", "Linked List",
  "Trees", "Graphs", "Dynamic Programming",
];

const STARTER_CODE: Record<string, string> = {
  javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var solve = function(nums) {
  // Write your solution here
  
};`,
  python: `class Solution:
    def solve(self, nums: list[int]) -> int:
        # Write your solution here
        pass`,
  java: `class Solution {
    public int solve(int[] nums) {
        // Write your solution here
        return 0;
    }
}`,
  cpp: `class Solution {
public:
    int solve(vector<int>& nums) {
        // Write your solution here
        return 0;
    }
};`,
};

interface TestCase {
  input: string;
  expected: string;
  actual?: string;
  passed?: boolean;
}

interface Problem {
  title: string;
  difficulty: string;
  description: string;
  examples: string[];
  starterCode: string;
  testCases: TestCase[];
}

interface UserStats {
  problemsSolved: number;
  accuracy: number;
  streak: number;
  xp: number;
  totalAttempts: number;
}

export default function Practo({ onBack }: { onBack: () => void }) {
  const [user] = useAuthState(auth);
  const [selectedLang, setSelectedLang] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [solution, setSolution] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [testResults, setTestResults] = useState<TestCase[]>([]);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [solvedCount, setSolvedCount] = useState(0);
  const [userStats, setUserStats] = useState<UserStats>({
    problemsSolved: 0, accuracy: 0, streak: 0, xp: 0, totalAttempts: 0
  });
  const [activeTab, setActiveTab] = useState<"description" | "testcases" | "results">("description");

  // Load user stats from Firestore
  useEffect(() => {
    if (!user) return;
    const loadStats = async () => {
      try {
        const ref = doc(db, "users", user.uid, "practoStats", "main");
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserStats(snap.data() as UserStats);
        }
      } catch (e) {
        console.error("Failed to load stats", e);
      }
    };
    loadStats();
  }, [user]);

  const saveStats = async (updates: Partial<UserStats>) => {
    if (!user) return;
    try {
      const ref = doc(db, "users", user.uid, "practoStats", "main");
      await setDoc(ref, { ...userStats, ...updates }, { merge: true });
      setUserStats(prev => ({ ...prev, ...updates }));
    } catch (e) {
      console.error("Failed to save stats", e);
    }
  };

  const generateProblem = async () => {
    if (!selectedLang || !selectedTopic) return;
    setLoading(true);
    setFeedback(null);
    setTestResults([]);
    setActiveTab("description");
    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Generate a LeetCode-style DSA problem for topic: ${selectedTopic} in ${selectedLang}.
        Question number ${questionNumber} of 10.
        Include:
        - title
        - difficulty (Easy, Medium, or Hard)
        - description (clear problem statement)
        - examples (3 examples as strings like "Input: nums = [1,2,3], k = 2 | Output: [1,2] | Explanation: ...")
        - starterCode (valid ${selectedLang} function template)
        - testCases (exactly 10 test cases with input and expected output as strings)
        Make it different from common problems, be creative.`,
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
              testCases: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    input: { type: Type.STRING },
                    expected: { type: Type.STRING },
                  },
                  required: ["input", "expected"]
                }
              }
            },
            required: ["title", "difficulty", "description", "examples", "starterCode", "testCases"]
          }
        }
      });

      let text = result.text ?? "";
      text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      const parsed = JSON.parse(text);
      setProblem(parsed);
      setSolution(parsed.starterCode || STARTER_CODE[selectedLang] || "");
    } catch (error) {
      console.error("Error generating problem:", error);
      alert("Failed to generate problem. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const runTests = async () => {
    if (!solution || !problem) return;
    setLoading(true);
    setActiveTab("results");
    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Evaluate this ${selectedLang} solution for: "${problem.title}".
        Solution:
        ${solution}
        
        Run against these 10 test cases and determine if each passes:
        ${JSON.stringify(problem.testCases)}
        
        For each test case, simulate the execution and determine the actual output.`,
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
              testResults: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    input: { type: Type.STRING },
                    expected: { type: Type.STRING },
                    actual: { type: Type.STRING },
                    passed: { type: Type.BOOLEAN },
                  },
                  required: ["input", "expected", "actual", "passed"]
                }
              }
            },
            required: ["isCorrect", "feedback", "timeComplexity", "spaceComplexity", "improvements", "testResults"]
          }
        }
      });

      let text = result.text ?? "";
      text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      const parsed = JSON.parse(text);
      setFeedback(parsed);
      setTestResults(parsed.testResults || []);

      // Update stats if correct
      if (parsed.isCorrect && user) {
        const newSolved = userStats.problemsSolved + 1;
        const newAttempts = userStats.totalAttempts + 1;
        const newXp = userStats.xp + (problem.difficulty === "Easy" ? 50 : problem.difficulty === "Medium" ? 100 : 150);
        const newAccuracy = Math.round((newSolved / newAttempts) * 100);
        await saveStats({
          problemsSolved: newSolved,
          totalAttempts: newAttempts,
          xp: newXp,
          accuracy: newAccuracy,
          streak: userStats.streak + 1,
        });
        setSolvedCount(prev => prev + 1);
      } else if (user) {
        await saveStats({ totalAttempts: userStats.totalAttempts + 1 });
      }
    } catch (error) {
      console.error("Error checking solution:", error);
      alert("Failed to evaluate solution. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = async () => {
    if (questionNumber >= 10) {
      alert(`🎉 Session Complete! You solved ${solvedCount}/10 problems. Great job!`);
      setProblem(null);
      setQuestionNumber(1);
      setSolvedCount(0);
      return;
    }
    setQuestionNumber(prev => prev + 1);
    setProblem(null);
    setFeedback(null);
    setTestResults([]);
    setSolution("");
    await generateProblem();
  };

  const getLangConfig = () => LANGUAGES.find(l => l.id === selectedLang);

  const passedCount = testResults.filter(t => t.passed).length;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/40 dark:text-white/40 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Practo</h2>
            <p className="text-black/50 dark:text-white/50">Master DSA with AI-powered LeetCode-style practice.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {problem && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
              <span className="text-sm font-medium text-black/50 dark:text-white/50">Question</span>
              <span className="font-bold text-orange-500">{questionNumber}/10</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
            <Trophy size={18} />
            <span className="font-bold">{userStats.xp.toLocaleString()} XP</span>
          </div>
        </div>
      </div>

      {!problem ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Language Selection */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Terminal size={20} className="text-orange-500" /> Select Language
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {LANGUAGES.map((lang) => (
                  <button key={lang.id} onClick={() => setSelectedLang(lang.id)}
                    className={`p-4 rounded-2xl border-2 transition-all text-center space-y-2 ${selectedLang === lang.id ? "border-orange-500 bg-orange-500/5" : "border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 hover:border-orange-500/30"}`}>
                    <span className="text-2xl">{lang.icon}</span>
                    <p className="font-bold text-sm">{lang.name}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Topic Selection */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <BookOpen size={20} className="text-orange-500" /> Choose Topic
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {TOPICS.map((topic) => (
                  <button key={topic} onClick={() => setSelectedTopic(topic)}
                    className={`p-4 rounded-xl border transition-all text-left flex items-center justify-between group ${selectedTopic === topic ? "border-orange-500 bg-orange-500/5 text-orange-500" : "border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"}`}>
                    <span className="font-medium">{topic}</span>
                    <ChevronRight size={16} className={`transition-transform ${selectedTopic === topic ? "translate-x-1" : "group-hover:translate-x-1"}`} />
                  </button>
                ))}
              </div>
            </section>

            <button disabled={!selectedLang || !selectedTopic || loading} onClick={generateProblem}
              className="w-full py-4 rounded-2xl bg-orange-500 text-black font-bold text-lg hover:bg-orange-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {loading ? <Terminal className="animate-pulse" /> : <Play size={20} />}
              {loading ? "Generating Problem..." : "Start Practice Session (10 Questions)"}
            </button>
          </div>

          {/* Stats Panel */}
          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-5">
              <div className="flex items-center gap-3">
                {user?.photoURL ? (
                  <img src={user.photoURL} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                    <User size={20} className="text-black" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-sm">{user?.displayName || "Guest"}</p>
                  <p className="text-xs text-black/40 dark:text-white/40">Your Progress</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Problems Solved", value: userStats.problemsSolved, icon: <CheckCircle2 size={14} className="text-green-500" /> },
                  { label: "Accuracy", value: `${userStats.accuracy}%`, icon: <Target size={14} className="text-blue-500" /> },
                  { label: "Streak", value: `${userStats.streak} Days`, icon: <Flame size={14} className="text-orange-500" /> },
                  { label: "Total XP", value: userStats.xp.toLocaleString(), icon: <Trophy size={14} className="text-yellow-500" /> },
                ].map((stat, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-black/5 dark:bg-white/5">
                    <div className="flex items-center gap-2">
                      {stat.icon}
                      <span className="text-sm text-black/60 dark:text-white/60">{stat.label}</span>
                    </div>
                    <span className="font-bold text-sm">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Problem */}
          <div className="flex flex-col space-y-4">
            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
              {(["description", "testcases", "results"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? "bg-white dark:bg-white/10 text-orange-500 shadow" : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"}`}>
                  {tab === "results" && testResults.length > 0 ? `Results (${passedCount}/${testResults.length})` : tab}
                </button>
              ))}
            </div>

            <div className="p-6 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex-1 overflow-y-auto max-h-[70vh]">
              {/* Description Tab */}
              {activeTab === "description" && (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-bold leading-tight">{problem.title}</h3>
                    <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase ${problem.difficulty === "Easy" ? "bg-green-500/10 text-green-500" : problem.difficulty === "Medium" ? "bg-orange-500/10 text-orange-500" : "bg-red-500/10 text-red-500"}`}>
                      {problem.difficulty}
                    </span>
                  </div>
                  <p className="text-black/60 dark:text-white/60 leading-relaxed text-sm">{problem.description}</p>
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-widest text-orange-500">Examples</h4>
                    {problem.examples.map((ex, i) => (
                      <div key={i} className="p-4 rounded-xl bg-black/10 dark:bg-black/40 font-mono text-xs leading-relaxed whitespace-pre-wrap">{ex}</div>
                    ))}
                  </div>
                  <button onClick={() => { setProblem(null); setFeedback(null); setTestResults([]); }} className="text-sm text-black/40 dark:text-white/40 hover:text-orange-500 transition-colors">
                    ← Choose another topic
                  </button>
                </div>
              )}

              {/* Test Cases Tab */}
              {activeTab === "testcases" && (
                <div className="space-y-3">
                  <h4 className="font-bold text-sm">10 Test Cases</h4>
                  {problem.testCases.map((tc, i) => (
                    <div key={i} className="p-3 rounded-xl bg-black/10 dark:bg-black/40 space-y-1">
                      <p className="text-xs font-bold text-black/40 dark:text-white/40">Case {i + 1}</p>
                      <p className="font-mono text-xs"><span className="text-blue-400">Input:</span> {tc.input}</p>
                      <p className="font-mono text-xs"><span className="text-green-400">Expected:</span> {tc.expected}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Results Tab */}
              {activeTab === "results" && (
                <div className="space-y-4">
                  {feedback && (
                    <div className={`p-4 rounded-xl border ${feedback.isCorrect ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {feedback.isCorrect ? <CheckCircle2 className="text-green-500" size={18} /> : <XCircle className="text-red-500" size={18} />}
                        <h5 className={`font-bold ${feedback.isCorrect ? "text-green-500" : "text-red-500"}`}>
                          {feedback.isCorrect ? "✅ All Tests Passed!" : `❌ ${passedCount}/${testResults.length} Tests Passed`}
                        </h5>
                      </div>
                      <p className="text-xs text-black/60 dark:text-white/60 mb-3">{feedback.feedback}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2 rounded bg-black/10 dark:bg-white/5">⏱ {feedback.timeComplexity}</div>
                        <div className="p-2 rounded bg-black/10 dark:bg-white/5">💾 {feedback.spaceComplexity}</div>
                      </div>
                      {feedback.improvements?.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-bold uppercase opacity-40">Suggestions</p>
                          <ul className="text-xs space-y-1 list-disc list-inside opacity-60">
                            {feedback.improvements.map((imp: string, i: number) => <li key={i}>{imp}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  {testResults.map((tr, i) => (
                    <div key={i} className={`p-3 rounded-xl border ${tr.passed ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">Test {i + 1}</span>
                        {tr.passed ? <CheckCircle2 size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                      </div>
                      <p className="font-mono text-xs text-black/50 dark:text-white/50">In: {tr.input}</p>
                      <p className="font-mono text-xs text-green-400">Expected: {tr.expected}</p>
                      {!tr.passed && <p className="font-mono text-xs text-red-400">Got: {tr.actual}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Editor */}
          <div className="flex flex-col space-y-4">
            <div className="p-4 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex-1">
              {/* Editor Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h4 className="font-bold flex items-center gap-2">
                    <Code2 size={18} className="text-orange-500" /> Solution Editor
                  </h4>
                  <div className="flex items-center gap-1">
                    <button onClick={() => navigator.clipboard.writeText(solution)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-black/40 dark:text-white/40 hover:text-orange-500 transition-all" title="Copy">
                      <Copy size={14} />
                    </button>
                    <button onClick={() => { if (window.confirm("Clear editor?")) setSolution(""); }} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-black/40 dark:text-white/40 hover:text-red-400 transition-all" title="Clear">
                      <Trash2 size={14} />
                    </button>
                    <button onClick={() => { if (window.confirm("Reset to starter code?")) setSolution(problem.starterCode || STARTER_CODE[selectedLang]); }} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-black/40 dark:text-white/40 hover:text-blue-400 transition-all" title="Reset">
                      <RotateCcw size={14} />
                    </button>
                    <button onClick={() => setSolution(formatCode(solution))} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-black/40 dark:text-white/40 hover:text-blue-400 transition-all" title="Format">
                      <AlignLeft size={14} />
                    </button>
                  </div>
                </div>
                <span className="text-xs font-mono px-2 py-1 rounded-lg bg-orange-500/10 text-orange-500 uppercase font-bold">
                  {getLangConfig()?.icon} {selectedLang}
                </span>
              </div>

              {/* Code Editor */}
              <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-[#1e1e1e]" style={{ minHeight: "420px" }}>
                <div className="flex items-center gap-1.5 px-4 py-2 bg-[#2d2d2d] border-b border-white/5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  <span className="ml-2 text-xs text-white/30 font-mono">solution.{selectedLang === "cpp" ? "cpp" : selectedLang === "java" ? "java" : selectedLang === "python" ? "py" : "js"}</span>
                </div>
                <Editor
                  value={solution}
                  onValueChange={setSolution}
                  highlight={(code) => {
                    const lang = getLangConfig()?.prism || "javascript";
                    return Prism.highlight(code, Prism.languages[lang] || Prism.languages.javascript, lang);
                  }}
                  padding={20}
                  style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 13, minHeight: "380px", backgroundColor: "transparent", color: "#d4d4d4", lineHeight: 1.6 }}
                  onKeyDown={(e) => handleSmartIndent(e as any, solution, setSolution)}
                  insertSpaces={true}
                  tabSize={selectedLang === "python" ? 4 : 2}
                />
              </div>

              {/* Line count info */}
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-xs text-black/30 dark:text-white/30 font-mono">
                  {solution.split("\n").length} lines · {solution.length} chars
                </span>
                <span className="text-xs text-black/30 dark:text-white/30">
                  {selectedLang === "python" ? "4 spaces" : "2 spaces"} · UTF-8
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button disabled={loading || !solution.trim()} onClick={runTests}
                className="flex-1 py-3 rounded-xl bg-orange-500 text-black font-bold hover:bg-orange-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {loading ? <Terminal className="animate-pulse" size={18} /> : <Play size={18} />}
                {loading ? "Running Tests..." : "Run All Tests"}
              </button>
              {feedback && (
                <button onClick={nextQuestion}
                  className="flex-1 py-3 rounded-xl bg-green-500 text-black font-bold hover:bg-green-400 transition-all flex items-center justify-center gap-2">
                  {questionNumber >= 10 ? "Finish Session 🎉" : `Next Question →`}
                </button>
              )}
            </div>

            {/* Progress bar */}
            {problem && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-black/40 dark:text-white/40">
                  <span>Session Progress</span>
                  <span>{questionNumber - 1}/10 done · {solvedCount} solved</span>
                </div>
                <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10">
                  <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${((questionNumber - 1) / 10) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
