import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Gamepad2,
  Loader2,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { GeneratedCode } from "../backend";
import CheatCodeCard from "../components/CheatCodeCard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCheatCodes,
  useCustomCodesForGame,
  useGameById,
  useGenerateCode,
  useSaveCustomCode,
} from "../hooks/useQueries";

const PLATFORM_COLORS: Record<string, string> = {
  NES: "text-neon-pink border-neon-pink/50 bg-neon-pink/10",
  SNES: "text-neon-purple border-neon-purple/50 bg-neon-purple/10",
  "Game Boy": "text-neon-green border-neon-green/50 bg-neon-green/10",
  GBA: "text-neon-green border-neon-green/50 bg-neon-green/10",
  DS: "text-cyan-400 border-cyan-400/50 bg-cyan-400/10",
  "3DS": "text-cyan-400 border-cyan-400/50 bg-cyan-400/10",
  PSP: "text-neon-purple border-neon-purple/50 bg-neon-purple/10",
  PS1: "text-neon-purple border-neon-purple/50 bg-neon-purple/10",
  PS2: "text-neon-purple border-neon-purple/50 bg-neon-purple/10",
  PS3: "text-neon-purple border-neon-purple/50 bg-neon-purple/10",
  PS4: "text-neon-purple border-neon-purple/50 bg-neon-purple/10",
  PS5: "text-cyan-400 border-cyan-400/50 bg-cyan-400/10",
  PlayStation: "text-neon-purple border-neon-purple/50 bg-neon-purple/10",
  Genesis: "text-neon-pink border-neon-pink/50 bg-neon-pink/10",
  N64: "text-neon-green border-neon-green/50 bg-neon-green/10",
  Xbox: "text-neon-green border-neon-green/50 bg-neon-green/10",
  "Xbox 360": "text-neon-green border-neon-green/50 bg-neon-green/10",
  "Xbox One": "text-neon-green border-neon-green/50 bg-neon-green/10",
  "Xbox Series X": "text-neon-green border-neon-green/50 bg-neon-green/10",
  Wii: "text-cyan-400 border-cyan-400/50 bg-cyan-400/10",
  Switch: "text-neon-pink border-neon-pink/50 bg-neon-pink/10",
  PC: "text-cyan-400 border-cyan-400/50 bg-cyan-400/10",
  Mobile: "text-yellow-400 border-yellow-400/50 bg-yellow-400/10",
  Multi: "text-cyan-400 border-cyan-400/50 bg-cyan-400/10",
  default: "text-cyan-400 border-cyan-400/50 bg-cyan-400/10",
};

const CATEGORIES = [
  "Unlimited",
  "Invincibility",
  "Health",
  "Speed",
  "Weapons",
  "Ammo",
  "Currency",
  "Stats",
  "Unlock",
  "Cheats",
  "Debug",
  "Other",
];

interface GameDetailPageProps {
  gameId: bigint;
  onBack: () => void;
}

export default function GameDetailPage({
  gameId,
  onBack,
}: GameDetailPageProps) {
  const [latestCode, setLatestCode] = useState<GeneratedCode | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [customEffect, setCustomEffect] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;

  const { data: game, isLoading: gameLoading } = useGameById(gameId);
  const { data: codes, isLoading: codesLoading } = useCheatCodes(gameId);
  const { data: customCodes, isLoading: customCodesLoading } =
    useCustomCodesForGame(gameId);
  const generateCode = useGenerateCode();
  const saveCustomCode = useSaveCustomCode();

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

  const handleSaveCustomCode = async () => {
    if (!customCode.trim() || !customEffect.trim() || !customCategory) {
      toast.error("Please fill in all fields.");
      return;
    }
    try {
      await saveCustomCode.mutateAsync({
        gameId,
        code: customCode.toUpperCase().trim(),
        effect: customEffect.trim(),
        category: customCategory,
      });
      toast.success("Custom code saved!", {
        description: `${customCode.toUpperCase()} — ${customEffect}`,
        style: {
          background: "oklch(0.13 0.018 265)",
          border: "1px solid oklch(0.7 0.32 340 / 0.5)",
        },
      });
      setCustomCode("");
      setCustomEffect("");
      setCustomCategory("");
    } catch {
      toast.error("Failed to save custom code. Try again!");
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
                  className={`text-xs border ${
                    PLATFORM_COLORS[game.platform] ?? PLATFORM_COLORS.default
                  }`}
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

      {/* Add Custom Code Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-8 rounded-sm bg-card"
        style={{
          border: "1px solid oklch(0.7 0.32 340 / 0.4)",
          boxShadow: showCustomForm
            ? "0 0 20px oklch(0.7 0.32 340 / 0.15)"
            : undefined,
        }}
        data-ocid="custom_code.section"
      >
        <button
          type="button"
          className="w-full flex items-center justify-between p-5 group"
          onClick={() => setShowCustomForm((v) => !v)}
          data-ocid="custom_code.toggle"
        >
          <div className="flex items-center gap-3">
            <Sparkles
              className="w-4 h-4"
              style={{ color: "oklch(0.7 0.32 340)" }}
            />
            <span
              className="pixel-heading text-sm"
              style={{ color: "oklch(0.7 0.32 340)" }}
            >
              ADD CUSTOM CODE
            </span>
          </div>
          {showCustomForm ? (
            <ChevronUp
              className="w-4 h-4 transition-colors"
              style={{ color: "oklch(0.7 0.32 340)" }}
            />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </button>

        <AnimatePresence>
          {showCustomForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div
                className="px-5 pb-5 border-t"
                style={{ borderColor: "oklch(0.7 0.32 340 / 0.2)" }}
              >
                {!isLoggedIn ? (
                  <div
                    className="mt-4 p-4 rounded-sm text-center"
                    style={{
                      background: "oklch(0.7 0.32 340 / 0.05)",
                      border: "1px dashed oklch(0.7 0.32 340 / 0.4)",
                    }}
                    data-ocid="custom_code.error_state"
                  >
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "oklch(0.7 0.32 340)" }}
                    >
                      Login required to save custom codes
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sign in with Internet Identity to add your own cheat codes
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="custom-code"
                          className="text-xs tracking-wider text-muted-foreground uppercase"
                        >
                          Code
                        </Label>
                        <Input
                          id="custom-code"
                          placeholder="e.g. ABCDEF"
                          value={customCode}
                          onChange={(e) =>
                            setCustomCode(e.target.value.toUpperCase())
                          }
                          className="bg-background/50 border-border/60 font-mono tracking-widest uppercase"
                          style={{ color: "oklch(0.7 0.32 340)" }}
                          maxLength={12}
                          data-ocid="custom_code.input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="custom-effect"
                          className="text-xs tracking-wider text-muted-foreground uppercase"
                        >
                          Effect
                        </Label>
                        <Input
                          id="custom-effect"
                          placeholder="e.g. Infinite Lives"
                          value={customEffect}
                          onChange={(e) => setCustomEffect(e.target.value)}
                          className="bg-background/50 border-border/60"
                          data-ocid="custom_code.textarea"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="custom-category"
                        className="text-xs tracking-wider text-muted-foreground uppercase"
                      >
                        Category
                      </Label>
                      <Select
                        value={customCategory}
                        onValueChange={setCustomCategory}
                      >
                        <SelectTrigger
                          id="custom-category"
                          className="bg-background/50 border-border/60"
                          data-ocid="custom_code.select"
                        >
                          <SelectValue placeholder="Select a category..." />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleSaveCustomCode}
                      disabled={saveCustomCode.isPending}
                      className="w-full h-11 font-bold tracking-widest text-sm transition-all duration-300"
                      style={{
                        background: "oklch(0.7 0.32 340 / 0.15)",
                        border: "2px solid oklch(0.7 0.32 340 / 0.6)",
                        color: "oklch(0.7 0.32 340)",
                        boxShadow: saveCustomCode.isPending
                          ? "0 0 20px oklch(0.7 0.32 340 / 0.4)"
                          : undefined,
                      }}
                      data-ocid="custom_code.submit_button"
                    >
                      {saveCustomCode.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          SAVING...
                        </>
                      ) : (
                        <>SAVE CODE</>
                      )}
                    </Button>
                  </div>
                )}
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

      {/* Custom Codes Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2
              className="pixel-heading text-sm"
              style={{ color: "oklch(0.7 0.32 340)" }}
            >
              CUSTOM CODES
            </h2>
            <Sparkles
              className="w-3.5 h-3.5"
              style={{ color: "oklch(0.7 0.32 340)" }}
            />
          </div>
          {customCodes && customCodes.length > 0 && (
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                borderColor: "oklch(0.7 0.32 340 / 0.5)",
                color: "oklch(0.7 0.32 340)",
              }}
            >
              {customCodes.length} custom
            </Badge>
          )}
        </div>

        {customCodesLoading ? (
          <div className="space-y-3" data-ocid="custom_codes.loading_state">
            {Array.from({ length: 2 }, (_, i) => `sk-c-${i}`).map((k) => (
              <Skeleton key={k} className="h-20 rounded-sm bg-card" />
            ))}
          </div>
        ) : !customCodes || customCodes.length === 0 ? (
          <div
            className="text-center py-10 border border-dashed rounded-sm"
            style={{ borderColor: "oklch(0.7 0.32 340 / 0.25)" }}
            data-ocid="custom_codes.empty_state"
          >
            <Sparkles
              className="w-6 h-6 mx-auto mb-2"
              style={{ color: "oklch(0.7 0.32 340 / 0.5)" }}
            />
            <p className="text-sm text-muted-foreground">
              No custom codes yet — add one above!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {customCodes.map((c, i) => (
              <div key={c.id} className="relative">
                <CheatCodeCard code={c} index={i} />
                <span
                  className="absolute top-2 right-2 text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded-sm"
                  style={{
                    background: "oklch(0.7 0.32 340 / 0.15)",
                    border: "1px solid oklch(0.7 0.32 340 / 0.5)",
                    color: "oklch(0.7 0.32 340)",
                  }}
                >
                  CUSTOM
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
