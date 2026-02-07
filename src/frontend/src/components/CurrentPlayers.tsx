import { useMatch } from '../contexts/MatchContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Repeat, User, UserMinus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function CurrentPlayers() {
  const { match, addNewBatsman, changeBowler, swapStrike, retireBatsman } = useMatch();
  const [showBatsmanDialog, setShowBatsmanDialog] = useState(false);
  const [showBowlerDialog, setShowBowlerDialog] = useState(false);
  const [showRetireDialog, setShowRetireDialog] = useState(false);
  const [retiringBatsmanIndex, setRetiringBatsmanIndex] = useState<0 | 1 | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [bowlerName, setBowlerName] = useState('');
  const [replacementName, setReplacementName] = useState('');

  // Automatically show bowler change dialog when over completes
  useEffect(() => {
    if (match.needsBowlerChange) {
      setShowBowlerDialog(true);
    }
  }, [match.needsBowlerChange]);

  const handleAddBatsman = () => {
    if (playerName.trim()) {
      addNewBatsman(playerName.trim());
      setPlayerName('');
      setShowBatsmanDialog(false);
    }
  };

  const handleChangeBowler = () => {
    if (bowlerName.trim()) {
      changeBowler(bowlerName.trim());
      setBowlerName('');
      setShowBowlerDialog(false);
    }
  };

  const handleRetireBatsman = (index: 0 | 1) => {
    setRetiringBatsmanIndex(index);
    setShowRetireDialog(true);
  };

  const handleConfirmRetirement = () => {
    if (retiringBatsmanIndex !== null && replacementName.trim()) {
      const retiringBatsman = match.currentBatsmen[retiringBatsmanIndex];
      retireBatsman(retiringBatsmanIndex, replacementName.trim());
      toast.info(`${retiringBatsman?.name} retired`, {
        description: `${replacementName.trim()} is now batting`,
      });
      setReplacementName('');
      setShowRetireDialog(false);
      setRetiringBatsmanIndex(null);
    }
  };

  const striker = match.currentBatsmen[match.striker];
  const nonStriker = match.currentBatsmen[match.striker === 0 ? 1 : 0];

  const getStrikeRate = (runs: number, balls: number) => {
    return balls > 0 ? ((runs / balls) * 100).toFixed(1) : '0.0';
  };

  const canRetire = !match.isInningsComplete && !match.isMatchComplete;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Batsmen Card */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Batsmen
            </h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={swapStrike}
                disabled={!striker || !nonStriker}
              >
                <Repeat className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBatsmanDialog(true)}
                disabled={!!(match.currentBatsmen[0] && match.currentBatsmen[1])}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {striker ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{striker.name}</span>
                      <Badge variant="default" className="text-xs">Striker</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {striker.runs} ({striker.ballsFaced}) • SR: {getStrikeRate(striker.runs, striker.ballsFaced)}
                    </div>
                  </div>
                </div>
                {canRetire && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRetireBatsman(match.striker)}
                    className="w-full"
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    Retire Batsman
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground">
                No striker
              </div>
            )}

            {nonStriker ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="font-semibold mb-1">{nonStriker.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {nonStriker.runs} ({nonStriker.ballsFaced}) • SR: {getStrikeRate(nonStriker.runs, nonStriker.ballsFaced)}
                    </div>
                  </div>
                </div>
                {canRetire && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRetireBatsman(match.striker === 0 ? 1 : 0)}
                    className="w-full"
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    Retire Batsman
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground">
                No non-striker
              </div>
            )}
          </div>
        </Card>

        {/* Bowler Card */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Bowler
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowBowlerDialog(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {match.currentBowler ? (
            <div className="p-4 rounded-lg bg-accent/50">
              <div className="font-semibold text-lg mb-2">{match.currentBowler.name}</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Overs</div>
                  <div className="font-semibold">{match.currentBowler.overs}.{match.currentBowler.balls}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Wickets</div>
                  <div className="font-semibold">{match.currentBowler.wickets}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Runs</div>
                  <div className="font-semibold">{match.currentBowler.runsConceded}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Economy</div>
                  <div className="font-semibold">
                    {match.currentBowler.overs > 0 || match.currentBowler.balls > 0
                      ? ((match.currentBowler.runsConceded / (match.currentBowler.overs + match.currentBowler.balls / 6)) || 0).toFixed(2)
                      : '0.00'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground">
              No bowler selected
            </div>
          )}
        </Card>
      </div>

      {/* Add Batsman Dialog */}
      <Dialog open={showBatsmanDialog} onOpenChange={setShowBatsmanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Batsman</DialogTitle>
            <DialogDescription>Enter the name of the new batsman</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="batsman-name">Player Name</Label>
              <Input
                id="batsman-name"
                placeholder="Enter player name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddBatsman()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatsmanDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBatsman} disabled={!playerName.trim()}>
              Add Player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Retire Batsman Dialog */}
      <Dialog open={showRetireDialog} onOpenChange={(open) => {
        if (!open) {
          setShowRetireDialog(false);
          setRetiringBatsmanIndex(null);
          setReplacementName('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retire Batsman</DialogTitle>
            <DialogDescription>
              {retiringBatsmanIndex !== null && match.currentBatsmen[retiringBatsmanIndex] && (
                <>
                  {match.currentBatsmen[retiringBatsmanIndex]!.name} is retiring. Enter the name of the replacement batsman.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="replacement-name">Replacement Batsman</Label>
              <Input
                id="replacement-name"
                placeholder="Enter replacement batsman name"
                value={replacementName}
                onChange={(e) => setReplacementName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmRetirement()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRetireDialog(false);
              setRetiringBatsmanIndex(null);
              setReplacementName('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRetirement} disabled={!replacementName.trim()}>
              Confirm Retirement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Bowler Dialog */}
      <Dialog open={showBowlerDialog} onOpenChange={(open) => {
        // Prevent closing if bowler change is required
        if (!open && match.needsBowlerChange) {
          return;
        }
        setShowBowlerDialog(open);
      }}>
        <DialogContent className={match.needsBowlerChange ? "pointer-events-auto" : ""}>
          <DialogHeader>
            <DialogTitle>
              {match.needsBowlerChange ? 'Over Complete - Change Bowler' : 'Change Bowler'}
            </DialogTitle>
            <DialogDescription>
              {match.needsBowlerChange 
                ? 'The over is complete. Please select the next bowler to continue.'
                : 'Enter the name of the bowler'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bowler-name">Bowler Name</Label>
              <Input
                id="bowler-name"
                placeholder="Enter bowler name"
                value={bowlerName}
                onChange={(e) => setBowlerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChangeBowler()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            {!match.needsBowlerChange && (
              <Button variant="outline" onClick={() => setShowBowlerDialog(false)}>
                Cancel
              </Button>
            )}
            <Button onClick={handleChangeBowler} disabled={!bowlerName.trim()}>
              {match.needsBowlerChange ? 'Continue Match' : 'Change Bowler'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
