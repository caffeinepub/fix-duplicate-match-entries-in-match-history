import { useMatch } from '../contexts/MatchContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ScoringButtons() {
  const { match, addRuns, addWide, addNoBall, addWicket } = useMatch();
  const [showNoBallDialog, setShowNoBallDialog] = useState(false);

  const canScore = match.currentBatsmen[match.striker] && match.currentBowler && !match.isInningsComplete && !match.isMatchComplete;

  const handleScore = (runs: number) => {
    if (!canScore) {
      if (match.isInningsComplete || match.isMatchComplete) {
        toast.info('Innings is complete');
      } else {
        toast.error('Please add batsmen and bowler first');
      }
      return;
    }
    addRuns(runs);
    toast.success(`${runs} run${runs !== 1 ? 's' : ''} added`);
  };

  const handleWide = () => {
    if (!canScore) {
      if (match.isInningsComplete || match.isMatchComplete) {
        toast.info('Innings is complete');
      } else {
        toast.error('Please add batsmen and bowler first');
      }
      return;
    }
    addWide();
    toast.info('Wide ball');
  };

  const handleNoBall = (runs: number) => {
    if (!canScore) {
      if (match.isInningsComplete || match.isMatchComplete) {
        toast.info('Innings is complete');
      } else {
        toast.error('Please add batsmen and bowler first');
      }
      return;
    }
    addNoBall(runs);
    setShowNoBallDialog(false);
    toast.info(`No ball + ${runs} run${runs !== 1 ? 's' : ''}`);
  };

  const handleWicket = () => {
    if (!canScore) {
      if (match.isInningsComplete || match.isMatchComplete) {
        toast.info('Innings is complete');
      } else {
        toast.error('Please add batsmen and bowler first');
      }
      return;
    }
    addWicket();
    toast.error('Wicket!', {
      description: `${match.currentBatsmen[match.striker]?.name} is out`,
    });
  };

  return (
    <>
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Scoring</h3>
        
        {!canScore && !match.isInningsComplete && !match.isMatchComplete && (
          <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Add batsmen and select a bowler to start scoring
            </p>
          </div>
        )}

        {(match.isInningsComplete || match.isMatchComplete) && (
          <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-2">
            <Trophy className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-primary font-medium">
              {match.isMatchComplete ? 'Match Complete' : 'Innings Complete'}
            </p>
          </div>
        )}

        {/* Run Buttons */}
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2 text-muted-foreground">Runs</div>
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2, 3, 4, 6].map((runs) => (
                <Button
                  key={runs}
                  size="lg"
                  variant={runs === 4 || runs === 6 ? 'default' : 'outline'}
                  onClick={() => handleScore(runs)}
                  disabled={!canScore}
                  className="h-16 text-2xl font-bold"
                >
                  {runs}
                </Button>
              ))}
            </div>
          </div>

          {/* Extras */}
          <div>
            <div className="text-sm font-medium mb-2 text-muted-foreground">Extras</div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg"
                variant="secondary"
                onClick={handleWide}
                disabled={!canScore}
                className="h-14 text-lg font-semibold"
              >
                Wide
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => setShowNoBallDialog(true)}
                disabled={!canScore}
                className="h-14 text-lg font-semibold"
              >
                No Ball
              </Button>
            </div>
          </div>

          {/* Wicket */}
          <div>
            <Button
              size="lg"
              variant="destructive"
              onClick={handleWicket}
              disabled={!canScore}
              className="w-full h-14 text-lg font-semibold"
            >
              Wicket
            </Button>
          </div>
        </div>
      </Card>

      {/* No Ball Dialog */}
      <Dialog open={showNoBallDialog} onOpenChange={setShowNoBallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Ball</DialogTitle>
            <DialogDescription>Select runs scored off the no ball</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-3 py-4">
            {[0, 1, 2, 3, 4, 6].map((runs) => (
              <Button
                key={runs}
                size="lg"
                variant="outline"
                onClick={() => handleNoBall(runs)}
                className="h-16 text-xl font-bold"
              >
                {runs}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNoBallDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
