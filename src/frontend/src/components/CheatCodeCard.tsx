import { motion } from "motion/react";
import type { Type__1 } from "../backend";

const CATEGORY_STYLES: Record<string, { badge: string; glow: string }> = {
  "God Mode": {
    badge: "bg-neon-pink/20 text-neon-pink border-neon-pink/50",
    glow: "group-hover:shadow-neon-pink",
  },
  "Infinite Lives": {
    badge: "bg-neon-green/20 text-neon-green border-neon-green/50",
    glow: "group-hover:shadow-neon",
  },
  "Speed Boost": {
    badge: "bg-cyan-400/20 text-cyan-400 border-cyan-400/50",
    glow: "group-hover:shadow-[0_0_20px_oklch(0.78_0.2_200/0.4)]",
  },
  "Infinite Ammo": {
    badge: "bg-orange-400/20 text-orange-400 border-orange-400/50",
    glow: "",
  },
  "Level Skip": {
    badge: "bg-yellow-400/20 text-yellow-400 border-yellow-400/50",
    glow: "",
  },
  "Unlock All": {
    badge: "bg-neon-purple/20 text-neon-purple border-neon-purple/50",
    glow: "group-hover:shadow-neon-purple",
  },
  Invincibility: {
    badge: "bg-neon-pink/20 text-neon-pink border-neon-pink/50",
    glow: "",
  },
  default: {
    badge: "bg-muted/30 text-muted-foreground border-border",
    glow: "",
  },
};

interface CheatCodeCardProps {
  code: Type__1;
  index: number;
}

export default function CheatCodeCard({ code, index }: CheatCodeCardProps) {
  const style = CATEGORY_STYLES[code.category] ?? CATEGORY_STYLES.default;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group game-card p-4 transition-all duration-300 ${style.glow}`}
      data-ocid={`codes.item.${index + 1}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="cheat-code-badge flex-shrink-0">{code.code}</div>
        <span
          className={`text-[10px] px-2 py-1 rounded-sm border font-semibold tracking-wider ${style.badge}`}
        >
          {code.category}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{code.effect}</p>
    </motion.div>
  );
}
