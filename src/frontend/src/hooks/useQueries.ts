import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GeneratedCode, Type, Type__1, UserGame } from "../backend";
import { useActor } from "./useActor";

export interface GameWithId extends Type {
  id: bigint;
}

export interface CustomCode extends Type__1 {
  id: string;
  isCustom: true;
}

const CUSTOM_CODES_KEY = "game_genie_custom_codes";

function loadCustomCodes(): CustomCode[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CODES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<CustomCode & { gameId: string }>;
    return parsed.map((c) => ({ ...c, gameId: BigInt(c.gameId) }));
  } catch {
    return [];
  }
}

function persistCustomCodes(codes: CustomCode[]): void {
  const serialized = codes.map((c) => ({ ...c, gameId: c.gameId.toString() }));
  localStorage.setItem(CUSTOM_CODES_KEY, JSON.stringify(serialized));
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
        const genres = [
          "RPG",
          "Action",
          "Platformer",
          "Shooter",
          "Fighting",
          "Adventure",
          "Sports",
          "Puzzle",
          "Racing",
          "Sandbox",
        ];
        const searches = await Promise.all(
          genres.map((g) => actor.searchGamesByGenre(g)),
        );
        const all = searches.flat();
        const seen = new Set<string>();
        results = all.filter((g) => {
          if (seen.has(g.name)) return false;
          seen.add(g.name);
          return true;
        });
      }
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

export function useCustomCodesForGame(gameId: bigint | null) {
  return useQuery<CustomCode[]>({
    queryKey: ["customCodes", gameId?.toString()],
    queryFn: async () => {
      if (gameId === null) return [];
      return loadCustomCodes().filter(
        (c) => c.gameId.toString() === gameId.toString(),
      );
    },
    enabled: gameId !== null,
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

export function useSaveCustomCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      gameId: bigint;
      code: string;
      effect: string;
      category: string;
    }) => {
      const existing = loadCustomCodes();
      const newCode: CustomCode = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        gameId: params.gameId,
        code: params.code,
        effect: params.effect,
        category: params.category,
        isCustom: true,
      };
      persistCustomCodes([...existing, newCode]);
      return newCode;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["customCodes", variables.gameId.toString()],
      });
    },
  });
}
