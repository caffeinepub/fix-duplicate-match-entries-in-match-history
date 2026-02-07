import List "mo:core/List";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";

actor {
  type Dismissal = {
    batsman : Text;
    description : Text;
  };

  type Batsman = {
    name : Text;
    runs : Nat;
    ballsFaced : Nat;
    strikeRate : Float;
    dismissals : ?Dismissal;
    retired : Bool;
  };

  type Bowler = {
    name : Text;
    runsConceded : Nat;
    wickets : Nat;
    overs : Nat;
    balls : Nat;
    economyRate : Float;
  };

  type Innings = {
    batsmen : [Batsman];
    bowlers : [Bowler];
    extras : {
      wides : Nat;
      noBalls : Nat;
      byes : Nat;
      legByes : Nat;
    };
    totalScore : Nat;
    wickets : Nat;
    overs : Nat;
  };

  type TossInfo = {
    winningTeam : Text;
  };

  type MatchResult = {
    teamA : Text;
    teamB : Text;
    overs : Nat;
    winner : Text;
    turns : Nat;
    teamAScore : Nat;
    teamBScore : Nat;
    tossInfo : TossInfo;
    innings1 : Innings;
    innings2 : Innings;
    date : ?Text;
  };

  type MatchAnalytics = {
    topScorer : { name : Text; runs : Nat };
    highestStrikeRate : { name : Text; rate : Float };
    topWicketTaker : { name : Text; wickets : Nat };
    bestEconomyRate : { name : Text; rate : Float };
  };

  type MatchStats = {
    teamA : Text;
    teamB : Text;
    teamARuns : Nat;
    teamBRuns : Nat;
    winner : Text;
  };

  // Initialize the access control system
  let accessControlState = AccessControl.initState();

  // Initialize auth (first caller becomes admin, others become users)
  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

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

  let matchHistory = List.empty<MatchResult>();

  func areMatchResultsEqual(match1 : MatchResult, match2 : MatchResult) : Bool {
    match1.teamA == match2.teamA and
    match1.teamB == match2.teamB and
    match1.overs == match2.overs and
    match1.teamAScore == match2.teamAScore and
    match1.teamBScore == match2.teamBScore and
    match1.winner == match2.winner and
    match1.turns == match2.turns and
    match1.tossInfo == match2.tossInfo and
    match1.innings1.totalScore == match2.innings1.totalScore and
    match1.innings2.totalScore == match2.innings2.totalScore and
    match1.innings1.wickets == match2.innings1.wickets and
    match1.innings2.wickets == match2.innings2.wickets and
    match1.innings1.overs == match2.innings1.overs and
    match1.innings2.overs == match2.innings2.overs and
    match1.date == match2.date;
  };

  public shared ({ caller }) func storeMatchOutcome(
    teamA : Text,
    teamB : Text,
    overs : Nat,
    winner : Text,
    turns : Nat,
    teamAScore : Nat,
    teamBScore : Nat,
    tossInfo : TossInfo,
    innings1 : Innings,
    innings2 : Innings,
    date : ?Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can store match outcomes");
    };

    let newMatchResult : MatchResult = {
      teamA;
      teamB;
      overs;
      winner;
      turns;
      teamAScore;
      teamBScore;
      tossInfo;
      innings1;
      innings2;
      date;
    };

    let currentSize = matchHistory.size();
    if (currentSize > 0) {
      let lastIndex = currentSize - 1;
      let lastStoredMatch = matchHistory.at(lastIndex);
      if (areMatchResultsEqual(newMatchResult, lastStoredMatch)) {
        return;
      };
    };

    matchHistory.add(newMatchResult);
  };

  public shared ({ caller }) func clearMatchHistory() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can clear match history");
    };
    matchHistory.clear();
  };

  public query ({ caller }) func getMatchHistory() : async [MatchResult] {
    matchHistory.toArray();
  };

  public query ({ caller }) func getTeams() : async [Text] {
    let teams = Map.empty<Text, Bool>();

    for (match in matchHistory.values()) {
      teams.add(match.teamA, true);
      teams.add(match.teamB, true);
    };

    let teamsArray = teams.toArray();
    teamsArray.map(func(pair) { pair.0 });
  };

  public query ({ caller }) func getTeamStats(team : Text) : async (Nat, Nat, Nat) {
    let matches = matchHistory.filter(
      func(match) {
        match.teamA == team or match.teamB == team;
      }
    );

    let matchesArray = matches.toArray();
    if (matchesArray.size() == 0) {
      return (0, 0, 0);
    };

    let wins = matchesArray.foldLeft(
      0,
      func(acc, match) {
        if (match.winner == team) { acc + 1 } else { acc };
      },
    );

    let totalRuns = matchesArray.foldLeft(
      0,
      func(acc, match) {
        if (match.teamA == team) { acc + match.teamAScore } else {
          acc + match.teamBScore;
        };
      },
    );
    (matchesArray.size(), wins, totalRuns);
  };

  public query ({ caller }) func getTeamMatches(team : Text) : async [MatchResult] {
    let filtered = matchHistory.filter(
      func(match) {
        match.teamA == team or match.teamB == team;
      }
    );
    filtered.toArray();
  };

  public query ({ caller }) func getMatches() : async [Text] {
    let matches = Map.empty<Text, Bool>();

    for (match in matchHistory.values()) {
      matches.add(match.teamA # " vs " # match.teamB, true);
    };

    let matchesArray = matches.toArray();
    matchesArray.map(func(pair) { pair.0 });
  };

  public query ({ caller }) func getMatchStats(match : Text) : async (Text, Text, Nat, Nat, Text) {
    let splitMatch = match.split(#char ' ');
    if (splitMatch.size() >= 1) {
      let teamsArray = splitMatch.toArray();
      let teamA = teamsArray[0];
      let teamB = if (teamsArray.size() >= 4) {
        teamsArray[3];
      } else {
        "";
      };

      let matches = matchHistory.filter(
        func(matchResult) {
          (matchResult.teamA == teamA and matchResult.teamB == teamB) or
          (matchResult.teamA == teamB and matchResult.teamB == teamA);
        }
      );

      let matchesArray = matches.toArray();
      if (matchesArray.size() == 0) {
        return ("", "", 0, 0, "");
      };

      let teamAStats = matchesArray.foldLeft(
        (0, 0),
        func(acc, match) {
          if (match.teamA == teamA) {
            let (runsA, runsB) = acc;
            (runsA + match.teamAScore, runsB + match.teamBScore);
          } else {
            let (runsA, runsB) = acc;
            (runsA + match.teamBScore, runsB + match.teamAScore);
          };
        },
      );

      var winner : Text = teamA;
      if (teamAStats.1 > teamAStats.0) {
        winner := teamB;
      };

      return (teamA, teamB, teamAStats.0, teamAStats.1, winner);
    };

    ("", "", 0, 0, "");
  };

  public query ({ caller }) func getMatchAnalytics(matchId : Nat) : async ?MatchAnalytics {
    var index = 0;
    for (match in matchHistory.values()) {
      if (index == matchId) {
        let topScorer = {
          var name = "";
          var runs = 0;
        };

        let highestStrikeRate = {
          var name = "";
          var rate : Float = 0.0;
        };

        let topWicketTaker = {
          var name = "";
          var wickets = 0;
        };

        let bestEconomyRate = {
          var name = "";
          var rate : Float = 0.0;
        };

        for (batsman in match.innings1.batsmen.values()) {
          if (batsman.runs > topScorer.runs) {
            topScorer.name := batsman.name;
            topScorer.runs := batsman.runs;
          };
          if (batsman.strikeRate > highestStrikeRate.rate) {
            highestStrikeRate.name := batsman.name;
            highestStrikeRate.rate := batsman.strikeRate;
          };
        };

        for (batsman in match.innings2.batsmen.values()) {
          if (batsman.runs > topScorer.runs) {
            topScorer.name := batsman.name;
            topScorer.runs := batsman.runs;
          };
          if (batsman.strikeRate > highestStrikeRate.rate) {
            highestStrikeRate.name := batsman.name;
            highestStrikeRate.rate := batsman.strikeRate;
          };
        };

        for (bowler in match.innings1.bowlers.values()) {
          if (bowler.wickets > topWicketTaker.wickets) {
            topWicketTaker.name := bowler.name;
            topWicketTaker.wickets := bowler.wickets;
          };
          if (bowler.economyRate < bestEconomyRate.rate or bestEconomyRate.rate == 0.0) {
            bestEconomyRate.name := bowler.name;
            bestEconomyRate.rate := bowler.economyRate;
          };
        };

        for (bowler in match.innings2.bowlers.values()) {
          if (bowler.wickets > topWicketTaker.wickets) {
            topWicketTaker.name := bowler.name;
            topWicketTaker.wickets := bowler.wickets;
          };
          if (bowler.economyRate < bestEconomyRate.rate or bestEconomyRate.rate == 0.0) {
            bestEconomyRate.name := bowler.name;
            bestEconomyRate.rate := bowler.economyRate;
          };
        };

        return ?{
          topScorer = { name = topScorer.name; runs = topScorer.runs };
          highestStrikeRate = { name = highestStrikeRate.name; rate = highestStrikeRate.rate };
          topWicketTaker = { name = topWicketTaker.name; wickets = topWicketTaker.wickets };
          bestEconomyRate = { name = bestEconomyRate.name; rate = bestEconomyRate.rate };
        };
      };
      index += 1;
    };
    null;
  };

  public query ({ caller }) func getScorecard(matchId : Nat) : async ?MatchResult {
    var index = 0;
    for (match in matchHistory.values()) {
      if (index == matchId) {
        return ?match;
      };
      index += 1;
    };
    null;
  };

  public query ({ caller }) func getDateFilteredMatches(date : Text) : async [MatchResult] {
    matchHistory.filter(func(match) { match.date == ?date }).toArray();
  };

  public query ({ caller }) func getDateFilteredAnalytics(date : Text) : async ?MatchAnalytics {
    var topScorer = {
      var name = "";
      var runs = 0;
    };

    var highestStrikeRate = {
      var name = "";
      var rate : Float = 0.0;
    };

    var topWicketTaker = {
      var name = "";
      var wickets = 0;
    };

    var bestEconomyRate = {
      var name = "";
      var rate : Float = 0.0;
    };

    let filteredMatches = matchHistory.filter(func(match) { match.date == ?date });

    let gamesWithOvers = filteredMatches.filter(
      func(game) { game.overs > 0 }
    );

    if (gamesWithOvers.size() == 0) {
      return null;
    };

    for (game in gamesWithOvers.values()) {
      for (batsman in game.innings1.batsmen.values()) {
        if (batsman.runs > topScorer.runs) {
          topScorer.name := batsman.name;
          topScorer.runs := batsman.runs;
        };
        if (batsman.strikeRate > highestStrikeRate.rate) {
          highestStrikeRate.name := batsman.name;
          highestStrikeRate.rate := batsman.strikeRate;
        };
      };

      for (batsman in game.innings2.batsmen.values()) {
        if (batsman.runs > topScorer.runs) {
          topScorer.name := batsman.name;
          topScorer.runs := batsman.runs;
        };
        if (batsman.strikeRate > highestStrikeRate.rate) {
          highestStrikeRate.name := batsman.name;
          highestStrikeRate.rate := batsman.strikeRate;
        };
      };

      for (bowler in game.innings1.bowlers.values()) {
        if (bowler.wickets > topWicketTaker.wickets) {
          topWicketTaker.name := bowler.name;
          topWicketTaker.wickets := bowler.wickets;
        };
        if (bowler.economyRate < bestEconomyRate.rate or bestEconomyRate.rate == 0.0) {
          bestEconomyRate.name := bowler.name;
          bestEconomyRate.rate := bowler.economyRate;
        };
      };

      for (bowler in game.innings2.bowlers.values()) {
        if (bowler.wickets > topWicketTaker.wickets) {
          topWicketTaker.name := bowler.name;
          topWicketTaker.wickets := bowler.wickets;
        };
        if (bowler.economyRate < bestEconomyRate.rate or bestEconomyRate.rate == 0.0) {
          bestEconomyRate.name := bowler.name;
          bestEconomyRate.rate := bowler.economyRate;
        };
      };
    };

    ?{
      topScorer = { name = topScorer.name; runs = topScorer.runs };
      highestStrikeRate = { name = highestStrikeRate.name; rate = highestStrikeRate.rate };
      topWicketTaker = { name = topWicketTaker.name; wickets = topWicketTaker.wickets };
      bestEconomyRate = { name = bestEconomyRate.name; rate = bestEconomyRate.rate };
    };
  };

  public query ({ caller }) func getDateFilteredStats(date : Text) : async [MatchStats] {
    let filteredMatches = matchHistory.filter(func(match) { match.date == ?date });

    filteredMatches.map<MatchResult, MatchStats>(
      func(match) {
        {
          teamA = match.teamA;
          teamB = match.teamB;
          teamARuns = match.teamAScore;
          teamBRuns = match.teamBScore;
          winner = match.winner;
        };
      }
    ).toArray();
  };

  public query ({ caller }) func getDateGames(date : Text) : async Nat {
    matchHistory.filter(
      func(match) {
        match.date == ?date and match.overs > 0;
      }
    ).size();
  };
};
