import { useMatch } from '../contexts/MatchContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function MatchStats() {
  const { match } = useMatch();

  const getStrikeRate = (runs: number, balls: number) => {
    return balls > 0 ? ((runs / balls) * 100).toFixed(1) : '0.0';
  };

  const getEconomy = (runs: number, overs: number, balls: number) => {
    const totalOvers = overs + balls / 6;
    return totalOvers > 0 ? (runs / totalOvers).toFixed(2) : '0.00';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Match Statistics</CardTitle>
          {match.battingTeam && match.bowlingTeam && (
            <div className="flex gap-2 mt-2">
              <Badge variant="default">Batting: {match.battingTeam}</Badge>
              <Badge variant="outline">Bowling: {match.bowlingTeam}</Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="batting" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="batting">Batting</TabsTrigger>
              <TabsTrigger value="bowling">Bowling</TabsTrigger>
            </TabsList>

            <TabsContent value="batting" className="mt-6">
              {match.players.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batsman</TableHead>
                        <TableHead className="text-right">Runs</TableHead>
                        <TableHead className="text-right">Balls</TableHead>
                        <TableHead className="text-right">4s</TableHead>
                        <TableHead className="text-right">6s</TableHead>
                        <TableHead className="text-right">SR</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {match.players.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {player.name}
                              {player.retired && (
                                <Badge variant="secondary" className="text-xs">Retired</Badge>
                              )}
                              {player.isOut && (
                                <Badge variant="destructive" className="text-xs">Out</Badge>
                              )}
                              {match.currentBatsmen[match.striker]?.id === player.id && !player.isOut && !player.retired && (
                                <Badge variant="default" className="text-xs">*</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{player.runs}</TableCell>
                          <TableCell className="text-right">{player.ballsFaced}</TableCell>
                          <TableCell className="text-right">{player.fours}</TableCell>
                          <TableCell className="text-right">{player.sixes}</TableCell>
                          <TableCell className="text-right">{getStrikeRate(player.runs, player.ballsFaced)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No batting statistics yet
                </div>
              )}
            </TabsContent>

            <TabsContent value="bowling" className="mt-6">
              {match.bowlers.length > 0 ? (
                <div className="rounded-md border">
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
                      {match.bowlers.map((bowler) => (
                        <TableRow key={bowler.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {bowler.name}
                              {match.currentBowler?.id === bowler.id && (
                                <Badge variant="default" className="text-xs">Current</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{bowler.overs}.{bowler.balls}</TableCell>
                          <TableCell className="text-right">{bowler.runsConceded}</TableCell>
                          <TableCell className="text-right font-semibold">{bowler.wickets}</TableCell>
                          <TableCell className="text-right">{getEconomy(bowler.runsConceded, bowler.overs, bowler.balls)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No bowling statistics yet
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
