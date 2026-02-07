import { useMatch } from '../contexts/MatchContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function InningsTransitionDialog() {
  const { match, startSecondInnings } = useMatch();

  const isOpen = match.showInningsTransition && match.isInningsComplete && match.currentInnings === 1;

  if (!isOpen) return null;

  const target = match.totalRuns + 1;

  const handleStartSecondInnings = () => {
    startSecondInnings();
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="w-6 h-6 text-primary" />
            Innings Complete
          </DialogTitle>
          <DialogDescription>
            First innings has ended. Time for {match.bowlingTeam} to chase!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* First Innings Summary */}
          <Card className="p-4 bg-muted/50">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">{match.battingTeam}</div>
              <div className="text-4xl font-bold mb-1">
                {match.totalRuns}/{match.totalWickets}
              </div>
              <div className="text-lg text-muted-foreground">
                {match.totalOvers}.{match.totalBalls % 6} overs
              </div>
            </div>
          </Card>

          {/* Target Display */}
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary" />
                <div className="text-sm font-semibold text-primary">Target</div>
              </div>
              <div className="text-5xl font-bold text-primary mb-1">{target}</div>
              <div className="text-sm text-muted-foreground">
                {match.bowlingTeam} needs {target} runs to win
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={handleStartSecondInnings} size="lg" className="w-full">
            Start Second Innings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
