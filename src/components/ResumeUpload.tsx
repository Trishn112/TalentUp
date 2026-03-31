import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, CheckCircle, Loader2, Target, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { analyzeResume } from "../services/aiService";
import { db, auth } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function ResumeUpload({ 
  onComplete, 
  initialRole = "" 
}: { 
  onComplete: (data: any) => void;
  initialRole?: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState(initialRole);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // Update role if initialRole changes
  React.useEffect(() => {
    if (initialRole) setRole(initialRole);
  }, [initialRole]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    multiple: false,
  });

  const handleAnalyze = async () => {
    if (!file || !role) return;

    setLoading(true);
    setStatus("Parsing resume...");

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const token = await auth.currentUser?.getIdToken();
      const parseRes = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!parseRes.ok) throw new Error("Failed to parse resume");
      const { text } = await parseRes.json();

      setStatus("AI Analysis in progress...");
      const analysisData = await analyzeResume(text, role);

      setStatus("Saving roadmap...");
      const roadmapDoc = {
        uid: auth.currentUser?.uid,
        role,
        analysis: analysisData.analysis,
        steps: analysisData.roadmap,
        progress: {},
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "roadmaps"), roadmapDoc);
      onComplete({ id: docRef.id, ...roadmapDoc });
    } catch (error) {
      console.error(error);
      setStatus("Error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 py-12 transition-colors duration-300">
      <div className="text-center space-y-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tight"
        >
          AI Career Mirror
        </motion.h2>
        <p className="text-black/50 dark:text-white/50 text-lg">Upload your resume and define your target role to find your skill gaps.</p>
      </div>

      <div className="space-y-6">
        {/* Role Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-black/60 dark:text-white/60 flex items-center gap-2">
            <Target size={14} /> Target Role
          </label>
          <input
            type="text"
            placeholder="e.g. Senior Full Stack Developer"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-black dark:text-white placeholder:text-black/20 dark:placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-colors"
          />
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-12 transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
            isDragActive ? "border-orange-500 bg-orange-500/5" : "border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 hover:bg-black/5 dark:hover:bg-white/5"
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-black/40 dark:text-white/40 group-hover:text-orange-500 group-hover:bg-orange-500/10 transition-all">
            {file ? <CheckCircle size={32} className="text-orange-500" /> : <Upload size={32} />}
          </div>
          <div className="text-center">
            <p className="text-lg font-medium">{file ? file.name : "Drop your resume here"}</p>
            <p className="text-sm text-black/40 dark:text-white/40">PDF or DOCX (Max 5MB)</p>
          </div>
        </div>

        {/* Action Button */}
        <button
          disabled={!file || !role || loading}
          onClick={handleAnalyze}
          className="w-full py-4 rounded-xl bg-orange-500 text-black font-bold hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg shadow-xl shadow-orange-500/20"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>{status}</span>
            </>
          ) : (
            <>
              <span>Generate Career Mirror</span>
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-black/5 dark:border-white/5">
        {[
          { title: "Deep NLP Analysis", desc: "AI scans every word to find hidden strengths." },
          { title: "Skill Gap Report", desc: "Identify exactly what's missing for your role." },
          { title: "Learning Roadmap", desc: "Step-by-step guide with curated resources." },
        ].map((feat, i) => (
          <div key={i} className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
            <h4 className="font-semibold mb-1">{feat.title}</h4>
            <p className="text-xs text-black/40 dark:text-white/40 leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

