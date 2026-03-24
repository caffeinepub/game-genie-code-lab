import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Type {
    name: string;
    description: string;
    platform: string;
    genre: string;
}
export type Timestamp = bigint;
export interface UserGame {
    userId: Principal;
    gameId: bigint;
    addedAt: Timestamp;
}
export interface Type__1 {
    code: string;
    gameId: bigint;
    effect: string;
    category: string;
}
export interface CheatCodeWithId {
    id: bigint;
    code: string;
    gameId: bigint;
    effect: string;
    category: string;
    isCustom: boolean;
}
export interface GeneratedCode {
    code: string;
    userId: Principal;
    generatedAt: Timestamp;
    gameId: bigint;
    effect: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCheatCode(cheatCode: Type__1): Promise<bigint>;
    addGame(game: Type): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    generateRandomCode(gameId: bigint): Promise<GeneratedCode>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCheatCodeById(cheatCodeId: bigint): Promise<Type__1>;
    getCheatCodesForGame(gameId: bigint): Promise<Array<Type__1>>;
    getCustomCodesForGame(gameId: bigint): Promise<Array<CheatCodeWithId>>;
    getCustomCodesForUser(): Promise<Array<CheatCodeWithId>>;
    getGameById(gameId: bigint): Promise<Type>;
    getGeneratedCodesHistory(): Promise<Array<GeneratedCode>>;
    getUserLibrary(): Promise<Array<UserGame>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveCustomCode(gameId: bigint, code: string, effect: string, category: string): Promise<bigint>;
    saveGameToLibrary(gameId: bigint): Promise<void>;
    searchGamesByGenre(genre: string): Promise<Array<Type>>;
    searchGamesByName(searchText: string): Promise<Array<Type>>;
    seedData(): Promise<void>;
}
