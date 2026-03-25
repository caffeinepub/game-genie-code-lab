import type { AppPage } from "@/App";
import CommentSection from "@/components/CommentSection";
import TipDialog from "@/components/TipDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  useHasLiked,
  useIncrementView,
  useLikeVideo,
  useUserProfile,
  useVideo,
  useVideoTips,
} from "@/hooks/useQueries";
import { ArrowLeft, Coins, Eye, Heart, Loader2, Play } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function formatCount(n: bigint): string {
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

interface VideoDetailPageProps {
  videoId: bigint;
  onNavigate: (p: AppPage) => void;
  onLoginRequired: () => void;
}

export default function VideoDetailPage({
  videoId,
  onNavigate,
  onLoginRequired,
}: VideoDetailPageProps) {
  const { data: video, isLoading } = useVideo(videoId);
  const { data: tips = BigInt(0) } = useVideoTips(videoId);
  const { data: hasLiked = false } = useHasLiked(videoId);
  const { data: uploaderProfile } = useUserProfile(video?.uploader || null);
  const likeMutation = useLikeVideo();
  const incrementView = useIncrementView();
  const { identity } = useInternetIdentity();
  const [tipDialogOpen, setTipDialogOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const viewTracked = useRef(false);

  useEffect(() => {
    if (videoId && !viewTracked.current) {
      viewTracked.current = true;
      incrementView.mutate(videoId);
    }
  }, [videoId, incrementView]);

  const handleLike = async () => {
    if (!identity) {
      onLoginRequired();
      return;
    }
    try {
      await likeMutation.mutateAsync(videoId);
    } catch {
      toast.error("Failed to like video.");
    }
  };

  const handleTip = () => {
    if (!identity) {
      onLoginRequired();
      return;
    }
    setTipDialogOpen(true);
  };

  const creatorName =
    uploaderProfile?.displayName ||
    `${video?.uploader.toString().slice(0, 12)}...`;

  if (isLoading) {
    return (
      <div
        className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4"
        data-ocid="video.loading_state"
      >
        <Skeleton className="aspect-video rounded-xl" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (!video) {
    return (
      <div
        className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center"
        data-ocid="video.error_state"
      >
        <p className="text-muted-foreground">Video not found.</p>
        <Button
          variant="ghost"
          onClick={() => onNavigate({ view: "feed", tab: "latest" })}
          className="mt-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Feed
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <button
        type="button"
        onClick={() => onNavigate({ view: "feed", tab: "latest" })}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        data-ocid="video.link"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Feed
      </button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Video player */}
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
          {video.blobKey ? (
            <video
              src={video.blobKey}
              controls
              className="w-full h-full object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <track kind="captions" />
            </video>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-900/60 via-purple-900/40 to-pink-900/60 flex items-center justify-center">
              <div className="text-center space-y-3">
                <button
                  type="button"
                  className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 mx-auto cursor-pointer hover:bg-white/20 transition-colors"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  <Play className="w-7 h-7 text-white fill-white ml-1" />
                </button>
                <p className="text-white/50 text-sm">
                  No video source available
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Title & info */}
        <div className="space-y-3">
          <h1 className="font-display font-bold text-2xl sm:text-3xl leading-tight">
            {video.title}
          </h1>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {formatCount(video.viewCount)} views
            </span>
            <span className="flex items-center gap-1.5">
              <Heart className="w-4 h-4" />
              {formatCount(video.likeCount)} likes
            </span>
            <span className="coin-badge">
              <Coins className="w-3 h-3" />
              {formatCount(tips)} coins
            </span>
          </div>

          {/* Creator & actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <button
              type="button"
              onClick={() =>
                onNavigate({ view: "profile", principal: video.uploader })
              }
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
              data-ocid="video.link"
            >
              <Avatar className="w-9 h-9">
                <AvatarFallback className="brand-gradient text-white text-xs font-bold">
                  {creatorName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{creatorName}</p>
                <p className="text-xs text-muted-foreground">Creator</p>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`like-btn ${hasLiked ? "liked" : ""}`}
                onClick={handleLike}
                disabled={likeMutation.isPending}
                data-ocid="video.toggle"
              >
                {likeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Heart
                    className={`w-4 h-4 ${hasLiked ? "fill-current" : ""}`}
                  />
                )}
                {hasLiked ? "Liked" : "Like"}
              </button>

              <button
                type="button"
                className="tip-btn"
                onClick={handleTip}
                data-ocid="video.open_modal_button"
              >
                <Coins className="w-4 h-4" />
                Tip Creator
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        {video.description && (
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-sm leading-relaxed text-foreground/85">
              {video.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {video.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {video.tags.map((tag) => (
              <span key={tag} className="tag-pill">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Separator */}
        <div className="border-t border-border/50" />

        {/* Comments */}
        <CommentSection videoId={videoId} onLoginRequired={onLoginRequired} />
      </motion.div>

      {/* Tip Dialog */}
      <TipDialog
        open={tipDialogOpen}
        onOpenChange={setTipDialogOpen}
        videoId={videoId}
        creatorName={creatorName}
      />
    </div>
  );
}
