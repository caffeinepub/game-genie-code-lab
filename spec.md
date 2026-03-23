# Game Genie Code Generator

## Current State
New project.

## Requested Changes (Diff)

### Add
- Game library where users can search and add games they play
- Random cheat code generator (Game Genie style) per game
- Modifications/tips list for each game (popular mods, cheats, exploits)
- Code history log showing generated codes and their effects
- Game categories (RPG, FPS, Platformer, etc.)
- Seed data with popular games and their known mods/cheats

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: Game records (name, genre, platform), CheatCode records (game, code, effect description), UserGame records (user's saved games)
2. Backend functions: addGame, getGames, searchGames, generateRandomCode, getModsForGame, saveUserGame, getUserGames
3. Seed popular games with known cheat codes and modifications
4. Frontend: Home page with game search, My Library tab, Code Generator tab, Mods list per game
