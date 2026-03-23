import Iter "mo:core/Iter";
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

  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile type as required
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
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

  module Timestamp {
    public func compare(ts1 : Timestamp, ts2 : Timestamp) : Order.Order {
      Int.compare(ts1, ts2);
    };
  };

  let catalog = Map.empty<Nat, Game.Type>();
  let cheatCodes = Map.empty<Nat, CheatCode.Type>();
  let userGames = Map.empty<Principal, List.List<UserGame>>();
  let generatedCodes = Map.empty<Principal, List.List<GeneratedCode>>();

  var nextGameId = 0;
  var nextCheatCodeId = 0;
  var nextGeneratedCodeId = 0;

  // Public read functions - accessible to everyone including guests
  public query ({ caller }) func searchGamesByName(searchText : Text) : async [Game.Type] {
    let matches = List.empty<Game.Type>();
    for ((_, game) in catalog.entries()) {
      if (game.name.toLower().contains(#text(searchText.toLower()))) {
        matches.add(game);
      };
    };
    matches.toArray();
  };

  public query ({ caller }) func searchGamesByGenre(genre : Text) : async [Game.Type] {
    let matches = List.empty<Game.Type>();
    for ((_, game) in catalog.entries()) {
      if (game.genre.toLower().contains(#text(genre.toLower()))) {
        matches.add(game);
      };
    };
    matches.toArray();
  };

  public query ({ caller }) func getCheatCodesForGame(gameId : Nat) : async [CheatCode.Type] {
    let codes = List.empty<CheatCode.Type>();
    for ((_, cheatCode) in cheatCodes.entries()) {
      if (cheatCode.gameId == gameId) {
        codes.add(cheatCode);
      };
    };
    codes.toArray();
  };

  public query ({ caller }) func getGameById(gameId : Nat) : async Game.Type {
    switch (catalog.get(gameId)) {
      case (null) { Runtime.trap("Game not found") };
      case (?game) { game };
    };
  };

  public query ({ caller }) func getCheatCodeById(cheatCodeId : Nat) : async CheatCode.Type {
    switch (cheatCodes.get(cheatCodeId)) {
      case (null) { Runtime.trap("Cheat code not found") };
      case (?code) { code };
    };
  };

  // User-specific functions - require authenticated user
  public shared ({ caller }) func generateRandomCode(gameId : Nat) : async GeneratedCode {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate codes");
    };

    let game = switch (catalog.get(gameId)) {
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
      codesArray[0];
    };
  };

  func generateUniqueCode() : Text {
    nextGeneratedCodeId.toText().concat("CODE");
  };

  public shared ({ caller }) func saveGameToLibrary(gameId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save games to library");
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
      Runtime.trap("Unauthorized: Only users can access their library");
    };

    switch (userGames.get(caller)) {
      case (null) { [] };
      case (?list) {
        list.toArray().sort(UserGame.compareByTimestamp);
      };
    };
  };

  public query ({ caller }) func getGeneratedCodesHistory() : async [GeneratedCode] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their code history");
    };

    switch (generatedCodes.get(caller)) {
      case (null) { [] };
      case (?list) {
        list.toArray().sort();
      };
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

  // Admin-only functions - modify global catalog
  public shared ({ caller }) func addGame(game : Game.Type) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add games");
    };

    let gameId = nextGameId;
    catalog.add(gameId, game);
    nextGameId += 1;
    gameId;
  };

  public shared ({ caller }) func addCheatCode(cheatCode : CheatCode.Type) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add cheat codes");
    };

    let cheatCodeId = nextCheatCodeId;
    cheatCodes.add(cheatCodeId, cheatCode);
    nextCheatCodeId += 1;
    cheatCodeId;
  };

  // Function for seeding data
  public shared ({ caller }) func seedData() : async () {
    if (not catalog.isEmpty()) { return };
    let games : [Game.Type] = [
      { name = "Super Mario Bros"; genre = "Platformer"; platform = "NES"; description = "Classic platform game" },
      { name = "The Legend of Zelda"; genre = "Action-adventure"; platform = "NES"; description = "Adventure game" },
      { name = "Minecraft"; genre = "Sandbox"; platform = "Multi"; description = "Block-building game" },
      { name = "Fortnite"; genre = "Battle Royale"; platform = "Multi"; description = "Shooter" },
      { name = "Pokemon Red"; genre = "RPG"; platform = "Game Boy"; description = "Monster capturing RPG" },
      { name = "GTA V"; genre = "Action"; platform = "Multi"; description = "Open world action" },
      { name = "Call of Duty"; genre = "Shooter"; platform = "Multi"; description = "First-person shooter" },
      { name = "Sonic the Hedgehog"; genre = "Platformer"; platform = "Genesis"; description = "Fast-paced platformer" },
      { name = "DOOM"; genre = "Shooter"; platform = "Multi"; description = "Classic FPS" },
      { name = "Street Fighter II"; genre = "Fighting"; platform = "Super NES"; description = "Fighting game" },
    ];

    let codes = [
      { gameId = 0; code = "SZNZUP"; effect = "Infinite Lives"; category = "Unlimited" },
      { gameId = 1; code = "KZXPY"; effect = "God Mode"; category = "Invincibility" },
      { gameId = 2; code = "XZLSZP"; effect = "Super Speed"; category = "Speed Boost" },
      { gameId = 3; code = "EIUPYX"; effect = "No Reload"; category = "Ammo" },
      { gameId = 4; code = "KSKVYM"; effect = "Instant Win"; category = "Win" },
    ];
    var id = 0;
    for (game in games.values()) {
      catalog.add(id, game);
      id += 1;
    };
    id := 0;
    for (cheatCode in codes.values()) {
      cheatCodes.add(id, cheatCode);
      id += 1;
    };
  };
};
