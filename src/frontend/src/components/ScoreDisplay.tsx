import { useMatch } from '../contexts/MatchContext';
import { Card } from '@/components/ui/card';
import { TrendingUp, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ScoreDisplay() {
  const { match } = useMatch();

  const currentRunRate = match.totalBalls > 0 
    ? ((match.totalRuns / match.totalBalls) * 6).toFixed(2)
    : '0.00';

  const ballsRemaining = (match.matchOvers * 6) - match.totalBalls;
  const projectedTotal = match.totalBalls > 0
    ? Math.round(match.totalRuns + (parseFloat(currentRunRate) * ballsRemaining / 6))
    : 0;

  const oversDisplay = `${match.totalOvers}.${match.totalBalls % 6}`;

  // Calculate required run rate for second innings
  const requiredRunRate = match.currentInnings === 2 && match.firstInnings && ballsRemaining > 0
    ? (((match.firstInnings.runs + 1 - match.totalRuns) / ballsRemaining) * 6).toFixed(2)
    : null;

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="space-y-6">
        {/* Team Name and Innings Badge */}
        {match.battingTeam && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h2 className="text-lg font-semibold text-muted-foreground">
                {match.battingTeam}
              </h2>
              <Badge variant="outline" className="text-xs">
                Innings {match.currentInnings}
              </Badge>
            </div>
            {match.currentInnings === 2 && match.firstInnings && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Target className="w-4 h-4" />
                <span>Target: {match.firstInnings.runs + 1}</span>
              </div>
            )}
          </div>
        )}

        {/* Main Score */}
        <div className="text-center">
          <div className="text-6xl font-bold tracking-tight mb-2">
            {match.totalRuns}
            <span className="text-3xl text-muted-foreground">/{match.totalWickets}</span>
          </div>
          <div className="text-2xl text-muted-foreground font-medium">
            {oversDisplay} overs
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">
              {match.currentInnings === 2 && requiredRunRate ? 'Required RR' : 'Run Rate'}
            </div>
            <div className="text-2xl font-bold">
              {match.currentInnings === 2 && requiredRunRate ? requiredRunRate : currentRunRate}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {match.currentInnings === 2 && match.firstInnings ? 'Need' : 'Projected'}
            </div>
            <div className="text-2xl font-bold">
              {match.currentInnings === 2 && match.firstInnings 
                ? Math.max(0, match.firstInnings.runs + 1 - match.totalRuns)
                : projectedTotal}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
