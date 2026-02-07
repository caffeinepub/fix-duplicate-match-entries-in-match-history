import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useMatch } from '../contexts/MatchContext';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Coins } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NewMatchDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function NewMatchDialog({ open: controlledOpen, onOpenChange }: NewMatchDialogProps = {}) {
  const { match, startNewMatch } = useMatch();
  const [internalOpen, setInternalOpen] = useState(!match.isMatchStarted);
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [overs, setOvers] = useState('20');
  const [tossWinner, setTossWinner] = useState<string>('');
  const [battingTeam, setBattingTeam] = useState<string>('');
  const [matchDate, setMatchDate] = useState<Date>(new Date());
  const [isVirtualTossUsed, setIsVirtualTossUsed] = useState(false);

  // Use controlled open if provided, otherwise use internal state
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('open-new-match-dialog', handleOpen);
    return () => window.removeEventListener('open-new-match-dialog', handleOpen);
  }, [setOpen]);

  const handleVirtualToss = () => {
    if (!teamA.trim() || !teamB.trim()) {
      toast.error('Please enter both team names first');
      return;
    }

    // Random selection between the two teams
    const teams = [teamA.trim(), teamB.trim()];
    const randomTeamIndex = Math.floor(Math.random() * 2);
    const winner = teams[randomTeamIndex];

    // Set the toss winner
    setTossWinner(winner);
    // Set the batting team to the toss winner by default
    setBattingTeam(winner);
    setIsVirtualTossUsed(true);

    // Show toast notification
    toast.success(
      `${winner} won the toss`,
      { duration: 3000 }
    );
  };

  const handleManualTossChange = () => {
    if (isVirtualTossUsed) {
      setIsVirtualTossUsed(false);
    }
  };

  const handleStart = () => {
    const oversNum = parseInt(overs);
    if (teamA.trim() && teamB.trim() && overs && oversNum > 0 && tossWinner && battingTeam && matchDate) {
      startNewMatch(oversNum, teamA.trim(), teamB.trim(), {
        winner: tossWinner,
      }, battingTeam, format(matchDate, 'yyyy-MM-dd'));
      setOpen(false);
      // Reset virtual toss state
      setIsVirtualTossUsed(false);
    }
  };

  const isFormValid = teamA.trim() && teamB.trim() && overs && parseInt(overs) > 0 && tossWinner && battingTeam && matchDate;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Start New Match</DialogTitle>
          <DialogDescription>
            Configure your cricket match settings
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Team Names */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-a">Team A Name</Label>
              <Input
                id="team-a"
                placeholder="Enter first team name"
                value={teamA}
                onChange={(e) => setTeamA(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-b">Team B Name</Label>
              <Input
                id="team-b"
                placeholder="Enter second team name"
                value={teamB}
                onChange={(e) => setTeamB(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Match Date */}
          <div className="space-y-2">
            <Label>Match Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !matchDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {matchDate ? format(matchDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={matchDate}
                  onSelect={(date) => date && setMatchDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          {/* Match Overs */}
          <div className="space-y-2">
            <Label htmlFor="overs">Match Overs</Label>
            <Input
              id="overs"
              type="number"
              min="1"
              placeholder="Enter number of overs"
              value={overs}
              onChange={(e) => setOvers(e.target.value)}
            />
          </div>

          <Separator />

          {/* Virtual Toss */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Toss</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleVirtualToss}
                disabled={!teamA.trim() || !teamB.trim()}
                className="gap-2"
              >
                <Coins className="h-4 w-4" />
                Virtual Toss
              </Button>
            </div>

            {isVirtualTossUsed && (
              <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
                <p className="text-sm font-medium text-primary">
                  Virtual Toss Result: {tossWinner} won the toss
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You can manually override this result below
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Label>Toss Winner</Label>
              <RadioGroup 
                value={tossWinner} 
                onValueChange={(value) => {
                  setTossWinner(value);
                  // Auto-select batting team when toss winner changes
                  if (!battingTeam) {
                    setBattingTeam(value);
                  }
                  handleManualTossChange();
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={teamA || 'team-a'} id="toss-team-a" disabled={!teamA.trim()} />
                  <Label htmlFor="toss-team-a" className="font-normal cursor-pointer">
                    {teamA.trim() || 'Team A'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={teamB || 'team-b'} id="toss-team-b" disabled={!teamB.trim()} />
                  <Label htmlFor="toss-team-b" className="font-normal cursor-pointer">
                    {teamB.trim() || 'Team B'}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Batting First</Label>
              <RadioGroup 
                value={battingTeam} 
                onValueChange={(value) => {
                  setBattingTeam(value);
                  handleManualTossChange();
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={teamA || 'team-a'} id="batting-team-a" disabled={!teamA.trim()} />
                  <Label htmlFor="batting-team-a" className="font-normal cursor-pointer">
                    {teamA.trim() || 'Team A'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={teamB || 'team-b'} id="batting-team-b" disabled={!teamB.trim()} />
                  <Label htmlFor="batting-team-b" className="font-normal cursor-pointer">
                    {teamB.trim() || 'Team B'}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleStart} 
            disabled={!isFormValid} 
            className="w-full"
          >
            Start Match
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
