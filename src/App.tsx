import React, { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db, signIn } from "./firebase";
import { collection, query, where, orderBy, limit, onSnapshot, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { generateRoadmapForRole } from "./services/aiService";
import Layout from "./components/Layout";
import ResumeUpload from "./components/ResumeUpload";
import Dashboard from "./components/Dashboard";
import Roadmap from "./components/Roadmap";
import MockInterview from "./components/MockInterview";
import ExploreRoadmaps from "./components/ExploreRoadmaps";
import Practo from "./components/Practo";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Briefcase, Sparkles, ArrowRight } from "lucide-react";

import { ThemeProvider } from "./context/ThemeContext";

export default function App() {
  const [user, loading] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState("resume");
  const [roadmap, setRoadmap] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [preSelectedRole, setPreSelectedRole] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsAuthReady(true);
    }
  }, [loading]);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, "roadmaps"),
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(1)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setRoadmap({ id: snapshot.docs[0].id, ...data });
          if (activeTab === "resume") setActiveTab("dashboard");
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handleDirectGeneration = async (role: string) => {
    if (!user) return;
    setIsGenerating(true);
    try {
      const data = await generateRoadmapForRole(role);
      const roadmapDoc = {
        uid: user.uid,
        role,
        analysis: data.analysis,
        steps: data.roadmap,
        progress: {},
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "roadmaps"), roadmapDoc);
      setRoadmap({ id: docRef.id, ...roadmapDoc });
      setActiveTab("dashboard");
    } catch (error) {
      console.error("Error generating direct roadmap:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleRoadmapProgress = async (roadmapId: string, stepIndex: number, itemType: 'goal' | 'project', itemIndex: number) => {
    if (!roadmap) return;
    
    const progressKey = `${stepIndex}_${itemType}_${itemIndex}`;
    const newProgress = { ...(roadmap.progress || {}) };
    newProgress[progressKey] = !newProgress[progressKey];
    
    try {
      await updateDoc(doc(db, "roadmaps", roadmapId), {
        progress: newProgress
      });
    } catch (error) {
      console.error("Error updating roadmap progress:", error);
    }
  };

  if (!isAuthReady || isGenerating) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] dark:bg-[#0a0a0a] flex flex-col items-center justify-center space-y-6">
        <Loader2 className="animate-spin text-orange-500" size={48} />
        {isGenerating && (
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold">Generating Your Roadmap...</h3>
            <p className="text-white/40">AI is crafting a personalized path for you.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <ThemeProvider>
      {user ? (
        <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
          <AnimatePresence mode="wait">
            {activeTab === "resume" && (
              <ResumeUpload 
                key="resume" 
                initialRole={preSelectedRole}
                onComplete={(data) => {
                  setRoadmap(data);
                  setPreSelectedRole("");
                  setActiveTab("dashboard");
                }} 
              />
            )}
            {activeTab === "dashboard" && roadmap && (
              <Dashboard 
                key="dashboard" 
                roadmap={roadmap} 
                onUploadResume={() => setActiveTab("resume")}
              />
            )}
            {activeTab === "roadmap" && roadmap && (
              <Roadmap 
                key="roadmap" 
                roadmap={roadmap} 
                onToggleProgress={(stepIndex, itemType, itemIndex) => 
                  toggleRoadmapProgress(roadmap.id, stepIndex, itemType, itemIndex)
                } 
              />
            )}
            {activeTab === "interview" && roadmap && (
              <MockInterview key="interview" roadmap={roadmap} onBack={() => setActiveTab("dashboard")} />
            )}
            {activeTab === "explore" && (
              <ExploreRoadmaps 
                key="explore" 
                onSelect={(role) => {
                  handleDirectGeneration(role);
                }} 
              />
            )}
            {activeTab === "practo" && (
              <Practo key="practo" onBack={() => setActiveTab("dashboard")} />
            )}
            {activeTab !== "resume" && activeTab !== "explore" && activeTab !== "practo" && !roadmap && (
              <div className="flex flex-col items-center justify-center py-24 space-y-6">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                  <Briefcase size={48} />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold">No Roadmap Found</h3>
                  <p className="text-white/40">Upload your resume to generate your first career mirror.</p>
                </div>
                <button 
                  onClick={() => setActiveTab("resume")}
                  className="px-8 py-4 rounded-xl bg-orange-500 text-black font-bold hover:bg-orange-400 transition-all"
                >
                  Go to Resume Upload
                </button>
              </div>
            )}
          </AnimatePresence>
        </Layout>
      ) : (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-[#0a0a0a] dark:text-white flex flex-col items-center justify-center p-8 text-center space-y-12 relative overflow-hidden">
          {/* Background Gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-orange-500/10 blur-[120px] rounded-full -z-10" />
          
          <div className="space-y-6 max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-orange-500 text-xs font-bold uppercase tracking-widest"
            >
              <Sparkles size={14} /> AI-Powered Career Mirror
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl md:text-8xl font-bold tracking-tight leading-tight"
            >
              Bridge the Gap to Your <span className="text-orange-500">Dream Role.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-black/50 dark:text-white/50 max-w-2xl mx-auto"
            >
              Upload your resume, analyze your skill gaps, and get a personalized AI-generated roadmap to master your career.
            </motion.p>
          </div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => signIn()}
            className="px-12 py-5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-xl hover:bg-orange-500 transition-all flex items-center gap-3 shadow-2xl shadow-black/10 dark:shadow-white/10 group"
          >
            <span>Get Started Now</span>
            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-24 max-w-5xl w-full">
            {[
              { title: "NLP Resume Analysis", desc: "Deep scanning of your skills and experience." },
              { title: "Dynamic Roadmaps", desc: "Step-by-step learning paths with curated resources." },
              { title: "AI Mock Interviews", desc: "Practice real-world questions with instant feedback." },
            ].map((feat, i) => (
              <div key={i} className="p-8 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-left space-y-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Briefcase size={24} />
                </div>
                <h3 className="text-xl font-bold">{feat.title}</h3>
                <p className="text-sm text-black/40 dark:text-white/40 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </ThemeProvider>
  );
}
