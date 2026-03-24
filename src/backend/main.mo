import Array "mo:core/Array";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type Timestamp = Int;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.add(caller, profile);
  };

  module Game {
    public type Type = {
      name : Text;
      genre : Text;
      platform : Text;
      description : Text;
    };

    public func compare(game1 : Type, game2 : Type) : Order.Order {
      switch (Text.compare(game1.name, game2.name)) {
        case (#equal) { Text.compare(game1.genre, game2.genre) };
        case (order) { order };
      };
    };
  };

  module CheatCode {
    public type Type = {
      gameId : Nat;
      code : Text;
      effect : Text;
      category : Text;
    };

    public func compare(code1 : Type, code2 : Type) : Order.Order {
      switch (Text.compare(code1.effect, code2.effect)) {
        case (#equal) { Text.compare(code1.category, code2.category) };
        case (order) { order };
      };
    };
  };

  public type CheatCodeWithId = {
    id : Nat;
    gameId : Nat;
    code : Text;
    effect : Text;
    category : Text;
    isCustom : Bool;
  };

  type UserGame = {
    userId : Principal;
    gameId : Nat;
    addedAt : Timestamp;
  };

  module UserGame {
    public func compareByTimestamp(userGame1 : UserGame, userGame2 : UserGame) : Order.Order {
      Int.compare(userGame1.addedAt, userGame2.addedAt);
    };
  };

  type GeneratedCode = {
    userId : Principal;
    gameId : Nat;
    code : Text;
    effect : Text;
    generatedAt : Timestamp;
  };

  module GeneratedCode {
    public func compare(code1 : GeneratedCode, code2 : GeneratedCode) : Order.Order {
      Int.compare(code2.generatedAt, code1.generatedAt);
    };
  };

  let catalog = Map.empty<Nat, Game.Type>();
  let cheatCodes = Map.empty<Nat, CheatCode.Type>();
  let customCodes = Map.empty<Nat, CheatCodeWithId>();
  let userCustomCodes = Map.empty<Principal, List.List<Nat>>();
  let userGames = Map.empty<Principal, List.List<UserGame>>();
  let generatedCodes = Map.empty<Principal, List.List<GeneratedCode>>();

  var nextGameId = 0;
  var nextCheatCodeId = 0;
  var nextGeneratedCodeId = 0;
  var nextCustomCodeId = 0;

  public query func searchGamesByName(searchText : Text) : async [Game.Type] {
    let matches = List.empty<Game.Type>();
    for ((_, game) in catalog.entries()) {
      if (game.name.toLower().contains(#text(searchText.toLower()))) {
        matches.add(game);
      };
    };
    matches.toArray();
  };

  public query func searchGamesByGenre(genre : Text) : async [Game.Type] {
    let matches = List.empty<Game.Type>();
    for ((_, game) in catalog.entries()) {
      if (game.genre.toLower().contains(#text(genre.toLower()))) {
        matches.add(game);
      };
    };
    matches.toArray();
  };

  public query func getCheatCodesForGame(gameId : Nat) : async [CheatCode.Type] {
    let codes = List.empty<CheatCode.Type>();
    for ((_, cheatCode) in cheatCodes.entries()) {
      if (cheatCode.gameId == gameId) {
        codes.add(cheatCode);
      };
    };
    codes.toArray();
  };

  public query func getGameById(gameId : Nat) : async Game.Type {
    switch (catalog.get(gameId)) {
      case (null) { Runtime.trap("Game not found") };
      case (?game) { game };
    };
  };

  public query func getCheatCodeById(cheatCodeId : Nat) : async CheatCode.Type {
    switch (cheatCodes.get(cheatCodeId)) {
      case (null) { Runtime.trap("Cheat code not found") };
      case (?code) { code };
    };
  };

  public query func getCustomCodesForGame(gameId : Nat) : async [CheatCodeWithId] {
    let results = List.empty<CheatCodeWithId>();
    for ((_, code) in customCodes.entries()) {
      if (code.gameId == gameId) {
        results.add(code);
      };
    };
    results.toArray();
  };

  public query ({ caller }) func getCustomCodesForUser() : async [CheatCodeWithId] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let ids = switch (userCustomCodes.get(caller)) {
      case (null) { return [] };
      case (?list) { list };
    };
    let results = List.empty<CheatCodeWithId>();
    for (id in ids.values()) {
      switch (customCodes.get(id)) {
        case (null) {};
        case (?code) { results.add(code) };
      };
    };
    results.toArray();
  };

  public shared ({ caller }) func saveCustomCode(gameId : Nat, code : Text, effect : Text, category : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save custom codes");
    };
    let id = nextCustomCodeId;
    let customCode : CheatCodeWithId = {
      id;
      gameId;
      code;
      effect;
      category;
      isCustom = true;
    };
    customCodes.add(id, customCode);
    let existingIds = switch (userCustomCodes.get(caller)) {
      case (null) { List.empty<Nat>() };
      case (?list) { list };
    };
    existingIds.add(id);
    userCustomCodes.add(caller, existingIds);
    nextCustomCodeId += 1;
    id;
  };

  public shared ({ caller }) func generateRandomCode(gameId : Nat) : async GeneratedCode {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };

    let _ = switch (catalog.get(gameId)) {
      case (null) { Runtime.trap("Game not found") };
      case (?game) { game };
    };

    let codeEffect = getRandomEffect(gameId);
    let code = generateUniqueCode();
    let generatedCode : GeneratedCode = {
      userId = caller;
      gameId;
      code;
      effect = codeEffect;
      generatedAt = Time.now();
    };

    storeGeneratedCode(caller, generatedCode);
    nextGeneratedCodeId += 1;
    generatedCode;
  };

  func getRandomEffect(gameId : Nat) : Text {
    let codes = List.empty<Text>();
    for ((_, cheatCode) in cheatCodes.entries()) {
      if (cheatCode.gameId == gameId) {
        codes.add(cheatCode.effect);
      };
    };
    if (codes.isEmpty()) { "Unknown Effect" } else {
      let codesArray = codes.toArray();
      codesArray[nextGeneratedCodeId % codesArray.size()];
    };
  };

  func generateUniqueCode() : Text {
    let prefix = ["GG", "XZ", "KS", "UP", "LV"];
    let suffix = ["A9", "F7", "C3", "Z1", "B8"];
    let p = prefix[nextGeneratedCodeId % prefix.size()];
    let s = suffix[nextGeneratedCodeId % suffix.size()];
    p # "-" # nextGeneratedCodeId.toText() # "-" # s;
  };

  public shared ({ caller }) func saveGameToLibrary(gameId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };

    let userGame : UserGame = {
      userId = caller;
      gameId;
      addedAt = Time.now();
    };

    let existingGames = switch (userGames.get(caller)) {
      case (null) { List.empty<UserGame>() };
      case (?list) { list };
    };
    existingGames.add(userGame);
    userGames.add(caller, existingGames);
  };

  public query ({ caller }) func getUserLibrary() : async [UserGame] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (userGames.get(caller)) {
      case (null) { [] };
      case (?list) { list.toArray().sort(UserGame.compareByTimestamp) };
    };
  };

  public query ({ caller }) func getGeneratedCodesHistory() : async [GeneratedCode] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (generatedCodes.get(caller)) {
      case (null) { [] };
      case (?list) { list.toArray() };
    };
  };

  func storeGeneratedCode(userId : Principal, code : GeneratedCode) {
    let existingCodes = switch (generatedCodes.get(userId)) {
      case (null) { List.empty<GeneratedCode>() };
      case (?list) { list };
    };
    existingCodes.add(code);
    generatedCodes.add(userId, existingCodes);
  };

  public shared ({ caller }) func addGame(game : Game.Type) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    let gameId = nextGameId;
    catalog.add(gameId, game);
    nextGameId += 1;
    gameId;
  };

  public shared ({ caller }) func addCheatCode(cheatCode : CheatCode.Type) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    let cheatCodeId = nextCheatCodeId;
    cheatCodes.add(cheatCodeId, cheatCode);
    nextCheatCodeId += 1;
    cheatCodeId;
  };

  public shared func seedData() : async () {
    if (not catalog.isEmpty()) { return };

    // ─── GAMES ─────────────────────────────────────────────────────────────────
    // Index  0 – 19 : classic retro
    // Index 20 – 59 : modern / all-platform
    let games : [Game.Type] = [
      // 0-19 Classic
      { name = "Super Mario Bros"; genre = "Platformer"; platform = "NES"; description = "Classic Nintendo platformer where Mario saves Princess Peach" },
      { name = "The Legend of Zelda"; genre = "Adventure"; platform = "NES"; description = "Explore Hyrule and defeat Ganon to rescue Princess Zelda" },
      { name = "Metroid"; genre = "Action"; platform = "NES"; description = "Sci-fi action game starring bounty hunter Samus Aran" },
      { name = "Mega Man 2"; genre = "Platformer"; platform = "NES"; description = "Battle Robot Masters and defeat Dr. Wily" },
      { name = "Pokemon Red"; genre = "RPG"; platform = "Game Boy"; description = "Catch and train monsters to become Pokemon Champion" },
      { name = "Tetris"; genre = "Puzzle"; platform = "Game Boy"; description = "Timeless tile-matching puzzle game" },
      { name = "Super Mario Land"; genre = "Platformer"; platform = "Game Boy"; description = "Mario's handheld adventure across four kingdoms" },
      { name = "Street Fighter II"; genre = "Fighting"; platform = "SNES"; description = "Legendary one-on-one fighting game with global warriors" },
      { name = "Super Metroid"; genre = "Action"; platform = "SNES"; description = "Atmospheric sci-fi exploration on planet Zebes" },
      { name = "Chrono Trigger"; genre = "RPG"; platform = "SNES"; description = "Epic time-travel RPG with multiple endings" },
      { name = "Sonic the Hedgehog"; genre = "Platformer"; platform = "Genesis"; description = "Sega's speedy blue mascot races through colorful zones" },
      { name = "Streets of Rage 2"; genre = "Action"; platform = "Genesis"; description = "Side-scrolling beat-em-up through crime-ridden streets" },
      { name = "Super Mario 64"; genre = "Platformer"; platform = "N64"; description = "Nintendo's groundbreaking 3D platformer" },
      { name = "GoldenEye 007"; genre = "FPS"; platform = "N64"; description = "Iconic James Bond first-person shooter" },
      { name = "The Legend of Zelda: Ocarina of Time"; genre = "Adventure"; platform = "N64"; description = "3D Zelda epic across time in Hyrule" },
      { name = "Gran Turismo"; genre = "Racing"; platform = "PS1"; description = "Realistic car simulation with hundreds of vehicles" },
      { name = "Final Fantasy VII"; genre = "RPG"; platform = "PS1"; description = "Cloud Strife battles Sephiroth to save the Planet" },
      { name = "Crash Bandicoot"; genre = "Platformer"; platform = "PS1"; description = "Wacky marsupial hero on a tropical island adventure" },
      { name = "Minecraft"; genre = "Sandbox"; platform = "Multi"; description = "Infinite block-building and survival world" },
      { name = "GTA V"; genre = "Action"; platform = "Multi"; description = "Open-world crime epic set in Los Santos" },
      // 20-29 PS2 / Xbox / GBA / DS era
      { name = "God of War"; genre = "Action"; platform = "PS2"; description = "Kratos unleashes divine fury against the gods of Olympus" },
      { name = "Grand Theft Auto: San Andreas"; genre = "Action"; platform = "PS2"; description = "CJ navigates gang life across a sprawling open world" },
      { name = "Shadow of the Colossus"; genre = "Adventure"; platform = "PS2"; description = "Climb and defeat towering colossi to revive a lost soul" },
      { name = "Kingdom Hearts II"; genre = "RPG"; platform = "PS2"; description = "Sora and friends fight darkness across Disney worlds" },
      { name = "Pokemon FireRed"; genre = "RPG"; platform = "GBA"; description = "Enhanced remake of the original Kanto adventure" },
      { name = "The Legend of Zelda: Minish Cap"; genre = "Adventure"; platform = "GBA"; description = "Link shrinks to the size of a bug to save Hyrule" },
      { name = "Halo 2"; genre = "FPS"; platform = "Xbox"; description = "Master Chief and the Arbiter battle the Covenant and Flood" },
      { name = "Pokemon Diamond"; genre = "RPG"; platform = "DS"; description = "Explore the Sinnoh region and catch 'em all" },
      { name = "New Super Mario Bros"; genre = "Platformer"; platform = "DS"; description = "Classic 2D Mario action in a fresh portable adventure" },
      { name = "The World Ends with You"; genre = "RPG"; platform = "DS"; description = "Street fashion and psychic battles in Shibuya" },
      // 30-39 PS3 / Xbox 360 / Wii
      { name = "The Last of Us"; genre = "Action"; platform = "PS3"; description = "Joel and Ellie survive a post-apocalyptic fungal outbreak" },
      { name = "Uncharted 2"; genre = "Adventure"; platform = "PS3"; description = "Nathan Drake hunts for the Cintamani Stone across the globe" },
      { name = "Red Dead Redemption"; genre = "Action"; platform = "Xbox 360"; description = "Outlaw John Marston hunts his former gang across the frontier" },
      { name = "Gears of War 3"; genre = "FPS"; platform = "Xbox 360"; description = "Marcus Fenix leads the final battle against the Locust Horde" },
      { name = "Skyrim"; genre = "RPG"; platform = "Xbox 360"; description = "The Dragonborn embarks on an epic quest to save Skyrim" },
      { name = "Super Mario Galaxy"; genre = "Platformer"; platform = "Wii"; description = "Mario soars through gravity-defying space kingdoms" },
      { name = "The Legend of Zelda: Twilight Princess"; genre = "Adventure"; platform = "Wii"; description = "Link battles the twilight realm to restore light to Hyrule" },
      { name = "Wii Sports"; genre = "Sports"; platform = "Wii"; description = "Motion-controlled tennis, bowling, golf and more" },
      { name = "Monster Hunter Tri"; genre = "Action"; platform = "Wii"; description = "Hunt colossal creatures in rich open environments" },
      { name = "Xenoblade Chronicles"; genre = "RPG"; platform = "Wii"; description = "Shulk wields the Monado blade against mechanical Mechon" },
      // 40-49 PS4 / Xbox One / 3DS / PSP
      { name = "God of War (2018)"; genre = "Action"; platform = "PS4"; description = "Kratos and son Atreus journey through Norse mythology" },
      { name = "Spider-Man"; genre = "Action"; platform = "PS4"; description = "Peter Parker swings through a stunning open-world New York" },
      { name = "Bloodborne"; genre = "Action"; platform = "PS4"; description = "Hunter battles cosmic horrors in the gothic city of Yharnam" },
      { name = "Horizon Zero Dawn"; genre = "Action"; platform = "PS4"; description = "Aloy hunts robotic creatures in a post-apocalyptic wilderness" },
      { name = "Halo 5: Guardians"; genre = "FPS"; platform = "Xbox One"; description = "Master Chief and Spartan Locke clash over the fate of the galaxy" },
      { name = "Forza Horizon 4"; genre = "Racing"; platform = "Xbox One"; description = "Open-world racing across a stunning seasonal Britain" },
      { name = "Pokemon X"; genre = "RPG"; platform = "3DS"; description = "First fully 3D Pokemon adventure in the Kalos region" },
      { name = "Super Mario 3D Land"; genre = "Platformer"; platform = "3DS"; description = "Blend of classic and 3D Mario in a handheld adventure" },
      { name = "Monster Hunter 4 Ultimate"; genre = "Action"; platform = "3DS"; description = "Hunt hundreds of creatures solo or co-op" },
      { name = "God of War: Ghost of Sparta"; genre = "Action"; platform = "PSP"; description = "Kratos uncovers the fate of his brother Deimos" },
      // 50-59 PS5 / Xbox Series / Switch / PC / Mobile
      { name = "Elden Ring"; genre = "RPG"; platform = "PS5"; description = "Explore the Lands Between and claim the Elden Ring" },
      { name = "Demon's Souls"; genre = "RPG"; platform = "PS5"; description = "Stunning remake of the legendary FromSoftware classic" },
      { name = "Halo Infinite"; genre = "FPS"; platform = "Xbox Series X"; description = "Master Chief returns to the ring world to face the Banished" },
      { name = "Forza Motorsport"; genre = "Racing"; platform = "Xbox Series X"; description = "Precision track racing with next-gen physics" },
      { name = "The Legend of Zelda: Breath of the Wild"; genre = "Adventure"; platform = "Switch"; description = "Open-air Zelda with full physics and freedom across Hyrule" },
      { name = "Super Smash Bros. Ultimate"; genre = "Fighting"; platform = "Switch"; description = "Every fighter ever in the ultimate crossover brawler" },
      { name = "Cyberpunk 2077"; genre = "RPG"; platform = "PC"; description = "V navigates the neon dystopia of Night City" },
      { name = "The Witcher 3: Wild Hunt"; genre = "RPG"; platform = "PC"; description = "Geralt searches for his daughter across a war-torn open world" },
      { name = "Clash Royale"; genre = "Strategy"; platform = "Mobile"; description = "Real-time tower defense and card battles on your phone" },
      { name = "Genshin Impact"; genre = "RPG"; platform = "Mobile"; description = "Gacha action-RPG with a vast open world to explore" },
    ];

    // ─── CHEAT CODES ───────────────────────────────────────────────────────────
    // Format: (gameId, code, effect, category)
    let codes : [(Nat, Text, Text, Text)] = [
      // Classic
      (0, "SZNZUP", "Infinite Lives", "Unlimited"),
      (0, "AATOZE", "Start with 10 Lives", "Lives"),
      (0, "SZKZLG", "Fire Mario from Start", "Power-Up"),
      (1, "KZXPYP", "God Mode", "Invincibility"),
      (1, "AANLZZ", "Max Rupees", "Currency"),
      (1, "SUKLZA", "All Items Unlocked", "Unlock"),
      (2, "XZLSZP", "Super Speed", "Speed"),
      (2, "GZNYKP", "Infinite Missiles", "Ammo"),
      (3, "EIUPYX", "Infinite Energy", "Health"),
      (3, "SZKXUP", "All Weapons", "Unlock"),
      (4, "KSKVYM", "Instant Win", "Win"),
      (4, "AAZPKK", "Infinite PP", "Unlimited"),
      (4, "UPAXZK", "Max Experience", "Stats"),
      (7, "TZKZUP", "Infinite Health", "Invincibility"),
      (7, "AAZNLZ", "Super Damage", "Attack"),
      (10, "GGSNZK", "Debug Mode", "Debug"),
      (10, "AAZPAZ", "Infinite Rings", "Unlimited"),
      (10, "TGZNKA", "Super Sonic Always", "Power-Up"),
      (12, "STAR99", "All 120 Stars", "Unlock"),
      (12, "XZLPUP", "Moon Jump", "Movement"),
      (13, "INVNBL", "Invincibility", "Invincibility"),
      (13, "ALLGNS", "All Guns", "Weapons"),
      (13, "BIGHED", "Big Head Mode", "Cheats"),
      (14, "INFHRT", "Infinite Hearts", "Health"),
      (14, "ALLITM", "All Items", "Unlock"),
      (16, "MAXGIL", "Max Gil", "Currency"),
      (16, "LVLMAX", "Max Level", "Stats"),
      (16, "INFIMP", "Infinite MP", "Unlimited"),
      (18, "CRTVMD", "Creative Mode", "Unlock"),
      (18, "KEEPIT", "Keep Inventory on Death", "Cheats"),
      (19, "TURTLE", "Max Health & Armor", "Health"),
      (19, "LWYRP",  "Reduce Wanted Level", "Cheat"),
      (19, "SKYFALL","Spawn Parachute", "Item"),
      // PS2 / Xbox / GBA / DS
      (20, "SPARTN", "Spartan Rage Unlimited", "Unlimited"),
      (20, "GODBLK", "Infinite Health", "Invincibility"),
      (21, "HESOYAM","Health, Armor & Money", "Health"),
      (21, "ROCKETMAN","Jetpack", "Item"),
      (21, "BTTLTNK","Spawn Tank", "Item"),
      (22, "LASTSH", "Unlimited Stamina", "Unlimited"),
      (22, "DORMIN", "Reveal All Colossi", "Unlock"),
      (23, "SORAUP", "Max Drive Gauge", "Stats"),
      (23, "MICKEY", "All Magic Unlocked", "Unlock"),
      (24, "MASTERB","Master Ball x99", "Item"),
      (24, "EXPMAX", "Max Experience", "Stats"),
      (26, "NOAMMO", "Infinite Ammo", "Ammo"),
      (26, "ALLKEYS","All Skull Doors Open", "Unlock"),
      (27, "PKMBALL","Unlimited Poke Balls", "Item"),
      (27, "SHINYFX", "Shiny Pokemon Encounter", "Cheats"),
      (28, "MARST",  "Invincible Mario", "Invincibility"),
      (28, "MUSHX9", "9 Power-Ups", "Power-Up"),
      // PS3 / 360 / Wii
      (30, "ELLIESV","Infinite Ammo", "Ammo"),
      (30, "LASTDAY","Survivor Mode Unlocked", "Unlock"),
      (31, "UNCRTED","Unlimited Grenades", "Ammo"),
      (31, "FASTCL", "Faster Climbing", "Speed"),
      (32, "JOHNMRS","Infinite Dead-Eye", "Unlimited"),
      (32, "WANTD0", "Clear Wanted Level", "Cheat"),
      (33, "GEARSS", "Infinite Ammo", "Ammo"),
      (33, "BERSER", "Unlimited Berserk", "Unlimited"),
      (34, "FUSCLE", "Fus Ro Dah Instant Kill", "Attack"),
      (34, "DOVAH",  "Dragon Shout Cooldown 0", "Speed"),
      (34, "GOLDD",  "Max Gold", "Currency"),
      (35, "STARUP", "Invincible Stars Always", "Invincibility"),
      (35, "LAUNCH", "Mega Jump", "Movement"),
      (36, "MIDNA",  "Infinite Wolf Link Meter", "Unlimited"),
      (37, "WSPORT", "Max All Skills", "Stats"),
      (38, "MHWILD", "Infinite Zenny", "Currency"),
      (38, "MONHNT", "All Weapons Crafted", "Unlock"),
      (39, "MONADO", "Monado Arts Always On", "Power-Up"),
      // PS4 / Xbox One / 3DS / PSP
      (40, "KRATOS", "Rage of Sparta Unlimited", "Unlimited"),
      (40, "VALHLL", "Max XP", "Stats"),
      (41, "SPDRM",  "Unlimited Web Fluid", "Unlimited"),
      (41, "SUITS",  "All Suits Unlocked", "Unlock"),
      (42, "BLOODB", "Infinite Insight", "Currency"),
      (42, "HUNTRM", "All Runes Unlocked", "Unlock"),
      (43, "HORIZN", "Infinite Arrows", "Ammo"),
      (43, "MACHNE", "All Mounts Available", "Unlock"),
      (44, "SPRTNS", "Unlimited Ammo", "Ammo"),
      (44, "LOCKE",  "All Skulls", "Unlock"),
      (45, "FORZAH", "All Cars Unlocked", "Unlock"),
      (45, "SEASN",  "All Seasons Active", "Cheats"),
      (46, "CATCHM", "Max Friendship", "Stats"),
      (46, "MEGAEV", "Instant Mega Evolution", "Power-Up"),
      (47, "BOWSUP", "Infinite Power-Ups", "Unlimited"),
      (48, "MHULTI", "Infinite Zenny", "Currency"),
      (49, "GHOSTSP","Infinite Magic", "Unlimited"),
      // PS5 / Series X / Switch / PC / Mobile
      (50, "TARNSH", "Max Runes", "Currency"),
      (50, "ELDEN",  "All Sites of Grace Lit", "Unlock"),
      (50, "FLASKUP","Infinite Flask Uses", "Unlimited"),
      (51, "DEMNSL", "Max Souls", "Currency"),
      (51, "NEXUS",  "All Archstones Unlocked", "Unlock"),
      (52, "CHIEFR", "Unlimited Ammo", "Ammo"),
      (52, "GRAPPL", "Infinite Grappleshot", "Unlimited"),
      (53, "TRACKD", "All Cars Unlocked", "Unlock"),
      (53, "CRDITS", "Max Credits", "Currency"),
      (54, "HYRULE", "All Shrines Complete", "Unlock"),
      (54, "SHIEKAH","Infinite Stamina", "Unlimited"),
      (54, "MASTR",  "Master Sword Early", "Unlock"),
      (55, "SMAASH", "All Fighters Unlocked", "Unlock"),
      (55, "GSPIRITS","All Spirits Max Power", "Stats"),
      (56, "EDDIEV", "Max Eddies", "Currency"),
      (56, "NETRUN", "Infinite Quickhacks", "Unlimited"),
      (56, "CYBRPNK","God Mode", "Invincibility"),
      (57, "GERALT", "Max Experience", "Stats"),
      (57, "DECOCTN","All Potions", "Item"),
      (57, "RIVIA",  "Unlimited Signs", "Unlimited"),
      (58, "ROYLFL", "Infinite Gems", "Currency"),
      (58, "CROWNX", "All Arenas Unlocked", "Unlock"),
      (59, "MORAX",  "Max Primogems", "Currency"),
      (59, "LUMINE", "Infinite Stamina", "Unlimited"),
    ];

    var id = 0;
    for (game in games.values()) {
      catalog.add(id, game);
      id += 1;
    };
    nextGameId := id;

    id := 0;
    for ((gId, code, effect, category) in codes.values()) {
      cheatCodes.add(id, { gameId = gId; code; effect; category });
      id += 1;
    };
    nextCheatCodeId := id;
  };
};
