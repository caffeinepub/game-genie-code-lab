import Array "mo:core/Array";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinBlobStorage "blob-storage/Mixin";

actor {
  type Timestamp = Int;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinBlobStorage();

  // ── MIGRATION: old Game Genie stable variables kept for upgrade compatibility ──
  // These are never used by new code but must be declared so the upgrade
  // checker does not reject them as "implicitly discarded".

  type _OldGameType       = { name : Text; genre : Text; platform : Text; description : Text };
  type _OldCheatCodeType  = { gameId : Nat; code : Text; effect : Text; category : Text };
  type _OldCheatCodeWithId = { id : Nat; gameId : Nat; code : Text; effect : Text; category : Text; isCustom : Bool };
  type _OldUserGame       = { userId : Principal; gameId : Nat; addedAt : Int };
  type _OldGeneratedCode  = { userId : Principal; gameId : Nat; code : Text; effect : Text; generatedAt : Int };
  type _OldUserProfile    = { name : Text };

  let catalog          = Map.empty<Nat, _OldGameType>();
  let cheatCodes       = Map.empty<Nat, _OldCheatCodeType>();
  let customCodes      = Map.empty<Nat, _OldCheatCodeWithId>();
  let userCustomCodes  = Map.empty<Principal, List.List<Nat>>();
  let userGames        = Map.empty<Principal, List.List<_OldUserGame>>();
  let generatedCodes   = Map.empty<Principal, List.List<_OldGeneratedCode>>();
  var nextGameId          : Nat = 0;
  var nextCheatCodeId     : Nat = 0;
  var nextGeneratedCodeId : Nat = 0;
  var nextCustomCodeId    : Nat = 0;
  // Old userProfiles kept with original type to satisfy upgrade check.
  // New code uses userProfilesV2.
  let userProfiles = Map.empty<Principal, _OldUserProfile>();

  // ── User Profiles (v2) ──────────────────────────────────────────────────

  public type UserProfile = {
    displayName : Text;
  };

  let userProfilesV2 = Map.empty<Principal, UserProfile>();

  public shared ({ caller }) func saveUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    userProfilesV2.add(caller, profile);
  };

  public query func getUserProfile(user : Principal) : async ?UserProfile {
    userProfilesV2.get(user);
  };

  public query ({ caller }) func getMyProfile() : async ?UserProfile {
    userProfilesV2.get(caller);
  };

  // ── Videos ─────────────────────────────────────────────────────────────────

  public type VideoPost = {
    id : Nat;
    title : Text;
    description : Text;
    tags : [Text];
    uploader : Principal;
    createdAt : Timestamp;
    viewCount : Nat;
    likeCount : Nat;
    blobKey : Text;
  };

  let videos = Map.empty<Nat, VideoPost>();
  var nextVideoId : Nat = 0;

  public shared ({ caller }) func postVideo(
    title : Text,
    description : Text,
    tags : [Text],
    blobKey : Text,
  ) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let id = nextVideoId;
    let video : VideoPost = {
      id;
      title;
      description;
      tags;
      uploader = caller;
      createdAt = Time.now();
      viewCount = 0;
      likeCount = 0;
      blobKey;
    };
    videos.add(id, video);
    nextVideoId += 1;
    id;
  };

  public query func getVideo(videoId : Nat) : async ?VideoPost {
    videos.get(videoId);
  };

  public shared (_) func incrementViewCount(videoId : Nat) : async () {
    switch (videos.get(videoId)) {
      case (null) {};
      case (?v) {
        videos.add(videoId, { v with viewCount = v.viewCount + 1 });
      };
    };
  };

  func sliceArray<T>(arr : [T], offset : Nat, lim : Nat) : [T] {
    let end = if (offset + lim > arr.size()) arr.size() else offset + lim;
    if (offset >= arr.size()) { [] } else { arr.sliceToArray(offset, end) };
  };

  // Feed: newest first
  public query func getFeed(limit : Nat, offset : Nat) : async [VideoPost] {
    let all = List.empty<VideoPost>();
    for ((_, v) in videos.entries()) { all.add(v) };
    let sorted = all.toArray().sort(func(a : VideoPost, b : VideoPost) : { #less; #equal; #greater } {
      Int.compare(b.createdAt, a.createdAt);
    });
    sliceArray(sorted, offset, limit);
  };

  // Trending: by (likes + views)
  public query func getTrendingFeed(limit : Nat, offset : Nat) : async [VideoPost] {
    let all = List.empty<VideoPost>();
    for ((_, v) in videos.entries()) { all.add(v) };
    let sorted = all.toArray().sort(func(a : VideoPost, b : VideoPost) : { #less; #equal; #greater } {
      Nat.compare(b.likeCount + b.viewCount, a.likeCount + a.viewCount);
    });
    sliceArray(sorted, offset, limit);
  };

  public query func searchVideos(keyword : Text) : async [VideoPost] {
    let kw = keyword.toLower();
    let results = List.empty<VideoPost>();
    for ((_, v) in videos.entries()) {
      if (v.title.toLower().contains(#text kw) or v.description.toLower().contains(#text kw)) {
        results.add(v);
      } else {
        for (tag in v.tags.values()) {
          if (tag.toLower().contains(#text kw)) {
            results.add(v);
          };
        };
      };
    };
    results.toArray();
  };

  public query func getUserVideos(user : Principal) : async [VideoPost] {
    let results = List.empty<VideoPost>();
    for ((_, v) in videos.entries()) {
      if (v.uploader == user) { results.add(v) };
    };
    results.toArray().sort(func(a : VideoPost, b : VideoPost) : { #less; #equal; #greater } {
      Int.compare(b.createdAt, a.createdAt);
    });
  };

  // ── Likes ──────────────────────────────────────────────────────────────────

  let likes = Map.empty<Text, Bool>();

  public shared ({ caller }) func likeVideo(videoId : Nat) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    let key = caller.toText() # ":" # videoId.toText();
    let alreadyLiked = switch (likes.get(key)) {
      case (?true) { true };
      case (_) { false };
    };
    switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?v) {
        if (alreadyLiked) {
          likes.add(key, false);
          let newCount : Nat = if (v.likeCount > 0) v.likeCount - 1 else 0;
          videos.add(videoId, { v with likeCount = newCount });
          false;
        } else {
          likes.add(key, true);
          videos.add(videoId, { v with likeCount = v.likeCount + 1 });
          true;
        };
      };
    };
  };

  public query ({ caller }) func hasLikedVideo(videoId : Nat) : async Bool {
    let key = caller.toText() # ":" # videoId.toText();
    switch (likes.get(key)) {
      case (?true) { true };
      case (_) { false };
    };
  };

  // ── Comments ───────────────────────────────────────────────────────────────

  public type Comment = {
    id : Nat;
    videoId : Nat;
    author : Principal;
    text : Text;
    createdAt : Timestamp;
  };

  let comments = Map.empty<Nat, Comment>();
  var nextCommentId : Nat = 0;

  public shared ({ caller }) func addComment(videoId : Nat, text : Text) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    if (text.size() == 0) { Runtime.trap("Comment cannot be empty") };
    let id = nextCommentId;
    comments.add(id, { id; videoId; author = caller; text; createdAt = Time.now() });
    nextCommentId += 1;
    id;
  };

  public query func getComments(videoId : Nat) : async [Comment] {
    let results = List.empty<Comment>();
    for ((_, c) in comments.entries()) {
      if (c.videoId == videoId) { results.add(c) };
    };
    results.toArray().sort(func(a : Comment, b : Comment) : { #less; #equal; #greater } {
      Int.compare(a.createdAt, b.createdAt);
    });
  };

  // ── Tips ───────────────────────────────────────────────────────────────────

  public type Tip = {
    id : Nat;
    videoId : Nat;
    sender : Principal;
    recipient : Principal;
    amount : Nat;
    createdAt : Timestamp;
  };

  let tips = Map.empty<Nat, Tip>();
  var nextTipId : Nat = 0;

  let tipBalances = Map.empty<Principal, Nat>();

  public shared ({ caller }) func tipVideo(videoId : Nat, amount : Nat) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    if (amount == 0 or amount > 500) { Runtime.trap("Amount must be 1-500") };
    let video = switch (videos.get(videoId)) {
      case (null) { Runtime.trap("Video not found") };
      case (?v) { v };
    };
    if (video.uploader == caller) { Runtime.trap("Cannot tip your own video") };
    let id = nextTipId;
    tips.add(id, {
      id;
      videoId;
      sender = caller;
      recipient = video.uploader;
      amount;
      createdAt = Time.now();
    });
    let current = switch (tipBalances.get(video.uploader)) {
      case (null) { 0 };
      case (?n) { n };
    };
    tipBalances.add(video.uploader, current + amount);
    nextTipId += 1;
    id;
  };

  public query func getVideoTips(videoId : Nat) : async Nat {
    var total : Nat = 0;
    for ((_, t) in tips.entries()) {
      if (t.videoId == videoId) { total += t.amount };
    };
    total;
  };

  public query func getUserTipsEarned(user : Principal) : async Nat {
    switch (tipBalances.get(user)) {
      case (null) { 0 };
      case (?n) { n };
    };
  };

  public query ({ caller }) func getMyTipsEarned() : async Nat {
    switch (tipBalances.get(caller)) {
      case (null) { 0 };
      case (?n) { n };
    };
  };
};
