import React from "react";
import { motion } from "motion/react";
import { User, LogOut, LayoutDashboard, Map, MessageSquare, Briefcase, Sun, Moon, Compass, Code2 } from "lucide-react";
import { auth, signIn, signOut } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useTheme } from "../context/ThemeContext";

export default function Layout({ children, activeTab, setActiveTab }: { children: React.ReactNode, activeTab: string, setActiveTab: (tab: string) => void }) {
  const [user] = useAuthState(auth);
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "roadmap", label: "Roadmap", icon: Map },
    { id: "interview", label: "Mock Interview", icon: MessageSquare },
    { id: "practo", label: "Practo", icon: Code2 },
    { id: "explore", label: "Explore", icon: Compass },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-[#0a0a0a] dark:text-white font-sans selection:bg-orange-500/30 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-black/5 dark:border-white/10 bg-gray-50 dark:bg-[#0d0d0d] p-6 hidden md:block">
        <div className="flex items-center justify-between mb-12 px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-black text-sm">T</div>
            <h1 className="text-xl font-bold tracking-tight">TalentUp</h1>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-black/5 dark:bg-white/5 text-black/50 dark:text-white/50 hover:text-orange-500 transition-colors"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-orange-500 text-black font-semibold shadow-lg shadow-orange-500/20"
                  : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-8 left-6 right-6">
          {user ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
              <img src={user.photoURL || ""} alt={user.displayName || ""} className="w-10 h-10 rounded-full border border-black/10 dark:border-white/20" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.displayName}</p>
                <button onClick={() => signOut()} className="text-xs text-black/40 dark:text-white/40 hover:text-orange-500 flex items-center gap-1">
                  <LogOut size={12} /> Sign Out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className="w-full py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold hover:bg-orange-500 transition-colors flex items-center justify-center gap-2"
            >
              <User size={18} /> Sign In
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-8 min-h-screen">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-6xl mx-auto"
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-50 dark:bg-[#0d0d0d] border-t border-black/5 dark:border-white/10 p-4 flex justify-around items-center z-50">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`p-2 rounded-lg ${activeTab === item.id ? "text-orange-500" : "text-black/40 dark:text-white/40"}`}
          >
            <item.icon size={24} />
          </button>
        ))}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-black/40 dark:text-white/40"
        >
          {theme === "light" ? <Moon size={24} /> : <Sun size={24} />}
        </button>
      </nav>
    </div>
  );
}