import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonitorSmartphone, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { GeneratedCode } from "../backend";
import GameCard from "../components/GameCard";
import {
  type GameWithId,
  useAllGames,
  useCodeHistory,
  useSaveToLibrary,
  useSearchGames,
  useUserLibrary,
} from "../hooks/useQueries";

const GENRES = [
  "All",
  "RPG",
  "Action",
  "Platformer",
  "FPS",
  "Fighting",
  "Adventure",
  "Sports",
  "Puzzle",
  "Racing",
  "Strategy",
];

const PLATFORMS = [
  "All",
  "NES",
  "SNES",
  "Game Boy",
  "GBA",
  "DS",
  "3DS",
  "N64",
  "Genesis",
  "PlayStation",
  "PS2",
  "PS3",
  "PS4",
  "PS5",
  "PSP",
  "Xbox",
  "Xbox 360",
  "Xbox One",
  "Xbox Series X",
  "Wii",
  "Wii U",
  "Switch",
  "PC",
  "Mobile",
];

function detectMyDevice(): string {
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() ?? "";
  if (/iphone|ipad|ipod|android/.test(ua)) return "Mobile";
  if (/win/.test(platform) || /windows/.test(ua)) return "PC";
  if (/mac/.test(platform) && !/iphone|ipad/.test(ua)) return "PC";
  if (/linux/.test(platform)) return "PC";
  return "All";
}

interface HomePageProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSelectGame: (id: bigint) => void;
}

export default function HomePage({
  activeTab,
  onTabChange,
  onSelectGame,
}: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedPlatform, setSelectedPlatform] = useState("All");

  const { data: allGames, isLoading: allLoading } = useAllGames();
  const { data: searchResults, isLoading: searchLoading } = useSearchGames(
    searchQuery,
    selectedGenre === "All" ? "" : selectedGenre,
  );
  const { data: library, isLoading: libraryLoading } = useUserLibrary();
  const { data: history, isLoading: historyLoading } = useCodeHistory();
  const saveToLibrary = useSaveToLibrary();

  const libraryGameIds = useMemo(
    () => new Set((library ?? []).map((g) => g.gameId.toString())),
    [library],
  );

  const displayedGames = useMemo((): GameWithId[] => {
    const base =
      searchQuery.trim() || selectedGenre !== "All"
        ? (searchResults ?? [])
        : (allGames ?? []);
    if (selectedPlatform === "All") return base;
    return base.filter((g) => g.platform === selectedPlatform);
  }, [searchQuery, selectedGenre, selectedPlatform, searchResults, allGames]);

  const handleAddToLibrary = async (gameId: bigint) => {
    try {
      await saveToLibrary.mutateAsync(gameId);
      toast.success("Game added to your library!", {
        style: {
          background: "oklch(0.13 0.018 265)",
          border: "1px solid oklch(0.78 0.22 145 / 0.4)",
        },
      });
    } catch {
      toast.error("Failed to save game. Please log in first.");
    }
  };

  const handleDetectDevice = () => {
    const detected = detectMyDevice();
    setSelectedPlatform(detected);
    if (detected === "All") {
      toast("Could not detect platform — showing all games", {
        icon: <MonitorSmartphone className="w-4 h-4 text-cyan-400" />,
      });
    } else {
      toast.success(`Detected: ${detected} — showing ${detected} games`, {
        icon: <MonitorSmartphone className="w-4 h-4 text-cyan-400" />,
        style: {
          background: "oklch(0.13 0.018 265)",
          border: "1px solid oklch(0.78 0.22 210 / 0.5)",
        },
      });
    }
  };

  const isLoading =
    searchQuery.trim() || selectedGenre !== "All" ? searchLoading : allLoading;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList
          className="mb-6 bg-card border border-border/60 h-10"
          data-ocid="main.tab"
        >
          <TabsTrigger
            value="search"
            data-ocid="search.tab"
            className="data-[state=active]:bg-neon-green/10 data-[state=active]:text-neon-green text-xs"
          >
            Find Games
          </TabsTrigger>
          <TabsTrigger
            value="library"
            data-ocid="library.tab"
            className="data-[state=active]:bg-neon-green/10 data-[state=active]:text-neon-green text-xs"
          >
            My Library
            {library && library.length > 0 && (
              <Badge
                variant="outline"
                className="ml-2 h-4 text-[10px] px-1.5 border-neon-green/40 text-neon-green"
              >
                {library.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            data-ocid="history.tab"
            className="data-[state=active]:bg-neon-green/10 data-[state=active]:text-neon-green text-xs"
          >
            Code History
          </TabsTrigger>
        </TabsList>

        {/* SEARCH TAB */}
        <TabsContent value="search">
          <div className="mb-5 space-y-3">
            {/* Detect My Device button */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <p className="text-xs text-muted-foreground">
                Browse the full catalog or detect your device platform
              </p>
              <button
                type="button"
                onClick={handleDetectDevice}
                data-ocid="detect.device.button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-sm border border-cyan-500/50 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400/70 transition-all duration-200 font-mono flex-shrink-0"
              >
                <MonitorSmartphone className="w-3.5 h-3.5" />
                Detect My Device
              </button>
            </motion.div>

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search games by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-card border-border/60 focus:border-neon-green/60 font-mono text-sm h-10"
                data-ocid="search.input"
              />
            </div>

            {/* Genre filter */}
            <div className="flex gap-2 flex-wrap">
              {GENRES.map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setSelectedGenre(g)}
                  data-ocid={`genre.${g.toLowerCase().replace(/ /g, "_")}.toggle`}
                  className={`px-3 py-1 text-xs rounded-sm border transition-all duration-200 ${
                    selectedGenre === g
                      ? "border-neon-purple/70 bg-neon-purple/15 text-neon-purple"
                      : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Platform filter */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                Platform:
              </p>
              <div
                className="flex gap-2 overflow-x-auto pb-1"
                style={{ scrollbarWidth: "none" }}
              >
                {PLATFORMS.map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setSelectedPlatform(p)}
                    data-ocid={`platform.${p.toLowerCase().replace(/ /g, "_")}.toggle`}
                    className={`px-3 py-1 text-xs rounded-sm border transition-all duration-200 flex-shrink-0 ${
                      selectedPlatform === p
                        ? "border-cyan-500/70 bg-cyan-500/15 text-cyan-400"
                        : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              data-ocid="games.loading_state"
            >
              {Array.from({ length: 6 }, (_, i) => `sk-${i}`).map((k) => (
                <Skeleton key={k} className="h-40 rounded-sm bg-card" />
              ))}
            </div>
          ) : displayedGames.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
              data-ocid="games.empty_state"
            >
              <p className="pixel-heading text-xs text-muted-foreground mb-2">
                NO GAMES FOUND
              </p>
              <p className="text-sm text-muted-foreground">
                Try a different search term, genre, or platform
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedGames.map((game, i) => (
                  <GameCard
                    key={`${game.name}-${i}`}
                    game={game}
                    index={i}
                    onViewCodes={onSelectGame}
                    onAddToLibrary={handleAddToLibrary}
                    inLibrary={libraryGameIds.has(game.id.toString())}
                    isAddingToLibrary={saveToLibrary.isPending}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </TabsContent>

        {/* LIBRARY TAB */}
        <TabsContent value="library">
          <LibraryView
            libraryIds={library ?? []}
            allGames={allGames ?? []}
            isLoading={libraryLoading || allLoading}
            onSelectGame={onSelectGame}
          />
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history">
          <HistoryView
            history={history ?? []}
            allGames={allGames ?? []}
            isLoading={historyLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LibraryView({
  libraryIds,
  allGames,
  isLoading,
  onSelectGame,
}: {
  libraryIds: Array<{ gameId: bigint }>;
  allGames: GameWithId[];
  isLoading: boolean;
  onSelectGame: (id: bigint) => void;
}) {
  const libraryGames = useMemo(() => {
    return libraryIds
      .map((ug) =>
        allGames.find((g) => g.id.toString() === ug.gameId.toString()),
      )
      .filter((g): g is GameWithId => !!g);
  }, [libraryIds, allGames]);

  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        data-ocid="library.loading_state"
      >
        {Array.from({ length: 3 }, (_, i) => `sk3-${i}`).map((k) => (
          <Skeleton key={k} className="h-40 rounded-sm bg-card" />
        ))}
      </div>
    );
  }

  if (libraryGames.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
        data-ocid="library.empty_state"
      >
        <p className="pixel-heading text-xs text-muted-foreground mb-3">
          LIBRARY EMPTY
        </p>
        <p className="text-sm text-muted-foreground">
          Search for games and add them to your library
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {libraryGames.map((game, i) => (
        <GameCard
          key={game.id.toString()}
          game={game}
          index={i}
          onViewCodes={onSelectGame}
          inLibrary
        />
      ))}
    </div>
  );
}

function HistoryView({
  history,
  allGames,
  isLoading,
}: {
  history: GeneratedCode[];
  allGames: GameWithId[];
  isLoading: boolean;
}) {
  const gameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of allGames) {
      m.set(g.id.toString(), g.name);
    }
    return m;
  }, [allGames]);

  if (isLoading) {
    return (
      <div className="space-y-3" data-ocid="history.loading_state">
        {Array.from({ length: 5 }, (_, i) => `sk5-${i}`).map((k) => (
          <Skeleton key={k} className="h-20 rounded-sm bg-card" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
        data-ocid="history.empty_state"
      >
        <p className="pixel-heading text-xs text-muted-foreground mb-3">
          NO CODES YET
        </p>
        <p className="text-sm text-muted-foreground">
          Select a game and generate some cheat codes!
        </p>
      </motion.div>
    );
  }

  const sorted = [...history].sort((a, b) =>
    Number(b.generatedAt - a.generatedAt),
  );

  return (
    <div className="space-y-3">
      {sorted.map((entry, i) => {
        const gameName =
          gameMap.get(entry.gameId.toString()) ?? `Game #${entry.gameId}`;
        const date = new Date(Number(entry.generatedAt / BigInt(1_000_000)));
        return (
          <motion.div
            key={`${entry.gameId}-${entry.generatedAt}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="game-card p-4 flex items-center gap-4"
            data-ocid={`history.item.${i + 1}`}
          >
            <div className="cheat-code-badge text-sm flex-shrink-0">
              {entry.code}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {gameName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {entry.effect}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-muted-foreground">
                {date.toLocaleDateString()}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
