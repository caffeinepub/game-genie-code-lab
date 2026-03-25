# FairFeed

## Current State
The workspace has the Game Genie Code Lab app (game catalog, cheat codes). This is being replaced entirely with FairFeed, a fair short-form video sharing platform.

## Requested Changes (Diff)

### Add
- Video upload and browsing feed (chronological + engagement-ranked, no demographic bias)
- User accounts with profiles (display name, avatar)
- Video posts with title, description, tags
- Likes and comments on videos
- Tip jar system: viewers can send virtual tips (coins) to video creators; tip counts and totals shown on video
- Video detail page with player, likes, comments, and tip button
- Search by title/tags
- User profile page showing uploaded videos and total tips earned

### Modify
- Replace entire backend (Game Genie logic) with FairFeed video/social backend
- Replace entire frontend with FairFeed UI

### Remove
- All Game Genie / cheat code logic

## Implementation Plan
1. Select blob-storage (video files) and authorization (user accounts) components
2. Generate Motoko backend:
   - Video post management (upload metadata, list, get by id, search)
   - Like/unlike a video
   - Comment on a video (list comments)
   - Tip a video (add tips, get tip total per video, get tips received by user)
   - User profile (save/get display name)
   - Chronological + engagement feed
3. Build React frontend:
   - Feed page: scrollable video cards sorted by recency/engagement
   - Video detail page: video player, like button, tip button (choose coin amount), comments
   - Upload page: title, description, tags, file upload
   - Profile page: user's videos, total tips earned
   - Search bar filtering by title or tag
