import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Comment,
  UserProfile,
  VideoPost,
  backendInterface,
} from "../backend.d";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export type { VideoPost, Comment, UserProfile };

function getActor(actor: unknown): backendInterface {
  return actor as backendInterface;
}

export function useFeed(tab: "latest" | "trending") {
  const { actor, isFetching } = useActor();
  return useQuery<VideoPost[]>({
    queryKey: ["feed", tab],
    queryFn: async () => {
      if (!actor) return [];
      const a = getActor(actor);
      if (tab === "trending") {
        return a.getTrendingFeed(BigInt(20), BigInt(0));
      }
      return a.getFeed(BigInt(20), BigInt(0));
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
  });
}

export function useVideo(videoId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<VideoPost | null>({
    queryKey: ["video", videoId?.toString()],
    queryFn: async () => {
      if (!actor || videoId === null) return null;
      return getActor(actor).getVideo(videoId);
    },
    enabled: !!actor && !isFetching && videoId !== null,
  });
}

export function useVideoTips(videoId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["videoTips", videoId?.toString()],
    queryFn: async () => {
      if (!actor || videoId === null) return BigInt(0);
      return getActor(actor).getVideoTips(videoId);
    },
    enabled: !!actor && !isFetching && videoId !== null,
  });
}

export function useHasLiked(videoId: bigint | null) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<boolean>({
    queryKey: [
      "hasLiked",
      videoId?.toString(),
      identity?.getPrincipal().toString(),
    ],
    queryFn: async () => {
      if (!actor || videoId === null || !identity) return false;
      return getActor(actor).hasLikedVideo(videoId);
    },
    enabled: !!actor && !isFetching && videoId !== null && !!identity,
  });
}

export function useComments(videoId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Comment[]>({
    queryKey: ["comments", videoId?.toString()],
    queryFn: async () => {
      if (!actor || videoId === null) return [];
      return getActor(actor).getComments(videoId);
    },
    enabled: !!actor && !isFetching && videoId !== null,
  });
}

export function useMyProfile() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<UserProfile | null>({
    queryKey: ["myProfile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      return getActor(actor).getMyProfile();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useUserProfile(principal: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return getActor(actor).getUserProfile(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useUserVideos(principal: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<VideoPost[]>({
    queryKey: ["userVideos", principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return [];
      return getActor(actor).getUserVideos(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useMyTipsEarned() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<bigint>({
    queryKey: ["myTipsEarned", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return BigInt(0);
      return getActor(actor).getMyTipsEarned();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useSearchVideos(keyword: string) {
  const { actor, isFetching } = useActor();
  return useQuery<VideoPost[]>({
    queryKey: ["searchVideos", keyword],
    queryFn: async () => {
      if (!actor || !keyword.trim()) return [];
      return getActor(actor).searchVideos(keyword);
    },
    enabled: !!actor && !isFetching && keyword.trim().length > 0,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (displayName: string) => {
      if (!actor) throw new Error("Not authenticated");
      await getActor(actor).saveUserProfile({ displayName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["myProfile", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useLikeVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  return useMutation({
    mutationFn: async (videoId: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      return getActor(actor).likeVideo(videoId);
    },
    onSuccess: (_data, videoId) => {
      queryClient.invalidateQueries({
        queryKey: ["video", videoId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "hasLiked",
          videoId.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useTipVideo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      videoId,
      amount,
    }: { videoId: bigint; amount: bigint }) => {
      if (!actor) throw new Error("Not authenticated");
      return getActor(actor).tipVideo(videoId, amount);
    },
    onSuccess: (_data, { videoId }) => {
      queryClient.invalidateQueries({
        queryKey: ["videoTips", videoId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["myTipsEarned"] });
    },
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      videoId,
      text,
    }: { videoId: bigint; text: string }) => {
      if (!actor) throw new Error("Not authenticated");
      return getActor(actor).addComment(videoId, text);
    },
    onSuccess: (_data, { videoId }) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", videoId.toString()],
      });
    },
  });
}

export function usePostVideo() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      title: string;
      description: string;
      tags: string[];
      blobKey: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return getActor(actor).postVideo(
        params.title,
        params.description,
        params.tags,
        params.blobKey,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({
        queryKey: ["userVideos", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useIncrementView() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (videoId: bigint) => {
      if (!actor) return;
      await getActor(actor).incrementViewCount(videoId);
    },
  });
}
