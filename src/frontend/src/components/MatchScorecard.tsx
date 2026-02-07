import { useMatchHistory } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Target, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface MatchScorecardProps {
  matchIndex: number;
  onBack: () => void;
}

export default function MatchScorecard({ matchIndex, onBack }: MatchScorecardProps) {
  const { data: matches, isLoading, error } = useMatchHistory();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading scorecard...</p>
        </div>
      </div>
    );
  }

  if (error || !matches || matchIndex >= matches.length || matchIndex < 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Scorecard</CardTitle>
            <CardDescription>Failed to load match scorecard. Please try again.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const match = matches[matchIndex];
  const teamAScore = Number(match.teamAScore);
  const teamBScore = Number(match.teamBScore);
  const overs = Number(match.overs);

  const renderInningsScorecard = (innings: typeof match.innings1, inningsNumber: number, battingTeam: string) => {
    const totalScore = Number(innings.totalScore);
    const wickets = Number(innings.wickets);
    const oversPlayed = Number(innings.overs);
    const extras = innings.extras;
    const totalExtras = Number(extras.wides) + Number(extras.noBalls) + Number(extras.byes) + Number(extras.legByes);

    const hasBatsmen = innings.batsmen && innings.batsmen.length > 0;
    const hasBowlers = innings.bowlers && innings.bowlers.length > 0;

    return (
      <div className="space-y-6">
        {/* Innings Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{battingTeam} - Innings {inningsNumber}</span>
              <Badge variant="outline" className="text-lg">
                {totalScore}/{wickets} ({oversPlayed} overs)
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Batting Card */}
        <Card>
          <CardHeader>
            <CardTitle>Batting</CardTitle>
          </CardHeader>
          <CardContent>
            {hasBatsmen ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batsman</TableHead>
                      <TableHead className="text-right">Runs</TableHead>
                      <TableHead className="text-right">Balls</TableHead>
                      <TableHead className="text-right">SR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {innings.batsmen.map((batsman, idx) => {
                      const runs = Number(batsman.runs);
                      const balls = Number(batsman.ballsFaced);
                      const strikeRate = batsman.strikeRate;
                      const isRetired = batsman.retired;
                      
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {isRetired ? `Retired – ${batsman.name}` : batsman.name}
                              {isRetired && (
                                <Badge variant="secondary" className="text-xs">Retired</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{runs}</TableCell>
                          <TableCell className="text-right">{balls}</TableCell>
                          <TableCell className="text-right">{strikeRate.toFixed(1)}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-semibold">Extras</TableCell>
                      <TableCell className="text-right font-semibold">{totalExtras}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground" colSpan={2}>
                        (wd {Number(extras.wides)}, nb {Number(extras.noBalls)}, b {Number(extras.byes)}, lb {Number(extras.legByes)})
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-primary/5">
                      <TableCell className="font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold">{totalScore}</TableCell>
                      <TableCell className="text-right font-bold" colSpan={2}>
                        {wickets} wickets
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No batting data available for this innings
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bowling Card */}
        <Card>
          <CardHeader>
            <CardTitle>Bowling</CardTitle>
          </CardHeader>
          <CardContent>
            {hasBowlers ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bowler</TableHead>
                      <TableHead className="text-right">Overs</TableHead>
                      <TableHead className="text-right">Runs</TableHead>
                      <TableHead className="text-right">Wickets</TableHead>
                      <TableHead className="text-right">Econ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {innings.bowlers.map((bowler, idx) => {
                      const oversComplete = Number(bowler.overs);
                      const balls = Number(bowler.balls);
                      const oversDisplay = balls > 0 ? `${oversComplete}.${balls}` : `${oversComplete}`;
                      const runs = Number(bowler.runsConceded);
                      const wickets = Number(bowler.wickets);
                      const economy = bowler.economyRate;
                      
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{bowler.name}</TableCell>
                          <TableCell className="text-right">{oversDisplay}</TableCell>
                          <TableCell className="text-right">{runs}</TableCell>
                          <TableCell className="text-right">{wickets}</TableCell>
                          <TableCell className="text-right">{economy.toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No bowling data available for this innings
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Determine which team batted in which innings
  // For backward compatibility, check if tossInfo has a choice field (old data)
  const tossInfo = match.tossInfo as any;
  const hasChoice = tossInfo.choice !== undefined && tossInfo.choice !== null;
  
  let firstInningsBattingTeam: string;
  let secondInningsBattingTeam: string;
  
  if (hasChoice) {
    // Old data with choice field
    firstInningsBattingTeam = tossInfo.choice === 'bat' ? tossInfo.winningTeam : 
      (tossInfo.winningTeam === match.teamA ? match.teamB : match.teamA);
    secondInningsBattingTeam = firstInningsBattingTeam === match.teamA ? match.teamB : match.teamA;
  } else {
    // New data without choice field - determine from innings data
    // Use the batting team from innings1 data
    firstInningsBattingTeam = match.innings1.batsmen.length > 0 ? 
      (match.innings1.batsmen[0].name.includes(match.teamA) ? match.teamA : match.teamB) : 
      match.teamA;
    secondInningsBattingTeam = firstInningsBattingTeam === match.teamA ? match.teamB : match.teamA;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">Match Scorecard</h2>
          <p className="text-muted-foreground">
            {match.teamA} vs {match.teamB}
          </p>
        </div>
      </div>

      {/* Match Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Match Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{match.teamA}</p>
              <p className="text-3xl font-bold">{teamAScore}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{match.teamB}</p>
              <p className="text-3xl font-bold">{teamBScore}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Winner:</span>
            </div>
            <Badge variant="default" className="text-sm">
              {match.winner}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Match Format:</span>
            </div>
            <span className="text-sm">{overs} overs per side</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Toss:</span>
            </div>
            <span className="text-sm">
              {hasChoice 
                ? `${tossInfo.winningTeam} won and chose to ${tossInfo.choice}`
                : `Toss won by ${tossInfo.winningTeam}`
              }
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Innings Tabs */}
      <Tabs defaultValue="innings1" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="innings1">1st Innings ({firstInningsBattingTeam})</TabsTrigger>
          <TabsTrigger value="innings2">2nd Innings ({secondInningsBattingTeam})</TabsTrigger>
        </TabsList>
        <TabsContent value="innings1" className="mt-6">
          {renderInningsScorecard(match.innings1, 1, firstInningsBattingTeam)}
        </TabsContent>
        <TabsContent value="innings2" className="mt-6">
          {renderInningsScorecard(match.innings2, 2, secondInningsBattingTeam)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
