import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Send, Loader2, RefreshCw, Star, User, Bot, Code2, ChevronRight, ChevronLeft, ArrowLeft, Copy, Trash2, Maximize2, Minimize2, AlignLeft } from "lucide-react";
import { startInterviewChat } from "../services/aiService";
import { db, auth } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Markdown from "react-markdown";
import Editor from "react-simple-code-editor";
import Prism from "../lib/prism";
import { formatCode, handleSmartIndent } from "../lib/editor-utils";
import CodeLinter from "./CodeLinter";

interface Message {
  role: "user" | "bot";
  text: string;
  timestamp: Date;
}

export default function MockInterview({ roadmap, onBack }: { roadmap: any; onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatInstance, setChatInstance] = useState<any>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("General");
  const [feedbackPreferences, setFeedbackPreferences] = useState<string[]>(["Clarity", "Conciseness", "Relevance"]);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [code, setCode] = useState("// Write your code here...");
  const scrollRef = useRef<HTMLDivElement>(null);

  const LANGUAGES = ["General", "JavaScript", "Python", "Java", "C++", "Go", "TypeScript"];
  const FEEDBACK_OPTIONS = ["Clarity", "Conciseness", "Relevance", "Technical Depth", "Behavioral Aspects"];

  const getPrismLang = (lang: string) => {
    const l = lang.toLowerCase();
    if (l === "javascript") return "javascript";
    if (l === "typescript") return "typescript";
    if (l === "python") return "python";
    if (l === "java") return "java";
    if (l === "c++" || l === "cpp") return "cpp";
    if (l === "go") return "go";
    return "javascript";
  };

  const toggleFeedbackPreference = (option: string) => {
    setFeedbackPreferences(prev => 
      prev.includes(option) 
        ? prev.filter(o => o !== option) 
        : [...prev, option]
    );
  };

  const startInterview = async () => {
    setLoading(true);
    setInterviewStarted(true);
    try {
      const { chat, initialMessage } = await startInterviewChat(
        roadmap.role, 
        roadmap.analysis,
        selectedLanguage,
        feedbackPreferences
      );
      setChatInstance(chat);
      setMessages([{ role: "bot", text: initialMessage, timestamp: new Date() }]);
      setSessionComplete(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roadmap) startInterview();
  }, [roadmap]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || loading || !chatInstance) return;

    const userMsg: Message = { role: "user", text: textToSend, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    if (!textOverride) setInput("");
    setLoading(true);

    try {
      const response = await chatInstance.sendMessage({ message: textToSend });
      const botMsg: Message = { role: "bot", text: response.text, timestamp: new Date() };
      setMessages((prev) => [...prev, botMsg]);

      // Check if interview is wrapping up
      if (response.text.toLowerCase().includes("thank you for your time") || 
          response.text.toLowerCase().includes("conclude our interview")) {
        setSessionComplete(true);
        saveSession();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async () => {
    try {
      await addDoc(collection(db, "interviews"), {
        uid: auth.currentUser?.uid,
        role: roadmap.role,
        messages: messages.map(m => ({ role: m.role, text: m.text })),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    // Could add a toast here
  };

  const clearCode = () => {
    if (window.confirm("Are you sure you want to clear the editor?")) {
      setCode("// Write your code here...");
    }
  };

  const handleFormatCode = () => {
    const formatted = formatCode(code);
    setCode(formatted);
  };

  if (!interviewStarted) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-black/40 dark:text-white/40 hover:text-orange-500 transition-colors font-bold text-sm uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center text-orange-500 mx-auto">
            <Bot size={40} />
          </div>
          <h2 className="text-3xl font-bold">AI Technical Interview</h2>
          <p className="text-black/50 dark:text-white/50">Ready to test your skills? Select your preferred language and let's begin.</p>
        </div>

        <div className="p-8 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-bold uppercase tracking-widest opacity-40">Select Programming Language</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-4 py-3 rounded-xl border-2 transition-all text-sm font-bold ${
                    selectedLanguage === lang
                      ? "border-orange-500 bg-orange-500/10 text-orange-500"
                      : "border-transparent bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold uppercase tracking-widest opacity-40">Feedback Focus</label>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleFeedbackPreference(option)}
                  className={`px-4 py-2 rounded-full border transition-all text-xs font-bold ${
                    feedbackPreferences.includes(option)
                      ? "border-orange-500 bg-orange-500/10 text-orange-500"
                      : "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
            <p className="text-xs text-orange-500/80 leading-relaxed">
              <strong>Note:</strong> The AI will focus on your identified skill gaps for the <strong>{roadmap.role}</strong> role while incorporating technical questions in your chosen language.
            </p>
          </div>

          <button
            onClick={startInterview}
            className="w-full py-4 rounded-2xl bg-orange-500 text-black font-bold text-lg hover:bg-orange-400 transition-all shadow-xl shadow-orange-500/20"
          >
            Start Interview
          </button>
        </div>
      </div>
    );
  }

  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="animate-spin text-orange-500" size={48} />
        <p className="text-black/50 dark:text-white/50 font-medium">Initializing AI Interviewer...</p>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto h-[calc(100vh-12rem)] flex flex-col transition-all duration-500 ${showEditor ? "w-full" : "max-w-4xl"}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/10 bg-gray-50/50 dark:bg-[#0d0d0d]/50 backdrop-blur-xl rounded-t-3xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/40 dark:text-white/40 transition-all"
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">AI Technical Interviewer</h2>
            <p className="text-black/40 dark:text-white/40 text-xs uppercase tracking-widest font-bold">Role: {roadmap.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEditor(!showEditor)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-xs font-bold uppercase tracking-widest ${
              showEditor 
                ? "bg-orange-500 text-black shadow-lg shadow-orange-500/20" 
                : "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 hover:bg-black/10 dark:hover:bg-white/10"
            }`}
          >
            <Code2 size={16} />
            {showEditor ? "Hide Editor" : "Show Editor"}
          </button>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live Session
          </div>
          <button 
            onClick={startInterview}
            className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/40 dark:text-white/40 transition-all"
            title="Restart Interview"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className={`flex flex-col border-r border-black/5 dark:border-white/10 transition-all duration-500 ${showEditor ? (isFullscreen ? "hidden" : "w-1/2") : "w-full"}`}>
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10"
          >
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      msg.role === "user" ? "bg-orange-500 text-white" : "bg-black/5 dark:bg-white/10 text-black/40 dark:text-white/60"
                    }`}>
                      {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user" 
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                        : "bg-gray-50 dark:bg-[#0d0d0d] border border-black/5 dark:border-white/10 text-black/80 dark:text-white/80"
                    }`}>
                      <div className="markdown-body">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-black/40 dark:text-white/60">
                      <Bot size={16} />
                    </div>
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#0d0d0d] border border-black/5 dark:border-white/10">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" />
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="p-6 bg-gray-50/50 dark:bg-[#0d0d0d]/50 backdrop-blur-xl border-t border-black/5 dark:border-white/10 rounded-bl-3xl">
            {sessionComplete ? (
              <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-center gap-3 text-orange-500">
                  <Star size={20} />
                  <p className="text-sm font-bold">Interview concluded. Great job!</p>
                </div>
                <button 
                  onClick={startInterview}
                  className="px-4 py-2 rounded-xl bg-orange-500 text-black text-xs font-bold hover:bg-orange-400 transition-all"
                >
                  Start New Session
                </button>
              </div>
            ) : (
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type your answer or ask for feedback..."
                  className="w-full bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-4 pr-16 text-sm text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-all resize-none h-20"
                />
                <button
                  disabled={!input.trim() || loading}
                  onClick={() => handleSend()}
                  className="absolute right-3 bottom-3 p-3 rounded-xl bg-orange-500 text-black hover:bg-orange-400 disabled:opacity-50 transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Editor Area */}
        <AnimatePresence>
          {showEditor && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className={`${isFullscreen ? "w-full" : "w-1/2"} flex flex-col bg-[#1e1e1e] rounded-br-3xl transition-all duration-500`}
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-white/60">
                    <Code2 size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">{selectedLanguage} Playground</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={copyCode}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"
                      title="Copy Code"
                    >
                      <Copy size={14} />
                    </button>
                    <button 
                      onClick={clearCode}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-red-400 transition-all"
                      title="Clear Editor"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button 
                      onClick={handleFormatCode}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-blue-400 transition-all"
                      title="Format Code"
                    >
                      <AlignLeft size={14} />
                    </button>
                    <button 
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-orange-400 transition-all"
                      title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                      {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const message = `Here is my code for review:\n\n\`\`\`${selectedLanguage.toLowerCase()}\n${code}\n\`\`\``;
                    handleSend(message);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-orange-500 text-black text-[10px] font-bold uppercase tracking-widest hover:bg-orange-400 transition-all"
                >
                  Submit Code to AI
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 code-editor-container">
                <Editor
                  value={code}
                  onValueChange={(code) => setCode(code)}
                  highlight={(code) => Prism.highlight(code, Prism.languages[getPrismLang(selectedLanguage)] || Prism.languages.javascript, getPrismLang(selectedLanguage))}
                  padding={20}
                  className="font-mono text-sm min-h-full"
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 14,
                    backgroundColor: "transparent",
                    color: "#d4d4d4",
                  }}
                  onKeyDown={(e) => handleSmartIndent(e as any, code, setCode)}
                  onPaste={() => {
                    setTimeout(() => {
                      setCode(prev => formatCode(prev));
                    }, 0);
                  }}
                  insertSpaces={true}
                  tabSize={2}
                />
                <CodeLinter code={code} language={selectedLanguage} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
