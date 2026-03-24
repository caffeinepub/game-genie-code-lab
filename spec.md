# Game Genie Code Lab

## Current State
- 10 games in seed catalog, 5 cheat codes seeded
- Users can search games, add to library, generate random codes, view history
- GameDetailPage shows all cheat codes and a code generator
- No way for users to enter custom cheat codes

## Requested Changes (Diff)

### Add
- Backend: saveCustomCode(gameId, code, effect, category) for authenticated users
- Backend: getCustomCodesForUser() returns user's own custom codes
- Seed data: Expand to ~20 games with richer cheat code coverage
- Frontend: Custom Code Entry Form on GameDetailPage
- Frontend: Display user custom codes in separate section on GameDetailPage

### Modify
- seedData: expand games list and cheat codes
- GameDetailPage: add form section and custom codes display
- useQueries: add hooks for saveCustomCode and getCustomCodesForUser

### Remove
- Nothing

## Implementation Plan
1. Update backend main.mo: add saveCustomCode, getCustomCodesForUser, expand seedData
2. Regenerate bindings via generate_motoko_code
3. Update frontend GameDetailPage with form + custom codes section
4. Add hooks in useQueries
