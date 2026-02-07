import { useMatchHistory } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, BarChart3, FileText, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MatchHistoryProps {
  onViewMatch: (matchIndex: number) => void;
  onViewAnalytics: (matchIndex: number) => void;
}

export default function MatchHistory({ onViewMatch, onViewAnalytics }: MatchHistoryProps) {
  const { data: matches, isLoading, error } = useMatchHistory();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading match history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading History</CardTitle>
            <CardDescription>Failed to load match history. Please try again later.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Match History</CardTitle>
            <CardDescription>
              Complete matches will appear here. Start a new match to begin tracking your cricket games.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Reverse for display (newest first) but keep track of backend indices
  const displayMatches = [...matches].reverse();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Match History</h2>
        <p className="text-muted-foreground">
          View detailed scorecards and analytics for completed matches
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {displayMatches.map((match, displayIndex) => {
          // Calculate the backend index (reverse of display index)
          const backendIndex = matches.length - 1 - displayIndex;
          
          const teamAScore = Number(match.teamAScore);
          const teamBScore = Number(match.teamBScore);
          const overs = Number(match.overs);
          const matchDate = match.date || 'Date not available';

          return (
            <Card key={backendIndex} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">
                      {match.teamA} vs {match.teamB}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <Calendar className="w-3 h-3" />
                      {matchDate}
                    </CardDescription>
                  </div>
                  <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{match.teamA}</span>
                    <span className="text-lg font-bold">{teamAScore}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{match.teamB}</span>
                    <span className="text-lg font-bold">{teamBScore}</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">Winner</span>
                    <Badge variant="default" className="text-xs">
                      {match.winner}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Format</span>
                    <span className="text-xs">{overs} overs</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => onViewMatch(backendIndex)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Scorecard
                  </Button>
                  <Button
                    onClick={() => onViewAnalytics(backendIndex)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
