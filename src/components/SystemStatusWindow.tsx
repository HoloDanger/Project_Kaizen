"use client";

import React, { useState, useEffect } from "react";
import {
  Check,
  Shield,
  Zap,
  Trophy,
  Activity,
  Star,
  Plus,
  Trash2,
  X,
  Cpu,
  Flame,
  AlertTriangle,
  Terminal,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { logToLedger } from "@/src/server/actions";

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const playSuccessSound = () => {
  if (typeof window === "undefined") return;
  try {
    new Audio("/levelup.mp3").play().catch((e) => console.error("Audio play failed", e));
  } catch (e) {
    console.error("Audio error", e);
  }
};

const playErrorSound = () => {
  if (typeof window === "undefined") return;
  try {
    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
    audio.volume = 0.5;
    audio.play().catch((e) => console.error("Audio play failed", e));
  } catch (e) {
    console.error("Audio error", e);
  }
};

// --- Types ---
type Quest = {
  id: string;
  title: string;
  xpReward: number;
  ramCost: number;
  completed: boolean;
  createdAt: number;
  isSlop: boolean;
  suggestion?: string;
};

// --- Component ---
export default function SystemStatusWindow() {
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [xpToNextLevel, setXpToNextLevel] = useState(5000);
  const [maxRam, setMaxRam] = useState(512);
  const [newQuestTitle, setNewQuestTitle] = useState("");
  const [lastActiveDate, setLastActiveDate] = useState<string>("");
  const [isDangerMode, setIsDangerMode] = useState(false);
  const [isRamExhausted, setIsRamExhausted] = useState(false);

  const getThermalMetrics = (createdAt: number, isCompleted: boolean) => {
    if (isCompleted) return { color: "text-slate-500", border: "border-slate-800", bg: "bg-slate-900/50", bar: "bg-green-500" };
    const ageInHours = (Date.now() - createdAt) / (1000 * 60 * 60);
    if (ageInHours > 24) return { color: "text-red-400", border: "border-red-600 shadow-[0_0_15px_#ef4444]", bg: "bg-red-950/20 animate-pulse", bar: "bg-red-600", label: "MELTDOWN" };
    if (ageInHours > 12) return { color: "text-orange-400", border: "border-orange-500 shadow-[0_0_10px_#f97316]", bg: "bg-orange-950/10", bar: "bg-orange-500", label: "OVERHEATING" };
    if (ageInHours > 4) return { color: "text-yellow-400", border: "border-yellow-500", bg: "bg-yellow-950/5", bar: "bg-yellow-500", label: "WARM" };
    return { color: "text-slate-200", border: "border-slate-700", bg: "bg-slate-900", bar: "bg-blue-500" };
  };

  const [quests, setQuests] = useState<Quest[]>([
    { id: "1", title: "Refactor StoreOS Go-Auth", xpReward: 500, ramCost: 256, completed: false, createdAt: Date.now() - (25 * 60 * 60 * 1000), isSlop: false },
    { id: "2", title: "Lexicon Protocol Audit", xpReward: 250, ramCost: 128, completed: false, createdAt: Date.now() - (13 * 60 * 60 * 1000), isSlop: false },
    { id: "3", title: "Genesis Engine Template Hardening", xpReward: 150, ramCost: 64, completed: false, createdAt: Date.now() - (5 * 60 * 60 * 1000), isSlop: false },
    { id: "4", title: "stuff -r 16", xpReward: 8, ramCost: 16, completed: false, createdAt: Date.now(), isSlop: true, suggestion: "Define specific output for 'stuff'." },
  ]);

  const currentRamUsage = quests.filter((q) => !q.completed).reduce((acc, q) => acc + q.ramCost, 0);
  const ramPercent = Math.min(100, (currentRamUsage / maxRam) * 100);
  const progressPercent = Math.min(100, (xp / xpToNextLevel) * 100);

  useEffect(() => {
    const savedXp = localStorage.getItem("system_xp");
    const savedLevel = localStorage.getItem("system_level");
    const savedQuests = localStorage.getItem("system_quests");
    const savedDate = localStorage.getItem("system_last_active");

    if (savedXp) setXp(Number(savedXp));
    if (savedLevel) setLevel(Number(savedLevel));
    if (savedQuests) {
      const parsed = JSON.parse(savedQuests);
      setQuests(parsed.map((q: any) => ({ 
        ...q, 
        ramCost: q.ramCost || 32,
        createdAt: q.createdAt || Date.now(),
        isSlop: q.isSlop || false
      })));
    }
    if (savedDate) {
      setLastActiveDate(savedDate);
      checkDangerMode(savedDate);
    } else {
      const now = new Date().toISOString();
      setLastActiveDate(now);
      localStorage.setItem("system_last_active", now);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("system_xp", xp.toString());
    localStorage.setItem("system_level", level.toString());
    localStorage.setItem("system_quests", JSON.stringify(quests));
    if (lastActiveDate) localStorage.setItem("system_last_active", lastActiveDate);
  }, [xp, level, quests, lastActiveDate]);

  const checkDangerMode = (dateStr: string) => {
    const lastDate = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (!lastDate.toDateString() && diffDays > 1) setIsDangerMode(true);
    else setIsDangerMode(false);
  };

  const updateActivity = () => {
    const now = new Date().toISOString();
    setLastActiveDate(now);
    setIsDangerMode(false);
  };

  const completeQuest = (id: string) => {
    setQuests((prev) => prev.map((q) => {
      if (q.id === id && !q.completed) {
        const newXp = xp + q.xpReward;
        setXp(newXp);
        playSuccessSound();
        updateActivity();
        
        // Protocol B: Log to Iron Ledger
        logToLedger("ACHIEVED", q.title, q.xpReward, q.ramCost, q.isSlop);

        if (newXp >= xpToNextLevel) {
          setLevel((l) => l + 1);
          setXpToNextLevel((x) => Math.floor(x * 1.5));
        }
        return { ...q, completed: true };
      }
      return q;
    }));
  };

  const handleToggleQuest = (id: string) => {
    const quest = quests.find((q) => q.id === id);
    if (!quest) return;
    if (!quest.completed) completeQuest(id);
    else {
      if (currentRamUsage + quest.ramCost > maxRam) {
        setIsRamExhausted(true);
        playErrorSound();
        setTimeout(() => setIsRamExhausted(false), 1000);
        return;
      }
      setQuests((prev) => prev.map((q) => (q.id === id ? { ...q, completed: false } : q)));
      setXp((prev) => Math.max(0, prev - quest.xpReward));
    }
  };

  const auditMandate = (title: string): { isSlop: boolean; suggestion?: string } => {
    const slopKeywords = ["stuff", "work on", "do", "maybe", "think", "thing", "manage"];
    const lowercaseTitle = title.toLowerCase();
    
    if (title.length < 5) return { isSlop: true, suggestion: "Mandate is too brief. Be specific." };
    if (slopKeywords.some(k => lowercaseTitle.includes(k))) {
      return { isSlop: true, suggestion: `Strategic Slop detected. Avoid vague terms like '${slopKeywords.find(k => lowercaseTitle.includes(k))}'.` };
    }
    return { isSlop: false };
  };

  const handleAddQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestTitle.trim()) return;
    
    let title = newQuestTitle;
    let cost = 32;
    let ageHours = 0;

    const ramMatch = newQuestTitle.match(/-r\s+(\d+)/);
    if (ramMatch) {
      cost = parseInt(ramMatch[1], 10);
      title = title.replace(/-r\s+\d+/, "").trim();
    }

    const timeMatch = title.match(/-t\s+(\d+)/);
    if (timeMatch) {
      ageHours = parseInt(timeMatch[1], 10);
      title = title.replace(/-t\s+\d+/, "").trim();
    }

    if (currentRamUsage + cost > maxRam) {
      setIsRamExhausted(true);
      playErrorSound();
      setTimeout(() => setIsRamExhausted(false), 1000);
      return;
    }

    const auditResults = auditMandate(title);
    const reward = auditResults.isSlop ? Math.floor(cost * 0.4) : Math.floor(cost * 1.5);

    updateActivity();
    const newQuest: Quest = {
      id: Date.now().toString(),
      title,
      xpReward: reward,
      ramCost: cost,
      completed: false,
      createdAt: Date.now() - (ageHours * 60 * 60 * 1000),
      isSlop: auditResults.isSlop,
      suggestion: auditResults.suggestion
    };

    setQuests((prev) => [...prev, newQuest]);
    setNewQuestTitle("");
  };

  const handleDeleteQuest = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const quest = quests.find((q) => q.id === id);
    if (quest) {
      // Protocol B: Log to Iron Ledger
      logToLedger("PURGED", quest.title, 0, quest.ramCost, quest.isSlop);
    }
    setQuests((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div className="w-full max-w-md mx-auto p-1 font-mono text-sm antialiased select-none">
      <div className={cn("bg-slate-950 border-2 rounded-lg overflow-hidden relative transition-all duration-500", isDangerMode ? "border-red-900 shadow-[0_0_30px_#ef4444]" : "border-slate-800 shadow-[0_0_15px_#3b82f6]")}>
        <div className={cn("absolute top-0 left-0 w-full h-1 bg-linear-to-r opacity-70 transition-colors duration-500", isDangerMode ? "from-red-600 via-orange-500 to-red-600" : "from-blue-600 via-cyan-400 to-blue-600")}></div>

        <div className="p-4 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h2 className={cn("text-xs font-bold tracking-widest uppercase mb-1 transition-colors", isDangerMode ? "text-red-500 animate-pulse" : "text-blue-400")}>System User</h2>
              <div className="text-xl text-white font-bold flex items-center gap-2">
                <Shield className={cn("w-5 h-5 transition-colors", isDangerMode ? "text-red-500" : "text-blue-500")} />
                ARCHON COCKPIT
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 mb-1 uppercase tracking-tighter">LVL</div>
              <div className={cn("text-2xl font-bold leading-none", isDangerMode ? "text-red-500" : "text-yellow-400")}>{level}</div>
            </div>
          </div>

          <div className={cn("relative h-4 bg-slate-800 rounded-sm overflow-hidden border mb-2", isDangerMode ? "border-red-900" : "border-slate-700")}>
            <div className={cn("absolute top-0 left-0 h-full bg-linear-to-r transition-all duration-500 ease-out", isDangerMode ? "from-red-600 to-orange-600" : "from-blue-600 to-cyan-400")} style={{ width: `${progressPercent}%` }}>
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md z-10 uppercase tracking-tighter">XP: {xp} / {xpToNextLevel}</div>
          </div>

          <div className={cn("relative h-4 bg-slate-800 rounded-sm overflow-hidden border transition-all duration-300", isRamExhausted ? "border-red-500 scale-105" : "border-slate-700")}>
            <div className={cn("absolute top-0 left-0 h-full transition-all duration-500 ease-out", ramPercent > 90 ? "bg-red-600" : ramPercent > 70 ? "bg-orange-500" : "bg-purple-600")} style={{ width: `${ramPercent}%` }}>
              <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md z-10 uppercase tracking-tighter">MENTAL RAM: {currentRamUsage}MB / {maxRam}MB</div>
          </div>
        </div>

        <div className="p-4 bg-slate-950 min-h-75">
          <div className={cn("flex items-center gap-2 mb-4 border-b border-slate-800 pb-2 transition-colors", isDangerMode ? "text-red-400" : "text-cyan-400")}>
            <Trophy className="w-4 h-4" />
            <span className="font-bold tracking-wider uppercase">ACTIVE MANDATES</span>
          </div>

          <div className="space-y-3">
            {quests.map((quest) => {
              const metrics = getThermalMetrics(quest.createdAt, quest.completed);
              return (
                <div key={quest.id} onClick={() => handleToggleQuest(quest.id)} className={cn("group relative p-3 border rounded transition-all duration-200 cursor-pointer flex items-center gap-3 overflow-hidden", metrics.border, metrics.bg)}>
                  {!quest.completed && <div className={cn("absolute left-0 top-0 bottom-0 w-1", metrics.bar)}></div>}
                  <div className={cn("w-6 h-6 border-2 rounded flex items-center justify-center transition-colors", quest.completed ? "bg-green-500/20 border-green-500 text-green-400" : "bg-slate-800 border-slate-600 text-transparent group-hover:border-blue-400")}>
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </div>
                  <div className="flex-1">
                    <div className={cn("text-sm font-medium transition-colors flex items-center gap-2", quest.completed ? "text-slate-500 line-through" : metrics.color)}>
                      {quest.title}
                      {quest.completed && <span className="text-[9px] font-bold text-green-500 border border-green-500/30 px-1 rounded uppercase tracking-tighter no-underline">ACHIEVED</span>}
                      {metrics.label && !quest.completed && <span className={cn("text-[9px] font-bold border px-1 rounded uppercase tracking-tighter flex items-center gap-1", metrics.label === "MELTDOWN" ? "border-red-500 text-red-500 animate-pulse" : metrics.label === "OVERHEATING" ? "border-orange-500 text-orange-500" : "border-yellow-500 text-yellow-500")}><Flame className="w-2 h-2" /> {metrics.label}</span>}
                    </div>
                    {quest.isSlop && !quest.completed && (
                      <div className="flex items-center gap-2 text-[10px] text-red-500 mt-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3" /> [ STRATEGIC SLOP DETECTED ]: {quest.suggestion}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1"><Zap className={cn("w-3 h-3", quest.isSlop ? "text-red-900" : "text-yellow-600")} /> +{quest.xpReward} XP {quest.isSlop && "(SLOP PENALTY)"}</span>
                      <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-purple-500" /> {quest.ramCost}MB RAM</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => handleDeleteQuest(e, quest.id)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                    {quest.completed && <Star className="w-4 h-4 text-yellow-500/50" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <div className="flex items-center gap-4 mb-2 text-[9px] text-slate-500 font-bold uppercase tracking-widest overflow-hidden whitespace-nowrap opacity-60">
            <span className="flex items-center gap-1 text-cyan-500"><Terminal className="w-3 h-3" /> ARCHON CMD:</span>
            <span>-r [RAM_MB]</span>
            <span>-t [AGE_HR]</span>
            <span className="text-red-500">AUTOAUDIT: ENABLED</span>
          </div>
          <form onSubmit={handleAddQuest} className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className={cn("font-bold", isRamExhausted ? "text-red-500 animate-pulse" : "text-cyan-500")}>{">"}</span>
              </div>
              <input type="text" value={newQuestTitle} onChange={(e) => setNewQuestTitle(e.target.value)} placeholder={isRamExhausted ? "SYSTEM_RAM_EXHAUSTED" : "INTEGRATE MANDATE..."} className={cn("w-full bg-slate-950 border rounded pl-8 pr-4 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none text-xs tracking-wider transition-all", isRamExhausted ? "border-red-600 ring-1 ring-red-600" : "border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500")} />
            </div>
            <button type="submit" disabled={!newQuestTitle.trim() || isRamExhausted} className={cn("px-3 rounded flex items-center justify-center transition-colors", isRamExhausted ? "bg-red-900/50" : "bg-blue-600 hover:bg-blue-500")}>
              <Plus className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>

        <div className="p-2 bg-slate-950 border-t border-slate-800 text-center text-[10px] text-slate-600 flex justify-center gap-4">
          <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-green-500" /> SYSTEM ONLINE</span>
          <span>SOVEREIGN ARCHON OS v1.3.0</span>
        </div>
      </div>
    </div>
  );
}
