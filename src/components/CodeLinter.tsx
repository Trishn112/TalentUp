import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Lightbulb, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

interface LinterIssue {
  line: number;
  column?: number;
  severity: 'error' | 'warning';
  message: string;
  suggestion: string;
}

interface CodeLinterProps {
  code: string;
  language: string;
  onIssuesFound?: (count: number) => void;
}

export default function CodeLinter({ code, language, onIssuesFound }: CodeLinterProps) {
  const [issues, setIssues] = useState<LinterIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastLintedCode, setLastLintedCode] = useState("");

  useEffect(() => {
    if (!code || code.trim().length < 10 || code === lastLintedCode) return;

    const timer = setTimeout(() => {
      lintCode();
    }, 2500); // Debounce for 2.5 seconds to avoid excessive API calls

    return () => clearTimeout(timer);
  }, [code, language]);

  const lintCode = async () => {
    if (!code.trim() || language === "General") return;
    
    setLoading(true);
    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Lint this ${language} code and provide a list of errors, warnings, and style suggestions. 
        Focus on syntax errors, best practices, and potential bugs.
        
        Code:
        ${code}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              issues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    line: { type: Type.NUMBER },
                    column: { type: Type.NUMBER },
                    severity: { type: Type.STRING, enum: ["error", "warning"] },
                    message: { type: Type.STRING },
                    suggestion: { type: Type.STRING }
                  },
                  required: ["line", "severity", "message", "suggestion"]
                }
              }
            }
          }
        }
      });

      const text = result.text;
      if (text) {
        try {
          const cleanedText = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
          const parsed = JSON.parse(cleanedText);
          const foundIssues = parsed.issues || [];
          setIssues(foundIssues);
          setLastLintedCode(code);
          if (onIssuesFound) onIssuesFound(foundIssues.length);
        } catch (e) {
          console.error("Linter parse error:", e);
        }
      }
    } catch (error) {
      console.error("Linter API error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && issues.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-black/40 dark:text-white/40 py-4 animate-pulse">
        <Sparkles size={14} className="text-orange-500" />
        <span>AI is analyzing your code for errors...</span>
      </div>
    );
  }

  if (issues.length === 0 && !loading) return null;

  return (
    <div className="space-y-3 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40 flex items-center gap-2">
          <Sparkles size={14} className="text-orange-500" />
          AI Linter Suggestions
        </h5>
        {loading && <Loader2 size={12} className="animate-spin text-orange-500" />}
      </div>
      
      <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {issues.map((issue, i) => (
          <div 
            key={i} 
            className={`p-3 rounded-xl border flex gap-3 items-start transition-all hover:scale-[1.01] ${
              issue.severity === 'error' 
                ? 'bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400' 
                : 'bg-orange-500/5 border-orange-500/20 text-orange-600 dark:text-orange-400'
            }`}
          >
            <div className="mt-1">
              {issue.severity === 'error' ? (
                <AlertCircle size={16} className="shrink-0" />
              ) : (
                <AlertTriangle size={16} className="shrink-0" />
              )}
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  Line {issue.line}
                </span>
                <p className="text-sm font-semibold leading-tight">{issue.message}</p>
              </div>
              {issue.suggestion && (
                <div className="flex items-start gap-2 text-xs opacity-90 italic">
                  <Lightbulb size={12} className="mt-0.5 shrink-0 text-orange-500" />
                  <p>{issue.suggestion}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
