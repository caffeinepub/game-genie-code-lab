import type { AppPage } from "@/App";
import type { VideoPost } from "@/hooks/useQueries";
import { Coins, Eye, Heart, Play } from "lucide-react";

interface VideoCardProps {
  video: VideoPost;
  index: number;
  onNavigate: (p: AppPage) => void;
}

function formatCount(n: bigint): string {
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

const PLACEHOLDER_GRADIENTS = [
  "from-violet-900/60 via-purple-900/40 to-pink-900/60",
  "from-blue-900/60 via-indigo-900/40 to-purple-900/60",
  "from-pink-900/60 via-rose-900/40 to-orange-900/60",
  "from-emerald-900/60 via-teal-900/40 to-cyan-900/60",
  "from-amber-900/60 via-orange-900/40 to-red-900/60",
  "from-sky-900/60 via-blue-900/40 to-violet-900/60",
];

export default function VideoCard({
  video,
  index,
  onNavigate,
}: VideoCardProps) {
  const gradientClass =
    PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length];

  return (
    <button
      type="button"
      className="video-card group cursor-pointer animate-fade-up text-left w-full"
      style={{
        animationDelay: `${(index % 6) * 60}ms`,
        animationFillMode: "both",
      }}
      onClick={() => onNavigate({ view: "video", videoId: video.id })}
      aria-label={`Watch ${video.title}`}
      data-ocid={`feed.item.${index + 1}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {video.blobKey ? (
          <video
            src={video.blobKey}
            className="w-full h-full object-cover"
            preload="metadata"
            muted
          >
            <track kind="captions" />
          </video>
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center video-placeholder`}
          >
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 leading-snug mb-2">
          {video.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatCount(video.viewCount)}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {formatCount(video.likeCount)}
            </span>
          </div>
          <span className="coin-badge">
            <Coins className="w-3 h-3" />
          </span>
        </div>
      </div>
    </button>
  );
}
