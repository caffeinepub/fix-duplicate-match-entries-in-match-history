import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MatchStats {
    teamA: string;
    teamB: string;
    teamARuns: bigint;
    winner: string;
    teamBRuns: bigint;
}
export interface MatchAnalytics {
    topScorer: {
        name: string;
        runs: bigint;
    };
    bestEconomyRate: {
        name: string;
        rate: number;
    };
    topWicketTaker: {
        name: string;
        wickets: bigint;
    };
    highestStrikeRate: {
        name: string;
        rate: number;
    };
}
export interface MatchResult {
    innings1: Innings;
    innings2: Innings;
    teamA: string;
    teamB: string;
    turns: bigint;
    teamBScore: bigint;
    overs: bigint;
    date?: string;
    winner: string;
    tossInfo: TossInfo;
    teamAScore: bigint;
}
export interface Bowler {
    overs: bigint;
    name: string;
    wickets: bigint;
    balls: bigint;
    economyRate: number;
    runsConceded: bigint;
}
export interface Innings {
    bowlers: Array<Bowler>;
    overs: bigint;
    totalScore: bigint;
    wickets: bigint;
    extras: {
        byes: bigint;
        legByes: bigint;
        noBalls: bigint;
        wides: bigint;
    };
    batsmen: Array<Batsman>;
}
export interface Dismissal {
    description: string;
    batsman: string;
}
export interface Batsman {
    name: string;
    runs: bigint;
    dismissals?: Dismissal;
    strikeRate: number;
    ballsFaced: bigint;
    retired: boolean;
}
export interface UserProfile {
    name: string;
}
export interface TossInfo {
    winningTeam: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearMatchHistory(): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDateFilteredAnalytics(date: string): Promise<MatchAnalytics | null>;
    getDateFilteredMatches(date: string): Promise<Array<MatchResult>>;
    getDateFilteredStats(date: string): Promise<Array<MatchStats>>;
    getDateGames(date: string): Promise<bigint>;
    getMatchAnalytics(matchId: bigint): Promise<MatchAnalytics | null>;
    getMatchHistory(): Promise<Array<MatchResult>>;
    getMatchStats(match: string): Promise<[string, string, bigint, bigint, string]>;
    getMatches(): Promise<Array<string>>;
    getScorecard(matchId: bigint): Promise<MatchResult | null>;
    getTeamMatches(team: string): Promise<Array<MatchResult>>;
    getTeamStats(team: string): Promise<[bigint, bigint, bigint]>;
    getTeams(): Promise<Array<string>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    storeMatchOutcome(teamA: string, teamB: string, overs: bigint, winner: string, turns: bigint, teamAScore: bigint, teamBScore: bigint, tossInfo: TossInfo, innings1: Innings, innings2: Innings, date: string | null): Promise<void>;
}
