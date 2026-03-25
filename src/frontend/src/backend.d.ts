import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Timestamp = bigint;

export interface UserProfile {
    displayName: string;
}

export interface VideoPost {
    id: bigint;
    title: string;
    description: string;
    tags: Array<string>;
    uploader: Principal;
    createdAt: Timestamp;
    viewCount: bigint;
    likeCount: bigint;
    blobKey: string;
}

export interface Comment {
    id: bigint;
    videoId: bigint;
    author: Principal;
    text: string;
    createdAt: Timestamp;
}

export interface Tip {
    id: bigint;
    videoId: bigint;
    sender: Principal;
    recipient: Principal;
    amount: bigint;
    createdAt: Timestamp;
}

export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}

export interface backendInterface {
    // Auth
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserRole(): Promise<UserRole>;
    isCallerAdmin(): Promise<boolean>;
    // Profiles
    saveUserProfile(profile: UserProfile): Promise<void>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getMyProfile(): Promise<UserProfile | null>;
    // Videos
    postVideo(title: string, description: string, tags: Array<string>, blobKey: string): Promise<bigint>;
    getVideo(videoId: bigint): Promise<VideoPost | null>;
    incrementViewCount(videoId: bigint): Promise<void>;
    getFeed(limit: bigint, offset: bigint): Promise<Array<VideoPost>>;
    getTrendingFeed(limit: bigint, offset: bigint): Promise<Array<VideoPost>>;
    searchVideos(keyword: string): Promise<Array<VideoPost>>;
    getUserVideos(user: Principal): Promise<Array<VideoPost>>;
    // Likes
    likeVideo(videoId: bigint): Promise<boolean>;
    hasLikedVideo(videoId: bigint): Promise<boolean>;
    // Comments
    addComment(videoId: bigint, text: string): Promise<bigint>;
    getComments(videoId: bigint): Promise<Array<Comment>>;
    // Tips
    tipVideo(videoId: bigint, amount: bigint): Promise<bigint>;
    getVideoTips(videoId: bigint): Promise<bigint>;
    getUserTipsEarned(user: Principal): Promise<bigint>;
    getMyTipsEarned(): Promise<bigint>;
    // Blob storage
    _caffeineStorageCreateCertificate(blobHash: string): Promise<{ method: string; blob_hash: string }>;
}
