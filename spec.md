# Game Genie Code Lab

## Current State
- Search tab has a genre filter (pill buttons) and a text search input
- Games have a `platform` field in the backend (e.g., NES, SNES, PlayStation, PC, Mobile, Switch, etc.)
- No platform filter exists in the UI
- An info banner explains web apps can't scan the device
- Library and Code History tabs exist

## Requested Changes (Diff)

### Add
- Platform filter pill buttons row below the genre filter row in the Search tab
- "Detect My Device" button that uses browser/UA detection to auto-select the most relevant platform filter (e.g., iOS -> Mobile, Windows -> PC, Android -> Mobile/Android)
- Platform filter applies in combination with genre filter and search query
- Filter logic: if both genre and platform are selected, filter by both; if only one, filter by that
- Update info banner to mention the detect device feature

### Modify
- `HomePage` component: add `selectedPlatform` state, add platform filter row, wire filtering logic to also filter `displayedGames` by platform on the frontend (since backend doesn't have a `searchGamesByPlatform` method, apply platform filtering client-side after fetching all games)
- Replace info banner text to explain the device detect feature
- The "Detect My Device" button replaces the old static warning, auto-selects the platform and scrolls to the filtered results

### Remove
- Static info banner warning about web app scanning limitation (replace with interactive detect button in the filter area)

## Implementation Plan
1. Add `PLATFORMS` constant array with all platforms in the catalog: All, NES, SNES, Game Boy, GBA, DS, 3DS, N64, Genesis, PlayStation, PS2, PS3, PS4, PS5, PSP, Xbox, Xbox 360, Xbox One, Xbox Series X, Wii, Wii U, Switch, PC, Mobile
2. Add `selectedPlatform` state (default "All") in `HomePage`
3. Add `detectMyDevice()` function using `navigator.userAgent` and `navigator.platform` to return a best-guess platform string
4. Add a "Detect My Device" button with a scan/chip icon in the filter area
5. Add platform filter pill row below genre filter
6. Update `displayedGames` memo to also filter by `selectedPlatform` client-side against `allGames`
7. When platform is selected (or detected), ensure search tab is active and results update
