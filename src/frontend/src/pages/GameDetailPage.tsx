import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Gamepad2, Loader2, RefreshCw, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { GeneratedCode } from "../backend";
import CheatCodeCard from "../components/CheatCodeCard";
import {
  useCheatCodes,
  useGameById,
  useGenerateCode,
} from "../hooks/useQueries";

const PLATFORM_COLORS: Record<string, string> = {
  NES: "text-neon-pink border-neon-pink/50 bg-neon-pink/10",
  SNES: "text-neon-purple border-neon-purple/50 bg-neon-purple/10",
  "Game Boy": "text-neon-green border-neon-green/50 bg-neon-green/10",
  Genesis: "text-neon-pink border-neon-pink/50 bg-neon-pink/10",
  N64: "text-neon-green border-neon-green/50 bg-neon-green/10",
  PlayStation: "text-neon-purple border-neon-purple/50 bg-neon-purple/10",
  PC: "text-cyan-400 border-cyan-400/50 bg-cyan-400/10",
  default: "text-cyan-400 border-cyan-400/50 bg-cyan-400/10",
};

interface GameDetailPageProps {
  gameId: bigint;
  onBack: () => void;
}

export default function GameDetailPage({
  gameId,
  onBack,
}: GameDetailPageProps) {
  const [latestCode, setLatestCode] = useState<GeneratedCode | null>(null);

  const { data: game, isLoading: gameLoading } = useGameById(gameId);
  const { data: codes, isLoading: codesLoading } = useCheatCodes(gameId);
  const generateCode = useGenerateCode();

  const handleGenerateCode = async () => {
    try {
      const result = await generateCode.mutateAsync(gameId);
      setLatestCode(result);
      toast.success("Cheat code generated!", {
        description: result.code,
        style: {
          background: "oklch(0.13 0.018 265)",
          border: "1px solid oklch(0.78 0.22 145 / 0.4)",
        },
      });
    } catch {
      toast.error("Failed to generate code. Try again!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-5 text-muted-foreground hover:text-foreground gap-2 -ml-2"
        onClick={onBack}
        data-ocid="detail.back.button"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Library
      </Button>

      {gameLoading ? (
        <div className="space-y-4" data-ocid="detail.loading_state">
          <Skeleton className="h-10 w-64 rounded-sm bg-card" />
          <Skeleton className="h-24 rounded-sm bg-card" />
        </div>
      ) : game ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-sm bg-muted/30 flex items-center justify-center border border-border/50 flex-shrink-0">
              <Gamepad2 className="w-7 h-7 text-neon-green" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {game.name}
              </h1>
              <div className="flex gap-2 items-center">
                <Badge
                  variant="outline"
                  className={`text-xs border ${PLATFORM_COLORS[game.platform] ?? PLATFORM_COLORS.default}`}
                >
                  {game.platform}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs border-border/60 text-muted-foreground"
                >
                  {game.genre}
                </Badge>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground bg-card border border-border/50 rounded-sm p-4">
            {game.description}
          </p>
        </motion.div>
      ) : null}

      {/* Code Generator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 p-6 rounded-sm neon-border-purple bg-card"
        data-ocid="codegen.section"
      >
        <h2 className="pixel-heading text-sm neon-text-purple mb-4">
          CODE GENERATOR
        </h2>

        <Button
          size="lg"
          className="w-full h-14 text-sm font-bold glowing-btn bg-neon-green/10 border-2 border-neon-green/60 text-neon-green hover:bg-neon-green/20 hover:border-neon-green/80 transition-all duration-300"
          style={{
            boxShadow: generateCode.isPending
              ? "0 0 24px oklch(0.78 0.22 145 / 0.5)"
              : undefined,
          }}
          onClick={handleGenerateCode}
          disabled={generateCode.isPending || gameLoading}
          data-ocid="codegen.primary_button"
        >
          {generateCode.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> GENERATING...
            </>
          ) : latestCode ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2" /> GENERATE ANOTHER CODE
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" /> GENERATE RANDOM CODE
            </>
          )}
        </Button>

        <AnimatePresence mode="wait">
          {latestCode && (
            <motion.div
              key={latestCode.code}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.25 }}
              className="mt-5 p-5 rounded-sm"
              style={{
                background: "oklch(0.09 0.012 265)",
                border: "2px solid oklch(0.78 0.22 145 / 0.8)",
                boxShadow:
                  "0 0 24px oklch(0.78 0.22 145 / 0.3), inset 0 0 20px oklch(0.78 0.22 145 / 0.05)",
              }}
              data-ocid="codegen.success_state"
            >
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground tracking-widest uppercase mb-3">
                  Your Cheat Code
                </p>
                <div
                  className="code-display text-3xl font-bold tracking-widest mb-3 animate-flicker"
                  style={{
                    color: "oklch(0.78 0.22 145)",
                    textShadow:
                      "0 0 20px oklch(0.78 0.22 145 / 0.8), 0 0 40px oklch(0.78 0.22 145 / 0.4)",
                  }}
                >
                  {latestCode.code}
                </div>
                <p className="text-sm text-foreground/80">
                  {latestCode.effect}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* All Cheat Codes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="pixel-heading text-sm neon-text-green">
            ALL CHEAT CODES
          </h2>
          {codes && (
            <Badge
              variant="outline"
              className="border-neon-green/40 text-neon-green text-xs"
            >
              {codes.length} codes
            </Badge>
          )}
        </div>

        {codesLoading ? (
          <div className="space-y-3" data-ocid="codes.loading_state">
            {Array.from({ length: 4 }, (_, i) => `sk4-${i}`).map((k) => (
              <Skeleton key={k} className="h-20 rounded-sm bg-card" />
            ))}
          </div>
        ) : !codes || codes.length === 0 ? (
          <div
            className="text-center py-10 border border-dashed border-border/40 rounded-sm"
            data-ocid="codes.empty_state"
          >
            <p className="text-sm text-muted-foreground">
              No cheat codes available for this game yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {codes.map((code, i) => (
              <CheatCodeCard key={`${code.code}-${i}`} code={code} index={i} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
