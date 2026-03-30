import React from "react";
import { motion } from "motion/react";
import { Briefcase, ArrowRight, Sparkles, Code, Database, Brain, Globe, Shield, Cpu } from "lucide-react";

const POPULAR_ROADMAPS = [
  {
    id: "ai-ml-engineer",
    role: "AI/ML Engineer",
    icon: <Brain className="text-purple-500" />,
    description: "Master machine learning, deep learning, and AI model deployment.",
    color: "purple",
    steps: [
      { title: "Mathematics & Statistics", level: "Beginner" },
      { title: "Python for Data Science", level: "Beginner" },
      { title: "Machine Learning Fundamentals", level: "Intermediate" },
      { title: "Deep Learning & Neural Networks", level: "Intermediate" },
      { title: "MLOps & Deployment", level: "Advanced" }
    ]
  },
  {
    id: "full-stack-dev",
    role: "Full Stack Developer",
    icon: <Code className="text-blue-500" />,
    description: "Build modern web applications from frontend to backend.",
    color: "blue",
    steps: [
      { title: "HTML, CSS & JavaScript", level: "Beginner" },
      { title: "React & Frontend Frameworks", level: "Intermediate" },
      { title: "Node.js & Backend Logic", level: "Intermediate" },
      { title: "Databases & System Design", level: "Advanced" },
      { title: "Cloud Deployment & CI/CD", level: "Advanced" }
    ]
  },
  {
    id: "data-scientist",
    role: "Data Scientist",
    icon: <Database className="text-green-500" />,
    description: "Extract insights from data using statistical and computational methods.",
    color: "green",
    steps: [
      { title: "Data Analysis with SQL", level: "Beginner" },
      { title: "Statistical Modeling", level: "Intermediate" },
      { title: "Data Visualization", level: "Intermediate" },
      { title: "Big Data Technologies", level: "Advanced" },
      { title: "Predictive Analytics", level: "Advanced" }
    ]
  },
  {
    id: "cybersecurity-analyst",
    role: "Cybersecurity Analyst",
    icon: <Shield className="text-red-500" />,
    description: "Protect systems and networks from digital attacks.",
    color: "red",
    steps: [
      { title: "Networking Basics", level: "Beginner" },
      { title: "Security Fundamentals", level: "Beginner" },
      { title: "Ethical Hacking", level: "Intermediate" },
      { title: "Incident Response", level: "Advanced" },
      { title: "Security Architecture", level: "Advanced" }
    ]
  }
];

export default function ExploreRoadmaps({ onSelect }: { onSelect: (role: string) => void }) {
  return (
    <div className="space-y-12 pb-24 transition-colors duration-300">
      <div className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold uppercase tracking-widest"
        >
          <Sparkles size={12} /> Explore Career Paths
        </motion.div>
        <h2 className="text-4xl font-bold tracking-tight">Industry-Standard Roadmaps</h2>
        <p className="text-black/40 dark:text-white/40 max-w-xl mx-auto">Discover structured learning paths for the most in-demand roles in tech today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {POPULAR_ROADMAPS.map((roadmap, i) => (
          <motion.div
            key={roadmap.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative p-8 rounded-3xl bg-gray-50 dark:bg-[#0d0d0d] border border-black/5 dark:border-white/10 hover:border-orange-500/30 transition-all overflow-hidden"
          >
            {/* Background Glow */}
            <div className={`absolute -right-20 -top-20 w-64 h-64 bg-${roadmap.color}-500/5 blur-[80px] rounded-full group-hover:bg-orange-500/10 transition-all`} />

            <div className="relative space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-2xl">
                  {roadmap.icon}
                </div>
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((_, j) => (
                    <div key={j} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#0d0d0d] bg-gray-200 dark:bg-white/10 overflow-hidden">
                      <img src={`https://picsum.photos/seed/user${i}${j}/32/32`} alt="User" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-white dark:border-[#0d0d0d] bg-orange-500 flex items-center justify-center text-[10px] font-bold text-black">
                    +1k
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight">{roadmap.role}</h3>
                <p className="text-sm text-black/50 dark:text-white/50 leading-relaxed">{roadmap.description}</p>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 dark:text-white/30">Key Milestones</p>
                <div className="flex flex-wrap gap-2">
                  {roadmap.steps.slice(0, 3).map((step, j) => (
                    <span key={j} className="px-3 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[10px] font-medium text-black/60 dark:text-white/60">
                      {step.title}
                    </span>
                  ))}
                  {roadmap.steps.length > 3 && (
                    <span className="px-3 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[10px] font-medium text-black/60 dark:text-white/60">
                      +{roadmap.steps.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <button 
                onClick={() => onSelect(roadmap.role)}
                className="w-full py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2 group/btn"
              >
                <span>Generate This Roadmap</span>
                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Custom Request */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="p-12 rounded-[40px] bg-orange-500/5 border border-orange-500/10 text-center space-y-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 mx-auto">
          <Cpu size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">Don't see your dream role?</h3>
          <p className="text-black/50 dark:text-white/50 max-w-lg mx-auto">Our AI can generate a custom roadmap for any role. Just upload your resume and tell us what you're aiming for.</p>
        </div>
        <button 
          onClick={() => onSelect("")}
          className="px-8 py-4 rounded-2xl bg-orange-500 text-black font-bold hover:bg-orange-400 transition-all"
        >
          Create Custom Roadmap
        </button>
      </motion.div>
    </div>
  );
}
