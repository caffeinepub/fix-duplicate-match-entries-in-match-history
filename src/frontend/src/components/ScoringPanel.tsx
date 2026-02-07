import { useMatch } from '../contexts/MatchContext';
import ScoreDisplay from './ScoreDisplay';
import CurrentPlayers from './CurrentPlayers';
import ScoringButtons from './ScoringButtons';
import InningsTransitionDialog from './InningsTransitionDialog';
import MatchCompleteDialog from './MatchCompleteDialog';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { useState } from 'react';
import NewMatchDialog from './NewMatchDialog';

export default function ScoringPanel() {
  const { match } = useMatch();
  const [showNewMatchDialog, setShowNewMatchDialog] = useState(false);

  if (!match.isMatchStarted) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-6 max-w-md px-4">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Cricket Match Scorer</h2>
              <p className="text-muted-foreground text-lg">
                Start a new match to begin scoring
              </p>
            </div>
            <Button size="lg" onClick={() => setShowNewMatchDialog(true)} className="gap-2">
              <Play className="w-5 h-5" />
              Start New Match
            </Button>
          </div>
        </div>
        <NewMatchDialog open={showNewMatchDialog} onOpenChange={setShowNewMatchDialog} />
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <ScoreDisplay />
        <CurrentPlayers />
        <ScoringButtons />
      </div>
      <InningsTransitionDialog />
      <MatchCompleteDialog />
    </>
  );
}
