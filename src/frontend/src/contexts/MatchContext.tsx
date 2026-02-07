import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export interface Player {
  id: string;
  name: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  retired: boolean;
}

export interface Bowler {
  id: string;
  name: string;
  overs: number;
  balls: number;
  runsConceded: number;
  wickets: number;
  maidens: number;
}

export interface Ball {
  runs: number;
  isWide: boolean;
  isNoBall: boolean;
  isWicket: boolean;
  batsmanId: string;
  bowlerId: string;
}

export interface TossInfo {
  winner: string;
}

export interface InningsData {
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  battingTeam: string;
  bowlingTeam: string;
  players: Player[];
  bowlers: Bowler[];
}

export interface MatchState {
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
  totalBalls: number;
  currentBatsmen: [Player | null, Player | null];
  striker: 0 | 1;
  currentBowler: Bowler | null;
  players: Player[];
  bowlers: Bowler[];
  ballHistory: Ball[];
  matchOvers: number;
  isMatchStarted: boolean;
  needsBowlerChange: boolean;
  teamA: string;
  teamB: string;
  battingTeam: string;
  bowlingTeam: string;
  toss: TossInfo | null;
  currentInnings: 1 | 2;
  firstInnings: InningsData | null;
  secondInnings: InningsData | null;
  isInningsComplete: boolean;
  isMatchComplete: boolean;
  showInningsTransition: boolean;
  matchDate: string;
}

interface MatchContextType {
  match: MatchState;
  addRuns: (runs: number) => void;
  addWide: () => void;
  addNoBall: (runs: number) => void;
  addWicket: () => void;
  resetMatch: () => void;
  startNewMatch: (overs: number, teamA: string, teamB: string, toss: TossInfo, battingTeam: string, date: string) => void;
  swapStrike: () => void;
  changeBowler: (bowlerName: string) => void;
  addNewBatsman: (playerName: string) => void;
  startSecondInnings: () => void;
  retireBatsman: (batsmanIndex: 0 | 1, replacementName: string) => void;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);

const initialMatchState: MatchState = {
  totalRuns: 0,
  totalWickets: 0,
  totalOvers: 0,
  totalBalls: 0,
  currentBatsmen: [null, null],
  striker: 0,
  currentBowler: null,
  players: [],
  bowlers: [],
  ballHistory: [],
  matchOvers: 20,
  isMatchStarted: false,
  needsBowlerChange: false,
  teamA: '',
  teamB: '',
  battingTeam: '',
  bowlingTeam: '',
  toss: null,
  currentInnings: 1,
  firstInnings: null,
  secondInnings: null,
  isInningsComplete: false,
  isMatchComplete: false,
  showInningsTransition: false,
  matchDate: '',
};

export function MatchProvider({ children }: { children: ReactNode }) {
  const [match, setMatch] = useState<MatchState>(initialMatchState);

  // Check if innings is complete
  useEffect(() => {
    if (!match.isMatchStarted || match.isMatchComplete || match.isInningsComplete) return;

    const totalBallsInInnings = match.matchOvers * 6;
    const isOversComplete = match.totalBalls >= totalBallsInInnings;
    const isAllOut = match.totalWickets >= 10;

    // Check if innings should be marked as complete
    if (isOversComplete || isAllOut) {
      setMatch((prev) => {
        // For second innings, also mark match as complete
        if (prev.currentInnings === 2) {
          return {
            ...prev,
            isInningsComplete: true,
            isMatchComplete: true,
          };
        }
        // For first innings, mark innings complete and show transition dialog
        return {
          ...prev,
          isInningsComplete: true,
          showInningsTransition: true,
        };
      });
    }
  }, [match.totalBalls, match.totalWickets, match.isMatchStarted, match.isMatchComplete, match.matchOvers, match.currentInnings, match.isInningsComplete]);

  const updateBowlerStats = useCallback((bowler: Bowler, runs: number, isWicket: boolean, isLegalDelivery: boolean) => {
    const updatedBowler = { ...bowler };
    updatedBowler.runsConceded += runs;
    if (isWicket) updatedBowler.wickets += 1;
    if (isLegalDelivery) {
      updatedBowler.balls += 1;
      if (updatedBowler.balls === 6) {
        updatedBowler.overs += 1;
        updatedBowler.balls = 0;
      }
    }
    return updatedBowler;
  }, []);

  const updateBatsmanStats = useCallback((batsman: Player, runs: number) => {
    const updatedBatsman = { ...batsman };
    updatedBatsman.runs += runs;
    updatedBatsman.ballsFaced += 1;
    if (runs === 4) updatedBatsman.fours += 1;
    if (runs === 6) updatedBatsman.sixes += 1;
    return updatedBatsman;
  }, []);

  const addRuns = useCallback((runs: number) => {
    setMatch((prev) => {
      if (!prev.isMatchStarted || !prev.currentBatsmen[prev.striker] || !prev.currentBowler || prev.isInningsComplete || prev.isMatchComplete) return prev;

      const newTotalBalls = prev.totalBalls + 1;
      const newTotalOvers = Math.floor(newTotalBalls / 6);
      const remainingBalls = newTotalBalls % 6;

      const updatedPlayers = prev.players.map((p) =>
        p.id === prev.currentBatsmen[prev.striker]!.id ? updateBatsmanStats(p, runs) : p
      );

      const updatedBowlers = prev.bowlers.map((b) =>
        b.id === prev.currentBowler!.id ? updateBowlerStats(b, runs, false, true) : b
      );

      const ball: Ball = {
        runs,
        isWide: false,
        isNoBall: false,
        isWicket: false,
        batsmanId: prev.currentBatsmen[prev.striker]!.id,
        bowlerId: prev.currentBowler.id,
      };

      const newTotalRuns = prev.totalRuns + runs;

      // Check if target is chased in second innings
      let isMatchComplete = false;
      let isInningsComplete = false;
      if (prev.currentInnings === 2 && prev.firstInnings && newTotalRuns > prev.firstInnings.runs) {
        isMatchComplete = true;
        isInningsComplete = true;
      }

      // Swap strike on odd runs or end of over
      const shouldSwapStrike = runs % 2 === 1 || remainingBalls === 0;

      // Check if over is complete (6 legal deliveries)
      const isOverComplete = remainingBalls === 0;

      return {
        ...prev,
        totalRuns: newTotalRuns,
        totalBalls: newTotalBalls,
        totalOvers: newTotalOvers,
        players: updatedPlayers,
        bowlers: updatedBowlers,
        currentBatsmen: [
          updatedPlayers.find((p) => p.id === prev.currentBatsmen[0]?.id) || null,
          updatedPlayers.find((p) => p.id === prev.currentBatsmen[1]?.id) || null,
        ],
        currentBowler: updatedBowlers.find((b) => b.id === prev.currentBowler!.id) || null,
        striker: shouldSwapStrike ? (prev.striker === 0 ? 1 : 0) : prev.striker,
        ballHistory: [...prev.ballHistory, ball],
        needsBowlerChange: isOverComplete,
        isMatchComplete,
        isInningsComplete,
      };
    });
  }, [updateBatsmanStats, updateBowlerStats]);

  const addWide = useCallback(() => {
    setMatch((prev) => {
      if (!prev.isMatchStarted || !prev.currentBowler || prev.isInningsComplete || prev.isMatchComplete) return prev;

      const updatedBowlers = prev.bowlers.map((b) =>
        b.id === prev.currentBowler!.id ? { ...b, runsConceded: b.runsConceded + 1 } : b
      );

      const ball: Ball = {
        runs: 1,
        isWide: true,
        isNoBall: false,
        isWicket: false,
        batsmanId: prev.currentBatsmen[prev.striker]?.id || '',
        bowlerId: prev.currentBowler.id,
      };

      const newTotalRuns = prev.totalRuns + 1;

      // Check if target is chased in second innings
      let isMatchComplete = false;
      let isInningsComplete = false;
      if (prev.currentInnings === 2 && prev.firstInnings && newTotalRuns > prev.firstInnings.runs) {
        isMatchComplete = true;
        isInningsComplete = true;
      }

      return {
        ...prev,
        totalRuns: newTotalRuns,
        bowlers: updatedBowlers,
        currentBowler: updatedBowlers.find((b) => b.id === prev.currentBowler!.id) || null,
        ballHistory: [...prev.ballHistory, ball],
        isMatchComplete,
        isInningsComplete,
      };
    });
  }, []);

  const addNoBall = useCallback((runs: number) => {
    setMatch((prev) => {
      if (!prev.isMatchStarted || !prev.currentBowler || prev.isInningsComplete || prev.isMatchComplete) return prev;

      const totalRuns = runs + 1; // No ball + runs scored
      const updatedBowlers = prev.bowlers.map((b) =>
        b.id === prev.currentBowler!.id ? { ...b, runsConceded: b.runsConceded + totalRuns } : b
      );

      const ball: Ball = {
        runs: totalRuns,
        isWide: false,
        isNoBall: true,
        isWicket: false,
        batsmanId: prev.currentBatsmen[prev.striker]?.id || '',
        bowlerId: prev.currentBowler.id,
      };

      const newTotalRuns = prev.totalRuns + totalRuns;

      // Check if target is chased in second innings
      let isMatchComplete = false;
      let isInningsComplete = false;
      if (prev.currentInnings === 2 && prev.firstInnings && newTotalRuns > prev.firstInnings.runs) {
        isMatchComplete = true;
        isInningsComplete = true;
      }

      return {
        ...prev,
        totalRuns: newTotalRuns,
        bowlers: updatedBowlers,
        currentBowler: updatedBowlers.find((b) => b.id === prev.currentBowler!.id) || null,
        ballHistory: [...prev.ballHistory, ball],
        isMatchComplete,
        isInningsComplete,
      };
    });
  }, []);

  const addWicket = useCallback(() => {
    setMatch((prev) => {
      if (!prev.isMatchStarted || !prev.currentBatsmen[prev.striker] || !prev.currentBowler || prev.isInningsComplete || prev.isMatchComplete) return prev;

      const newTotalBalls = prev.totalBalls + 1;
      const newTotalOvers = Math.floor(newTotalBalls / 6);
      const remainingBalls = newTotalBalls % 6;
      const newTotalWickets = prev.totalWickets + 1;

      const updatedPlayers = prev.players.map((p) => {
        if (p.id === prev.currentBatsmen[prev.striker]!.id) {
          return { ...p, ballsFaced: p.ballsFaced + 1, isOut: true };
        }
        return p;
      });

      const updatedBowlers = prev.bowlers.map((b) =>
        b.id === prev.currentBowler!.id ? updateBowlerStats(b, 0, true, true) : b
      );

      const ball: Ball = {
        runs: 0,
        isWide: false,
        isNoBall: false,
        isWicket: true,
        batsmanId: prev.currentBatsmen[prev.striker]!.id,
        bowlerId: prev.currentBowler.id,
      };

      const newBatsmen: [Player | null, Player | null] = [...prev.currentBatsmen];
      newBatsmen[prev.striker] = null;

      // Check if over is complete (6 legal deliveries)
      const isOverComplete = remainingBalls === 0;

      // Check if all out (10 wickets)
      let isMatchComplete = false;
      let isInningsComplete = false;
      if (newTotalWickets >= 10) {
        isInningsComplete = true;
        if (prev.currentInnings === 2) {
          isMatchComplete = true;
        }
      }

      return {
        ...prev,
        totalWickets: newTotalWickets,
        totalBalls: newTotalBalls,
        totalOvers: newTotalOvers,
        players: updatedPlayers,
        bowlers: updatedBowlers,
        currentBatsmen: [
          updatedPlayers.find((p) => p.id === newBatsmen[0]?.id) || null,
          updatedPlayers.find((p) => p.id === newBatsmen[1]?.id) || null,
        ],
        currentBowler: updatedBowlers.find((b) => b.id === prev.currentBowler!.id) || null,
        ballHistory: [...prev.ballHistory, ball],
        needsBowlerChange: isOverComplete,
        isInningsComplete,
        isMatchComplete,
        showInningsTransition: isInningsComplete && prev.currentInnings === 1,
      };
    });
  }, [updateBowlerStats]);

  const swapStrike = useCallback(() => {
    setMatch((prev) => ({
      ...prev,
      striker: prev.striker === 0 ? 1 : 0,
    }));
  }, []);

  const addNewBatsman = useCallback((playerName: string) => {
    setMatch((prev) => {
      const newPlayer: Player = {
        id: `player-${Date.now()}-${Math.random()}`,
        name: playerName,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        retired: false,
      };

      const updatedPlayers = [...prev.players, newPlayer];
      const newBatsmen: [Player | null, Player | null] = [...prev.currentBatsmen];

      // Add to first empty slot
      if (!newBatsmen[0]) {
        newBatsmen[0] = newPlayer;
      } else if (!newBatsmen[1]) {
        newBatsmen[1] = newPlayer;
      } else {
        // Replace the out batsman at striker position
        newBatsmen[prev.striker] = newPlayer;
      }

      return {
        ...prev,
        players: updatedPlayers,
        currentBatsmen: newBatsmen,
      };
    });
  }, []);

  const retireBatsman = useCallback((batsmanIndex: 0 | 1, replacementName: string) => {
    setMatch((prev) => {
      const retiringBatsman = prev.currentBatsmen[batsmanIndex];
      if (!retiringBatsman) return prev;

      // Mark the batsman as retired
      const updatedPlayers = prev.players.map((p) =>
        p.id === retiringBatsman.id ? { ...p, retired: true } : p
      );

      // Create new replacement batsman
      const newPlayer: Player = {
        id: `player-${Date.now()}-${Math.random()}`,
        name: replacementName,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        retired: false,
      };

      const allPlayers = [...updatedPlayers, newPlayer];
      const newBatsmen: [Player | null, Player | null] = [...prev.currentBatsmen];
      newBatsmen[batsmanIndex] = newPlayer;

      return {
        ...prev,
        players: allPlayers,
        currentBatsmen: [
          allPlayers.find((p) => p.id === newBatsmen[0]?.id) || null,
          allPlayers.find((p) => p.id === newBatsmen[1]?.id) || null,
        ],
      };
    });
  }, []);

  const changeBowler = useCallback((bowlerName: string) => {
    setMatch((prev) => {
      const existingBowler = prev.bowlers.find((b) => b.name === bowlerName);
      if (existingBowler) {
        return { ...prev, currentBowler: existingBowler, needsBowlerChange: false };
      }

      const newBowler: Bowler = {
        id: `bowler-${Date.now()}-${Math.random()}`,
        name: bowlerName,
        overs: 0,
        balls: 0,
        runsConceded: 0,
        wickets: 0,
        maidens: 0,
      };

      return {
        ...prev,
        bowlers: [...prev.bowlers, newBowler],
        currentBowler: newBowler,
        needsBowlerChange: false,
      };
    });
  }, []);

  const startSecondInnings = useCallback(() => {
    setMatch((prev) => {
      // Save first innings data with all player and bowler stats
      const firstInningsData: InningsData = {
        runs: prev.totalRuns,
        wickets: prev.totalWickets,
        overs: prev.totalOvers,
        balls: prev.totalBalls % 6,
        battingTeam: prev.battingTeam,
        bowlingTeam: prev.bowlingTeam,
        players: [...prev.players],
        bowlers: [...prev.bowlers],
      };

      // Swap teams for second innings
      const newBattingTeam = prev.bowlingTeam;
      const newBowlingTeam = prev.battingTeam;

      return {
        ...prev,
        // Reset innings-specific data
        totalRuns: 0,
        totalWickets: 0,
        totalOvers: 0,
        totalBalls: 0,
        currentBatsmen: [null, null],
        striker: 0,
        currentBowler: null,
        players: [],
        bowlers: [],
        ballHistory: [],
        needsBowlerChange: false,
        // Update innings tracking
        currentInnings: 2,
        firstInnings: firstInningsData,
        isInningsComplete: false,
        showInningsTransition: false,
        // Swap teams
        battingTeam: newBattingTeam,
        bowlingTeam: newBowlingTeam,
      };
    });
  }, []);

  const startNewMatch = useCallback((overs: number, teamA: string, teamB: string, toss: TossInfo, battingTeam: string, date: string) => {
    const bowlingTeam = battingTeam === teamA ? teamB : teamA;

    setMatch({
      ...initialMatchState,
      matchOvers: overs,
      isMatchStarted: true,
      teamA,
      teamB,
      battingTeam,
      bowlingTeam,
      toss,
      matchDate: date,
    });
  }, []);

  const resetMatch = useCallback(() => {
    setMatch(initialMatchState);
  }, []);

  return (
    <MatchContext.Provider
      value={{
        match,
        addRuns,
        addWide,
        addNoBall,
        addWicket,
        resetMatch,
        startNewMatch,
        swapStrike,
        changeBowler,
        addNewBatsman,
        startSecondInnings,
        retireBatsman,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
}

export function useMatch() {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatch must be used within MatchProvider');
  }
  return context;
}
