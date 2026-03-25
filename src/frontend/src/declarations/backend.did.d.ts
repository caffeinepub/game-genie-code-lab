/* eslint-disable */
// @ts-nocheck
import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';
import type { Principal } from '@icp-sdk/core/principal';

export type Timestamp = bigint;

export interface UserProfile { 'displayName': string }
export type UserRole = { 'admin': null } | { 'user': null } | { 'guest': null };

export interface VideoPost {
  'id': bigint;
  'title': string;
  'description': string;
  'tags': Array<string>;
  'uploader': Principal;
  'createdAt': Timestamp;
  'viewCount': bigint;
  'likeCount': bigint;
  'blobKey': string;
}

export interface Comment {
  'id': bigint;
  'videoId': bigint;
  'author': Principal;
  'text': string;
  'createdAt': Timestamp;
}

export interface Tip {
  'id': bigint;
  'videoId': bigint;
  'sender': Principal;
  'recipient': Principal;
  'amount': bigint;
  'createdAt': Timestamp;
}

export interface _SERVICE {
  '_initializeAccessControlWithSecret': ActorMethod<[string], undefined>;
  'assignCallerUserRole': ActorMethod<[Principal, UserRole], undefined>;
  'getCallerUserRole': ActorMethod<[], UserRole>;
  'isCallerAdmin': ActorMethod<[], boolean>;
  'saveUserProfile': ActorMethod<[UserProfile], undefined>;
  'getUserProfile': ActorMethod<[Principal], [] | [UserProfile]>;
  'getMyProfile': ActorMethod<[], [] | [UserProfile]>;
  'postVideo': ActorMethod<[string, string, Array<string>, string], bigint>;
  'getVideo': ActorMethod<[bigint], [] | [VideoPost]>;
  'incrementViewCount': ActorMethod<[bigint], undefined>;
  'getFeed': ActorMethod<[bigint, bigint], Array<VideoPost>>;
  'getTrendingFeed': ActorMethod<[bigint, bigint], Array<VideoPost>>;
  'searchVideos': ActorMethod<[string], Array<VideoPost>>;
  'getUserVideos': ActorMethod<[Principal], Array<VideoPost>>;
  'likeVideo': ActorMethod<[bigint], boolean>;
  'hasLikedVideo': ActorMethod<[bigint], boolean>;
  'addComment': ActorMethod<[bigint, string], bigint>;
  'getComments': ActorMethod<[bigint], Array<Comment>>;
  'tipVideo': ActorMethod<[bigint, bigint], bigint>;
  'getVideoTips': ActorMethod<[bigint], bigint>;
  'getUserTipsEarned': ActorMethod<[Principal], bigint>;
  'getMyTipsEarned': ActorMethod<[], bigint>;
  '_caffeineStorageCreateCertificate': ActorMethod<[string], { method: string; blob_hash: string }>;
  '_caffeineStorageBlobIsLive': ActorMethod<[Uint8Array], boolean>;
  '_caffeineStorageBlobsToDelete': ActorMethod<[], Array<Uint8Array>>;
  '_caffeineStorageConfirmBlobDeletion': ActorMethod<[Array<Uint8Array>], undefined>;
  '_caffeineStorageRefillCashier': ActorMethod<[[] | [{ proposed_top_up_amount: [] | [bigint] }]], { success: [] | [boolean]; topped_up_amount: [] | [bigint] }>;
  '_caffeineStorageUpdateGatewayPrincipals': ActorMethod<[], undefined>;
}
export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
