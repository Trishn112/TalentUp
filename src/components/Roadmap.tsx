import React from "react";
import { motion } from "motion/react";
import { CheckCircle2, Circle, Clock, Target, Rocket, Star, ArrowRight } from "lucide-react";

export default function Roadmap({ 
  roadmap, 
  onToggleProgress 
}: { 
  roadmap: any;
  onToggleProgress?: (stepIndex: number, itemType: 'goal' | 'project', itemIndex: number) => void;
}) {
  const { steps, role, progress = {} } = roadmap;

  const calculateStepProgress = (stepIndex: number) => {
    const step = steps[stepIndex];
    const totalItems = step.dailyGoals.length + step.projects.length;
    let completedItems = 0;

    step.dailyGoals.forEach((_: any, i: number) => {
      if (progress[`${stepIndex}_goal_${i}`]) completedItems++;
    });
    step.projects.forEach((_: any, i: number) => {
      if (progress[`${stepIndex}_project_${i}`]) completedItems++;
    });

    return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  };

  const totalProgress = steps.reduce((acc: number, _: any, i: number) => acc + calculateStepProgress(i), 0) / steps.length;

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24 transition-colors duration-300">
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold uppercase tracking-widest"
          >
            <Rocket size={12} /> Personalized Learning Path
          </motion.div>
          <h2 className="text-4xl font-bold tracking-tight">The {role} Roadmap</h2>
          <p className="text-black/40 dark:text-white/40 max-w-xl mx-auto">A data-driven, step-by-step guide to bridge your skill gaps and master your target role.</p>
        </div>

        {/* Global Progress Bar */}
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">
            <span>Overall Journey</span>
            <span>{Math.round(totalProgress)}%</span>
          </div>
          <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-black/5 dark:border-white/10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress}%` }}
              className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
            />
          </div>
        </div>
      </div>

      <div className="relative space-y-16 before:absolute before:left-8 before:top-8 before:bottom-8 before:w-px before:bg-black/10 dark:before:bg-white/10 before:hidden md:before:block">
        {steps.map((step: any, i: number) => {
          const stepProgress = calculateStepProgress(i);
          
          return (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative md:pl-24 group"
            >
              {/* Timeline Marker */}
              <div className="absolute left-0 top-0 hidden md:flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 dark:bg-[#0d0d0d] border border-black/5 dark:border-white/10 group-hover:border-orange-500/50 transition-all z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                  stepProgress === 100 ? "bg-orange-500 text-white" :
                  step.level === "Beginner" ? "bg-green-500/20 text-green-500" :
                  step.level === "Intermediate" ? "bg-orange-500/20 text-orange-500" :
                  "bg-purple-500/20 text-purple-500"
                }`}>
                  {stepProgress === 100 ? <CheckCircle2 size={20} /> : i + 1}
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-gray-50 dark:bg-[#0d0d0d] border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        step.level === "Beginner" ? "bg-green-500/20 text-green-500" :
                        step.level === "Intermediate" ? "bg-orange-500/20 text-orange-500" :
                        "bg-purple-500/20 text-purple-500"
                      }`}>
                        {step.level}
                      </span>
                      <h3 className="text-2xl font-bold tracking-tight">{step.title}</h3>
                    </div>
                    <p className="text-black/50 dark:text-white/50 leading-relaxed">{step.description}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-sm text-black/60 dark:text-white/60">
                      <Clock size={14} className="text-orange-500" />
                      <span>{step.estimatedTime}</span>
                    </div>
                  </div>
                </div>

                {/* Step Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-black/30 dark:text-white/30">
                    <span>Step Progress</span>
                    <span>{Math.round(stepProgress)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stepProgress}%` }}
                      className={`h-full transition-colors ${stepProgress === 100 ? 'bg-green-500' : 'bg-orange-500'}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-black/5 dark:border-white/5">
                  {/* Daily Goals */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-black/40 dark:text-white/40">
                      <Target size={14} /> Daily Goals
                    </div>
                    <ul className="space-y-3">
                      {step.dailyGoals.map((goal: string, j: number) => {
                        const isCompleted = progress[`${i}_goal_${j}`];
                        return (
                          <li 
                            key={j} 
                            onClick={() => onToggleProgress?.(i, 'goal', j)}
                            className={`flex items-start gap-3 text-sm transition-all cursor-pointer group/goal ${
                              isCompleted ? 'text-black/30 dark:text-white/20 line-through' : 'text-black/70 dark:text-white/70'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isCompleted ? (
                                <CheckCircle2 size={16} className="text-green-500" />
                              ) : (
                                <Circle size={16} className="text-orange-500/40 group-hover/goal:text-orange-500 transition-colors" />
                              )}
                            </div>
                            <span>{goal}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Projects */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-black/40 dark:text-white/40">
                      <Star size={14} /> Project-Based Learning
                    </div>
                    <div className="space-y-3">
                      {step.projects.map((project: string, j: number) => {
                        const isCompleted = progress[`${i}_project_${j}`];
                        return (
                          <div 
                            key={j} 
                            onClick={() => onToggleProgress?.(i, 'project', j)}
                            className={`p-4 rounded-xl border transition-all flex items-center justify-between group/proj cursor-pointer ${
                              isCompleted 
                                ? 'bg-green-500/5 border-green-500/20 opacity-60' 
                                : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 hover:border-orange-500/20'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {isCompleted && <CheckCircle2 size={14} className="text-green-500" />}
                              <span className={`text-sm ${isCompleted ? 'text-green-500/70 line-through' : 'text-black/80 dark:text-white/80'}`}>
                                {project}
                              </span>
                            </div>
                            {!isCompleted && <ArrowRight size={14} className="text-black/20 dark:text-white/20 group-hover/proj:text-orange-500 transition-all" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
