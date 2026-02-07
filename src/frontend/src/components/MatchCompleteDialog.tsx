import { useMatch } from '../contexts/MatchContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Award, TrendingUp, Target, Zap, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Player, Bowler } from '../contexts/MatchContext';
import type { Innings, Batsman, Bowler as BackendBowler, Dismissal, MatchResult } from '../backend';
import { useStoreMatch, useMatchHistory } from '../hooks/useQueries';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';

export default function MatchCompleteDialog() {
  const { match, resetMatch } = useMatch();
  const storeMatch = useStoreMatch();
  const { data: matchHistory } = useMatchHistory();
  
  // Use refs to track save state across re-renders
  const saveAttemptedRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const toastShownRef = useRef(false);
  const completionIdRef = useRef<string | null>(null);

  // Save match when it completes
  useEffect(() => {
    if (!match.isMatchComplete || !match.firstInnings || !match.toss) {
      // Reset refs when match is no longer complete
      saveAttemptedRef.current = false;
      saveInFlightRef.current = false;
      toastShownRef.current = false;
      completionIdRef.current = null;
      return;
    }

    // Create a unique ID for this completion
    const currentCompletionId = `${match.teamA}-${match.teamB}-${match.matchDate}-${match.totalRuns}-${match.totalWickets}`;
    
    // If this is a new completion, reset the refs
    if (completionIdRef.current !== currentCompletionId) {
      saveAttemptedRef.current = false;
      saveInFlightRef.current = false;
      toastShownRef.current = false;
      completionIdRef.current = currentCompletionId;
    }

    // Guard: only attempt save once per completion
    if (saveAttemptedRef.current || saveInFlightRef.current) {
      return;
    }

    const teamAScore = match.firstInnings.battingTeam === match.teamA 
      ? match.firstInnings.runs 
      : match.totalRuns;
    const teamBScore = match.firstInnings.battingTeam === match.teamB 
      ? match.firstInnings.runs 
      : match.totalRuns;

    let winner = '';
    if (match.currentInnings === 2) {
      const secondInningsRuns = match.totalRuns;
      const firstInningsRuns = match.firstInnings.runs;
      
      if (secondInningsRuns > firstInningsRuns) {
        winner = match.battingTeam;
      } else if (secondInningsRuns === firstInningsRuns) {
        winner = 'Match Tied';
      } else {
        winner = match.firstInnings.battingTeam;
      }
    }

    // Check for duplicates in current history
    const isDuplicate = matchHistory?.some((existingMatch: MatchResult) => {
      return (
        existingMatch.teamA === match.teamA &&
        existingMatch.teamB === match.teamB &&
        Number(existingMatch.overs) === match.matchOvers &&
        Number(existingMatch.teamAScore) === teamAScore &&
        Number(existingMatch.teamBScore) === teamBScore &&
        existingMatch.winner === winner &&
        existingMatch.date === match.matchDate
      );
    });

    if (isDuplicate) {
      if (!toastShownRef.current) {
        toast.info('Match already saved to history');
        toastShownRef.current = true;
      }
      saveAttemptedRef.current = true;
      return;
    }

    // Convert frontend Player to backend Batsman
    const convertToBatsman = (player: Player): Batsman => {
      const dismissal: Dismissal | undefined = player.isOut 
        ? { batsman: player.name, description: 'out' }
        : undefined;

      return {
        name: player.name,
        runs: BigInt(player.runs),
        ballsFaced: BigInt(player.ballsFaced),
        strikeRate: player.ballsFaced > 0 ? (player.runs / player.ballsFaced) * 100 : 0,
        dismissals: dismissal,
        retired: player.retired,
      };
    };

    // Convert frontend Bowler to backend Bowler
    const convertToBowler = (bowler: Bowler): BackendBowler => {
      const totalOvers = bowler.overs + bowler.balls / 6;
      return {
        name: bowler.name,
        overs: BigInt(bowler.overs),
        balls: BigInt(bowler.balls),
        runsConceded: BigInt(bowler.runsConceded),
        wickets: BigInt(bowler.wickets),
        economyRate: totalOvers > 0 ? bowler.runsConceded / totalOvers : 0,
      };
    };

    // Prepare innings data
    const innings1: Innings = {
      batsmen: match.firstInnings.players.map(convertToBatsman),
      bowlers: match.firstInnings.bowlers.map(convertToBowler),
      extras: {
        wides: BigInt(0),
        noBalls: BigInt(0),
        byes: BigInt(0),
        legByes: BigInt(0),
      },
      totalScore: BigInt(match.firstInnings.runs),
      wickets: BigInt(match.firstInnings.wickets),
      overs: BigInt(match.firstInnings.overs),
    };

    const innings2: Innings = {
      batsmen: match.players.map(convertToBatsman),
      bowlers: match.bowlers.map(convertToBowler),
      extras: {
        wides: BigInt(0),
        noBalls: BigInt(0),
        byes: BigInt(0),
        legByes: BigInt(0),
      },
      totalScore: BigInt(match.totalRuns),
      wickets: BigInt(match.totalWickets),
      overs: BigInt(match.totalOvers),
    };

    // Mark as attempted and in-flight
    saveAttemptedRef.current = true;
    saveInFlightRef.current = true;

    storeMatch.mutate({
      teamA: match.teamA,
      teamB: match.teamB,
      overs: match.matchOvers,
      winner,
      turns: 2,
      teamAScore,
      teamBScore,
      tossInfo: {
        winningTeam: match.toss.winner,
      },
      innings1,
      innings2,
      date: match.matchDate,
    }, {
      onSuccess: () => {
        saveInFlightRef.current = false;
        if (!toastShownRef.current) {
          toast.success('Match saved to history');
          toastShownRef.current = true;
        }
      },
      onError: (error) => {
        // On error, allow retry by resetting the attempt flag
        saveAttemptedRef.current = false;
        saveInFlightRef.current = false;
        toast.error('Failed to save match');
        console.error('Error saving match:', error);
      },
    });
  }, [match, storeMatch, matchHistory]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // When dialog is closed (via escape, outside click, or close button), reset the match
      resetMatch();
    }
  };

  const handleNewMatch = () => {
    resetMatch();
  };

  if (!match.isMatchComplete || !match.firstInnings) return null;

  // Determine winner
  let winner = '';
  let margin = '';
  
  if (match.currentInnings === 2) {
    const secondInningsRuns = match.totalRuns;
    const firstInningsRuns = match.firstInnings.runs;
    
    if (secondInningsRuns > firstInningsRuns) {
      // Chasing team won (second innings batting team)
      winner = match.battingTeam;
      const wicketsRemaining = 10 - match.totalWickets;
      margin = `by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
    } else if (secondInningsRuns === firstInningsRuns) {
      // Tie
      winner = 'Match Tied';
      margin = '';
    } else {
      // First innings team won (defending team, which is first innings batting team)
      winner = match.firstInnings.battingTeam;
      const runsMargin = firstInningsRuns - secondInningsRuns;
      margin = `by ${runsMargin} run${runsMargin !== 1 ? 's' : ''}`;
    }
  }

  // Combine all players and bowlers from both innings (including retired batsmen)
  const allPlayers: Player[] = [
    ...(match.firstInnings.players || []),
    ...match.players,
  ];

  const allBowlers: Bowler[] = [
    ...(match.firstInnings.bowlers || []),
    ...match.bowlers,
  ];

  // Calculate statistics (including retired batsmen)
  // Top scorer
  const topScorer = allPlayers.length > 0 
    ? allPlayers.reduce((max, player) => player.runs > max.runs ? player : max, allPlayers[0])
    : null;

  // Highest strike rate (minimum 10 balls faced, including retired batsmen)
  const eligibleBatsmen = allPlayers.filter(p => p.ballsFaced >= 10);
  const highestStrikeRate = eligibleBatsmen.length > 0
    ? eligibleBatsmen.reduce((max, player) => {
        const sr = (player.runs / player.ballsFaced) * 100;
        const maxSr = (max.runs / max.ballsFaced) * 100;
        return sr > maxSr ? player : max;
      }, eligibleBatsmen[0])
    : null;

  // Top wicket taker
  const topWicketTaker = allBowlers.length > 0
    ? allBowlers.reduce((max, bowler) => bowler.wickets > max.wickets ? bowler : max, allBowlers[0])
    : null;

  // Best economy rate (minimum 2 overs bowled)
  const eligibleBowlers = allBowlers.filter(b => b.overs >= 2);
  const bestEconomy = eligibleBowlers.length > 0
    ? eligibleBowlers.reduce((min, bowler) => {
        const totalOvers = bowler.overs + bowler.balls / 6;
        const economy = bowler.runsConceded / totalOvers;
        const minTotalOvers = min.overs + min.balls / 6;
        const minEconomy = min.runsConceded / minTotalOvers;
        return economy < minEconomy ? bowler : min;
      }, eligibleBowlers[0])
    : null;

  const getStrikeRate = (runs: number, balls: number) => {
    return balls > 0 ? ((runs / balls) * 100).toFixed(1) : '0.0';
  };

  const getEconomy = (runs: number, overs: number, balls: number) => {
    const totalOvers = overs + balls / 6;
    return totalOvers > 0 ? (runs / totalOvers).toFixed(2) : '0.00';
  };

  return (
    <Dialog open={match.isMatchComplete} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Match Complete
          </DialogTitle>
          <DialogDescription>
            The match has concluded
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Winner Display */}
          <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
            <div className="text-center">
              <Award className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <div className="text-2xl font-bold mb-1">{winner}</div>
              {margin && <div className="text-lg text-muted-foreground">{margin}</div>}
            </div>
          </Card>

          {/* Match Summary */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 bg-muted/50">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">{match.firstInnings.battingTeam}</div>
                <div className="text-2xl font-bold">
                  {match.firstInnings.runs}/{match.firstInnings.wickets}
                </div>
                <div className="text-sm text-muted-foreground">
                  {match.firstInnings.overs}.{match.firstInnings.balls} ov
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-muted/50">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">{match.battingTeam}</div>
                <div className="text-2xl font-bold">
                  {match.totalRuns}/{match.totalWickets}
                </div>
                <div className="text-sm text-muted-foreground">
                  {match.totalOvers}.{match.totalBalls % 6} ov
                </div>
              </div>
            </Card>
          </div>

          <Separator />

          {/* Match Statistics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Match Statistics
            </h3>

            <div className="grid gap-3">
              {/* Top Scorer */}
              {topScorer && topScorer.runs > 0 && (
                <Card className="p-4 bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground font-medium">Top Scorer</div>
                        <div className="font-semibold">{topScorer.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{topScorer.runs}</div>
                      <div className="text-xs text-muted-foreground">
                        ({topScorer.ballsFaced} balls)
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Highest Strike Rate */}
              {highestStrikeRate && (
                <Card className="p-4 bg-gradient-to-r from-orange-500/5 to-transparent border-orange-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground font-medium">Highest Strike Rate</div>
                        <div className="font-semibold">{highestStrikeRate.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-500">
                        {getStrikeRate(highestStrikeRate.runs, highestStrikeRate.ballsFaced)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {highestStrikeRate.runs} runs ({highestStrikeRate.ballsFaced} balls)
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Top Wicket Taker */}
              {topWicketTaker && topWicketTaker.wickets > 0 && (
                <Card className="p-4 bg-gradient-to-r from-red-500/5 to-transparent border-red-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground font-medium">Top Wicket Taker</div>
                        <div className="font-semibold">{topWicketTaker.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-500">{topWicketTaker.wickets}</div>
                      <div className="text-xs text-muted-foreground">
                        wicket{topWicketTaker.wickets !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Best Economy Rate */}
              {bestEconomy && (
                <Card className="p-4 bg-gradient-to-r from-green-500/5 to-transparent border-green-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground font-medium">Best Economy Rate</div>
                        <div className="font-semibold">{bestEconomy.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-500">
                        {getEconomy(bestEconomy.runsConceded, bestEconomy.overs, bestEconomy.balls)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {bestEconomy.overs}.{bestEconomy.balls} overs
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button onClick={handleOpenChange.bind(null, false)} variant="outline" size="lg" className="w-full sm:w-auto">
            Close
          </Button>
          <Button onClick={handleNewMatch} size="lg" className="w-full sm:w-auto">
            New Match
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
