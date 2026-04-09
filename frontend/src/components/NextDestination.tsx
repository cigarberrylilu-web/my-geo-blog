import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plane, Clock } from "lucide-react";
import { NextDestinationData } from "@/src/types";

export function NextDestination() {
  const [data, setData] = useState<NextDestinationData | null>(null);
  const [progress, setProgress] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then(res => res.json())
      .then(config => {
        const dest = config.nextDestination;
        if (!dest) return;
        setData(dest);

        const start = new Date(dest.startDate).getTime();
        const target = new Date(dest.targetDate).getTime();
        const now = Date.now();

        const total = target - start;
        const elapsed = now - start;
        setProgress(Math.min(100, Math.max(0, (elapsed / total) * 100)));
        setDaysRemaining(Math.ceil((target - now) / 86400000));
      })
      .catch(() => {});
  }, []);

  if (!data) return null;

  const isArrived = daysRemaining !== null && daysRemaining <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-24 right-6 z-40 w-64 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl text-white"
      style={{ backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
          Next Destination
        </span>
        <Plane className="w-4 h-4 text-blue-400" />
      </div>

      {/* Destination info */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl drop-shadow-lg">{data.flag}</span>
        <div className="min-w-0">
          <h3 className="font-bold text-white leading-tight truncate">{data.name}</h3>
          <p className="text-[11px] text-white/50 mt-0.5">{data.targetDate}</p>
        </div>
      </div>

      {/* Countdown badge */}
      <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <Clock className="w-3 h-3 text-blue-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-blue-300">
          {isArrived
            ? "出发啦！✈️"
            : `还有 ${daysRemaining} 天`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-medium text-white/40">
          <span>准备进度</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
          />
        </div>
      </div>
    </motion.div>
  );
}
