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
    let games : [Game.Type] = [
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
      { name = "GoldenEye 007"; genre = "Shooter"; platform = "N64"; description = "Iconic James Bond first-person shooter" },
      { name = "The Legend of Zelda: Ocarina of Time"; genre = "Adventure"; platform = "N64"; description = "3D Zelda epic across time in Hyrule" },
      { name = "Gran Turismo"; genre = "Racing"; platform = "PlayStation"; description = "Realistic car simulation with hundreds of vehicles" },
      { name = "Final Fantasy VII"; genre = "RPG"; platform = "PlayStation"; description = "Cloud Strife battles Sephiroth to save the Planet" },
      { name = "Crash Bandicoot"; genre = "Platformer"; platform = "PlayStation"; description = "Wacky marsupial hero on a tropical island adventure" },
      { name = "Minecraft"; genre = "Sandbox"; platform = "Multi"; description = "Infinite block-building and survival world" },
      { name = "GTA V"; genre = "Action"; platform = "Multi"; description = "Open-world crime epic set in Los Santos" },
    ];

    let codes : [(Nat, Text, Text, Text)] = [
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
      (19, "TURTLE", "Max Health & Armor", "Health"),
      (19, "LWYRP", "Reduce Wanted Level", "Cheat"),
      (19, "SKYFALL", "Spawn Parachute", "Item"),
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
