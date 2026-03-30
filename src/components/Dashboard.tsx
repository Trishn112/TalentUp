import React from "react";
import { motion } from "motion/react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { CheckCircle2, AlertCircle, ExternalLink, TrendingUp, Award, BookOpen, Upload, Flame, Sparkles } from "lucide-react";

export default function Dashboard({ roadmap, onUploadResume }: { roadmap: any, onUploadResume: () => void }) {
  const { analysis, role, steps, progress = {} } = roadmap;

  const totalItems = steps.reduce((acc: number, step: any) => acc + step.dailyGoals.length + step.projects.length, 0);
  const completedItems = Object.values(progress).filter(v => v === true).length;
  const progressPercentage = Math.round((completedItems / totalItems) * 100) || 0;

  const chartData = [
    { subject: "Strengths", A: analysis.strengths.length * 20, fullMark: 100 },
    { subject: "Experience", A: 80, fullMark: 100 },
    { subject: "Skills", A: 60, fullMark: 100 },
    { subject: "Potential", A: 90, fullMark: 100 },
    { subject: "Gap", A: analysis.missingSkills.length * 10, fullMark: 100 },
  ];

  const popularSkills = [
    { name: "Generative AI", demand: "High", icon: "✨" },
    { name: "Rust", demand: "Trending", icon: "🦀" },
    { name: "Next.js 15", demand: "High", icon: "▲" },
    { name: "Kubernetes", demand: "Stable", icon: "☸️" },
  ];

  return (
    <div className="space-y-8 pb-24 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="text-orange-500 font-mono text-sm tracking-widest uppercase">Practo Dashboard</p>
          <h2 className="text-4xl font-bold tracking-tight">{role}</h2>
          <p className="text-black/40 dark:text-white/40 max-w-xl">Deep analysis of your profile against industry standards for {role}.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={onUploadResume}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-500 text-black font-bold hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20"
          >
            <Upload size={18} />
            <span>Upload Resume</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Your Progress */}
        <div className="lg:col-span-1 p-8 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-6">
          <div className="flex items-center gap-3 text-orange-500">
            <TrendingUp size={24} />
            <h3 className="text-lg font-semibold">Your Progress</h3>
          </div>
          <div className="space-y-4">
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-black/5 dark:text-white/5"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={364.4}
                  strokeDashoffset={364.4 - (364.4 * progressPercentage) / 100}
                  className="text-orange-500 transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{progressPercentage}%</span>
                <span className="text-[10px] uppercase tracking-widest opacity-40">Done</span>
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">{completedItems} of {totalItems} tasks completed</p>
              <p className="text-xs text-black/40 dark:text-white/40">Keep it up! You're getting closer.</p>
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="lg:col-span-2 p-8 rounded-3xl bg-gray-50 dark:bg-[#0d0d0d] border border-black/5 dark:border-white/10 flex flex-col items-center justify-center min-h-[400px]">
          <h3 className="text-lg font-semibold mb-8 self-start">Profile Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid stroke="#00000010" className="dark:stroke-[#ffffff10]" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#00000040", fontSize: 12 }} className="dark:fill-[#ffffff40]" />
              <Radar
                name="Profile"
                dataKey="A"
                stroke="#f97316"
                fill="#f97316"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Popular Skills */}
        <div className="lg:col-span-1 p-8 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 space-y-6">
          <div className="flex items-center gap-3 text-orange-500">
            <Flame size={24} />
            <h3 className="text-lg font-semibold">Popular Skills</h3>
          </div>
          <div className="space-y-4">
            {popularSkills.map((skill, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 group hover:border-orange-500/30 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{skill.icon}</span>
                  <div>
                    <p className="text-sm font-bold">{skill.name}</p>
                    <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">{skill.demand}</p>
                  </div>
                </div>
                <Sparkles size={14} className="text-black/10 dark:text-white/10 group-hover:text-orange-500 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Strengths & Weaknesses */}
        <div className="lg:col-span-3 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Strengths */}
            <div className="p-8 rounded-3xl bg-green-500/5 border border-green-500/10 space-y-6">
              <div className="flex items-center gap-3 text-green-500">
                <Award size={24} />
                <h3 className="text-lg font-semibold">Core Strengths</h3>
              </div>
              <ul className="space-y-3">
                {analysis.strengths.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-black/70 dark:text-white/70">
                    <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="p-8 rounded-3xl bg-red-500/5 border border-red-500/10 space-y-6">
              <div className="flex items-center gap-3 text-red-500">
                <AlertCircle size={24} />
                <h3 className="text-lg font-semibold">Weak Areas</h3>
              </div>
              <ul className="space-y-3">
                {analysis.weaknesses.map((w: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-black/70 dark:text-white/70">
                    <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Missing Skills & Resources */}
          <div className="p-8 rounded-3xl bg-gray-50 dark:bg-[#0d0d0d] border border-black/5 dark:border-white/10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen size={24} className="text-orange-500" />
                <h3 className="text-lg font-semibold">Skill Gap Report & Resources</h3>
              </div>
              <TrendingUp size={20} className="text-black/20 dark:text-white/20" />
            </div>

            <div className="space-y-6">
              {analysis.missingSkills.map((gap: any, i: number) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-orange-500/30 transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-lg">{gap.skill}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          gap.priority === "High" ? "bg-red-500/20 text-red-500" : 
                          gap.priority === "Medium" ? "bg-orange-500/20 text-orange-500" : 
                          "bg-blue-500/20 text-blue-500"
                        }`}>
                          {gap.priority} Priority
                        </span>
                      </div>
                      <p className="text-sm text-black/40 dark:text-white/40">{gap.reason}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {gap.resources.map((res: any, j: number) => (
                      <a
                        key={j}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 transition-all group/res"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center text-black/40 dark:text-white/40 group-hover/res:text-orange-500">
                            <BookOpen size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-medium">{res.name}</p>
                            <p className="text-[10px] text-black/30 dark:text-white/30 uppercase tracking-tight">{res.platform} • {res.type}</p>
                          </div>
                        </div>
                        <ExternalLink size={12} className="text-black/20 dark:text-white/20 group-hover/res:text-black dark:group-hover/res:text-white" />
                      </a>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
