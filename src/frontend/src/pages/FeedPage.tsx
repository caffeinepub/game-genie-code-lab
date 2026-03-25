import type { AppPage } from "@/App";
import VideoCard from "@/components/VideoCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeed, useSearchVideos } from "@/hooks/useQueries";
import { Clock, Play, Sparkles, TrendingUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const SAMPLE_VIDEOS = [
  {
    id: BigInt(-1),
    title: "Street Food Tour: 10 Must-Try Dishes in Bangkok",
    description: "Join me as I explore the vibrant street food scene.",
    tags: ["food", "travel", "bangkok"],
    uploader: { toString: () => "sample1" } as any,
    createdAt: BigInt(Date.now() * 1_000_000 - 3_600_000_000_000),
    viewCount: BigInt(12400),
    likeCount: BigInt(843),
    blobKey: "",
  },
  {
    id: BigInt(-2),
    title: "My Morning Routine for Maximum Productivity",
    description: "5AM wake-up, cold plunge, journaling, and deep work.",
    tags: ["lifestyle", "productivity"],
    uploader: { toString: () => "sample2" } as any,
    createdAt: BigInt(Date.now() * 1_000_000 - 7_200_000_000_000),
    viewCount: BigInt(8900),
    likeCount: BigInt(562),
    blobKey: "",
  },
  {
    id: BigInt(-3),
    title: "DIY Neon Sign Tutorial — Easy & Affordable!",
    description: "Make your own glowing neon sign with LED strips.",
    tags: ["diy", "crafts", "home"],
    uploader: { toString: () => "sample3" } as any,
    createdAt: BigInt(Date.now() * 1_000_000 - 14_400_000_000_000),
    viewCount: BigInt(34200),
    likeCount: BigInt(2100),
    blobKey: "",
  },
  {
    id: BigInt(-4),
    title: "Learn Piano in 30 Days — Week 1 Update",
    description:
      "Documenting my journey learning piano as a complete beginner.",
    tags: ["music", "piano", "learning"],
    uploader: { toString: () => "sample4" } as any,
    createdAt: BigInt(Date.now() * 1_000_000 - 86_400_000_000_000),
    viewCount: BigInt(6700),
    likeCount: BigInt(412),
    blobKey: "",
  },
  {
    id: BigInt(-5),
    title: "Hiking Patagonia Solo — What Nobody Tells You",
    description:
      "Raw honest take on solo trekking in the world's most remote wilderness.",
    tags: ["hiking", "travel", "adventure"],
    uploader: { toString: () => "sample5" } as any,
    createdAt: BigInt(Date.now() * 1_000_000 - 172_800_000_000_000),
    viewCount: BigInt(51300),
    likeCount: BigInt(3800),
    blobKey: "",
  },
  {
    id: BigInt(-6),
    title: "I Built an App in 48 Hours — Hackathon Vlog",
    description: "From idea to demo: the full story of our hackathon project.",
    tags: ["coding", "tech", "startup"],
    uploader: { toString: () => "sample6" } as any,
    createdAt: BigInt(Date.now() * 1_000_000 - 259_200_000_000_000),
    viewCount: BigInt(19800),
    likeCount: BigInt(1340),
    blobKey: "",
  },
];

const SKELETON_IDS = ["sk1", "sk2", "sk3", "sk4", "sk5", "sk6", "sk7", "sk8"];

interface FeedPageProps {
  tab: "latest" | "trending";
  onTabChange: (tab: "latest" | "trending") => void;
  onNavigate: (p: AppPage) => void;
  searchQuery?: string;
}

export default function FeedPage({
  tab,
  onTabChange,
  onNavigate,
  searchQuery,
}: FeedPageProps) {
  const { data: feedVideos = [], isLoading: feedLoading } = useFeed(tab);
  const { data: searchResults = [], isLoading: searchLoading } =
    useSearchVideos(searchQuery || "");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    setShowSearch(!!searchQuery && searchQuery.trim().length > 0);
  }, [searchQuery]);

  const isLoading = showSearch ? searchLoading : feedLoading;
  const displayVideos = showSearch
    ? searchResults
    : feedVideos.length > 0
      ? feedVideos
      : SAMPLE_VIDEOS;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Hero */}
      {!showSearch && (
        <div className="mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-purple/10 border border-brand-purple/25 text-brand-purple text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Chronological & fair — no hidden algorithm
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl mb-2">
              Discover <span className="brand-gradient-text">real videos</span>
            </h1>
            <p className="text-muted-foreground max-w-sm mx-auto text-sm">
              Every creator gets equal visibility. No shadow-banning. No bias.
            </p>
          </motion.div>
        </div>
      )}

      {/* Search result header */}
      {showSearch && (
        <div className="mb-6">
          <h2 className="font-display font-semibold text-xl">
            Results for{" "}
            <span className="brand-gradient-text">
              &ldquo;{searchQuery}&rdquo;
            </span>
          </h2>
        </div>
      )}

      {/* Tabs */}
      {!showSearch && (
        <div className="flex items-center mb-6">
          <Tabs
            value={tab}
            onValueChange={(v) => onTabChange(v as "latest" | "trending")}
          >
            <TabsList className="bg-muted/60">
              <TabsTrigger
                value="latest"
                className="flex items-center gap-1.5"
                data-ocid="feed.tab"
              >
                <Clock className="w-3.5 h-3.5" />
                Latest
              </TabsTrigger>
              <TabsTrigger
                value="trending"
                className="flex items-center gap-1.5"
                data-ocid="feed.tab"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Trending
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Video grid */}
      {isLoading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          data-ocid="feed.loading_state"
        >
          {SKELETON_IDS.map((id) => (
            <div key={id} className="rounded-xl overflow-hidden">
              <Skeleton className="aspect-video" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : displayVideos.length === 0 ? (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 space-y-3"
            data-ocid="feed.empty_state"
          >
            <div className="w-16 h-16 rounded-2xl brand-gradient flex items-center justify-center mx-auto">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
            <p className="font-display font-semibold text-lg">
              {showSearch ? "No videos found" : "No videos yet"}
            </p>
            <p className="text-muted-foreground text-sm">
              {showSearch
                ? "Try a different search term"
                : "Be the first to upload a video!"}
            </p>
          </motion.div>
        </AnimatePresence>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          data-ocid="feed.list"
        >
          {displayVideos.map((video, i) => (
            <VideoCard
              key={video.id.toString()}
              video={video}
              index={i}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
