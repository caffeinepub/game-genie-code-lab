import type { AppPage } from "@/App";
import VideoCard from "@/components/VideoCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import {
  useMyTipsEarned,
  useSaveProfile,
  useUserProfile,
  useUserVideos,
} from "@/hooks/useQueries";
import type { Principal } from "@icp-sdk/core/principal";
import {
  ArrowLeft,
  Check,
  Coins,
  Edit2,
  Loader2,
  Video,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

function formatCount(n: bigint): string {
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

const SKELETON_IDS = ["psk1", "psk2", "psk3"];

interface ProfilePageProps {
  principal: Principal;
  onNavigate: (p: AppPage) => void;
}

export default function ProfilePage({
  principal,
  onNavigate,
}: ProfilePageProps) {
  const { identity } = useInternetIdentity();
  const isOwnProfile =
    identity?.getPrincipal().toString() === principal.toString();

  const { data: profile, isLoading: profileLoading } =
    useUserProfile(principal);
  const { data: videos = [], isLoading: videosLoading } =
    useUserVideos(principal);
  const { data: tipsEarned = BigInt(0) } = useMyTipsEarned();
  const saveMutation = useSaveProfile();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const displayName =
    profile?.displayName || `${principal.toString().slice(0, 12)}...`;
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleEditStart = () => {
    setNameInput(profile?.displayName || "");
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    try {
      await saveMutation.mutateAsync(nameInput.trim());
      setEditingName(false);
      toast.success("Name updated!");
    } catch {
      toast.error("Failed to update name.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <button
        type="button"
        onClick={() => onNavigate({ view: "feed", tab: "latest" })}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        data-ocid="profile.link"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Feed
      </button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Profile header */}
        <div className="flex items-start gap-5 mb-8">
          <Avatar className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
            <AvatarFallback className="brand-gradient text-white text-2xl font-bold">
              {profileLoading ? "..." : initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2 mb-1">
                <Input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={30}
                  className="h-9 text-lg font-bold max-w-xs"
                  data-ocid="profile.input"
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={saveMutation.isPending}
                  className="p-1.5 rounded-lg hover:bg-muted text-green-500"
                  data-ocid="profile.save_button"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                  data-ocid="profile.cancel_button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                {profileLoading ? (
                  <Skeleton className="h-7 w-36" />
                ) : (
                  <h1 className="font-display font-bold text-2xl truncate">
                    {displayName}
                  </h1>
                )}
                {isOwnProfile && !editingName && (
                  <button
                    type="button"
                    onClick={handleEditStart}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                    aria-label="Edit display name"
                    data-ocid="profile.edit_button"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground font-mono truncate mb-3">
              {principal.toString()}
            </p>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-sm">
                <Video className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold">{videos.length}</span>
                <span className="text-muted-foreground">videos</span>
              </div>
              {isOwnProfile && (
                <div className="coin-badge">
                  <Coins className="w-3 h-3" />
                  {formatCount(tipsEarned)} coins earned
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Videos grid */}
        <div>
          <h2 className="font-display font-semibold text-lg mb-4">Videos</h2>
          {videosLoading ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              data-ocid="profile.loading_state"
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
          ) : videos.length === 0 ? (
            <div
              className="text-center py-16 space-y-2"
              data-ocid="profile.empty_state"
            >
              <Video className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-muted-foreground text-sm">
                {isOwnProfile
                  ? "You haven't uploaded any videos yet."
                  : "No videos yet."}
              </p>
              {isOwnProfile && (
                <Button
                  size="sm"
                  onClick={() => onNavigate({ view: "upload" })}
                  className="brand-gradient text-white border-0 mt-2"
                  data-ocid="profile.primary_button"
                >
                  Upload your first video
                </Button>
              )}
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              data-ocid="profile.list"
            >
              {videos.map((video, i) => (
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
      </motion.div>
    </div>
  );
}
