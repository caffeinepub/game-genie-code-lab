import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GeneratedCode, Type, Type__1, UserGame } from "../backend";
import { useActor } from "./useActor";

export interface GameWithId extends Type {
  id: bigint;
}

export function useAllGames() {
  const { actor, isFetching } = useActor();
  return useQuery<GameWithId[]>({
    queryKey: ["allGames"],
    queryFn: async () => {
      if (!actor) return [];
      const ids = Array.from({ length: 20 }, (_, i) => BigInt(i));
      const results = await Promise.allSettled(
        ids.map((id) => actor.getGameById(id)),
      );
      return results
        .map((r, i) =>
          r.status === "fulfilled" ? { ...r.value, id: BigInt(i) } : null,
        )
        .filter((g): g is GameWithId => g !== null && !!g.name);
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSearchGames(query: string, genre: string) {
  const { actor, isFetching } = useActor();
  return useQuery<GameWithId[]>({
    queryKey: ["searchGames", query, genre],
    queryFn: async () => {
      if (!actor) return [];
      let results: Type[] = [];
      if (genre && genre !== "all") {
        results = await actor.searchGamesByGenre(genre);
      } else if (query.trim()) {
        results = await actor.searchGamesByName(query);
      } else {
        // Load by multiple genres to get all games
        const genres = [
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
        const searches = await Promise.all(
          genres.map((g) => actor.searchGamesByGenre(g)),
        );
        const all = searches.flat();
        // Deduplicate by name
        const seen = new Set<string>();
        results = all.filter((g) => {
          if (seen.has(g.name)) return false;
          seen.add(g.name);
          return true;
        });
      }
      // Match to IDs by fetching all games
      const allGames = await Promise.allSettled(
        Array.from({ length: 20 }, (_, i) => actor.getGameById(BigInt(i))),
      );
      const gameMap = new Map<string, bigint>();
      allGames.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value?.name) {
          gameMap.set(r.value.name, BigInt(i));
        }
      });
      return results
        .map((g) => ({ ...g, id: gameMap.get(g.name) ?? BigInt(-1) }))
        .filter((g) => g.id >= 0);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGameById(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<GameWithId | null>({
    queryKey: ["game", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      const g = await actor.getGameById(id);
      return { ...g, id };
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCheatCodes(gameId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Type__1[]>({
    queryKey: ["cheatCodes", gameId?.toString()],
    queryFn: async () => {
      if (!actor || gameId === null) return [];
      return actor.getCheatCodesForGame(gameId);
    },
    enabled: !!actor && !isFetching && gameId !== null,
  });
}

export function useUserLibrary() {
  const { actor, isFetching } = useActor();
  return useQuery<UserGame[]>({
    queryKey: ["userLibrary"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserLibrary();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCodeHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<GeneratedCode[]>({
    queryKey: ["codeHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getGeneratedCodesHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSeedData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.seedData();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allGames"] });
      queryClient.invalidateQueries({ queryKey: ["searchGames"] });
    },
  });
}

export function useSaveToLibrary() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gameId: bigint) => {
      if (!actor) throw new Error("No actor");
      await actor.saveGameToLibrary(gameId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userLibrary"] });
    },
  });
}

export function useGenerateCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gameId: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.generateRandomCode(gameId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codeHistory"] });
    },
  });
}
