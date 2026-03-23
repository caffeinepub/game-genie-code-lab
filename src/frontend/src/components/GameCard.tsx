import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Gamepad, Plus } from "lucide-react";
import { motion } from "motion/react";
import type { GameWithId } from "../hooks/useQueries";

const PLATFORM_COLORS: Record<string, string> = {
  NES: "neon-text-pink",
  SNES: "neon-text-purple",
  "Game Boy": "neon-text-green",
  Genesis: "neon-text-pink",
  N64: "neon-text-green",
  PlayStation: "neon-text-purple",
  PC: "neon-text-cyan",
  default: "neon-text-cyan",
};

const GENRE_COLORS: Record<string, string> = {
  RPG: "bg-neon-purple/20 text-neon-purple border-neon-purple/40",
  Action: "bg-neon-pink/20 text-neon-pink border-neon-pink/40",
  Platformer: "bg-neon-green/20 text-neon-green border-neon-green/40",
  FPS: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  Fighting: "bg-red-500/20 text-red-400 border-red-500/40",
  Adventure: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
  Sports: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  Puzzle: "bg-pink-500/20 text-pink-400 border-pink-500/40",
  Racing: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  Strategy: "bg-green-600/20 text-green-400 border-green-600/40",
};

interface GameCardProps {
  game: GameWithId;
  index: number;
  onViewCodes: (id: bigint) => void;
  onAddToLibrary?: (id: bigint) => void;
  inLibrary?: boolean;
  isAddingToLibrary?: boolean;
}

export default function GameCard({
  game,
  index,
  onViewCodes,
  onAddToLibrary,
  inLibrary = false,
  isAddingToLibrary = false,
}: GameCardProps) {
  const platformColor =
    PLATFORM_COLORS[game.platform] ?? PLATFORM_COLORS.default;
  const genreColor =
    GENRE_COLORS[game.genre] ??
    "bg-muted/20 text-muted-foreground border-border";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="game-card p-4 group"
      data-ocid={`games.item.${index + 1}`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-sm bg-muted/30 flex items-center justify-center flex-shrink-0 border border-border/50">
          <Gamepad className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-foreground text-sm truncate"
            title={game.name}
          >
            {game.name}
          </h3>
          <p className={`text-xs font-mono mt-0.5 ${platformColor}`}>
            {game.platform}
          </p>
        </div>
        {inLibrary && (
          <span className="text-[10px] neon-text-green px-1.5 py-0.5 border border-neon-green/40 rounded-sm flex-shrink-0">
            SAVED
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
        {game.description}
      </p>

      <div className="flex items-center justify-between">
        <Badge variant="outline" className={`text-[10px] border ${genreColor}`}>
          {game.genre}
        </Badge>
        <div className="flex gap-2">
          {onAddToLibrary && !inLibrary && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2 border-neon-purple/50 text-neon-purple hover:bg-neon-purple/10 glowing-btn"
              onClick={() => onAddToLibrary(game.id)}
              disabled={isAddingToLibrary}
              data-ocid={`games.save.button.${index + 1}`}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          )}
          <Button
            size="sm"
            className="h-7 text-xs px-2 bg-neon-green/10 border border-neon-green/50 text-neon-green hover:bg-neon-green/20 glowing-btn"
            variant="outline"
            onClick={() => onViewCodes(game.id)}
            data-ocid={`games.view.button.${index + 1}`}
          >
            <Eye className="w-3 h-3 mr-1" />
            Codes
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
