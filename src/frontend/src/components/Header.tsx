import { Menu, BarChart3, Target, Trophy, History, TrendingUp, Trash2, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMatch } from '../contexts/MatchContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useClearMatchHistory } from '../hooks/useQueries';
import { useDeploymentDiagnostics } from '../hooks/useDeploymentDiagnostics';
import { toast } from 'sonner';

type View = 'scoring' | 'stats' | 'history' | 'analytics' | 'scorecard' | 'matchAnalytics';

interface HeaderProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onOpenDiagnostics: () => void;
}

export default function Header({ currentView, onViewChange, onOpenDiagnostics }: HeaderProps) {
  const { match, resetMatch } = useMatch();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showNewMatchDialog, setShowNewMatchDialog] = useState(false);
  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false);
  const clearHistoryMutation = useClearMatchHistory();
  const { isEnabled, diagnostics } = useDeploymentDiagnostics();

  const handleReset = () => {
    resetMatch();
    setShowResetDialog(false);
  };

  const handleNewMatch = () => {
    resetMatch();
    setShowNewMatchDialog(false);
    onViewChange('scoring');
    // Trigger the new match dialog
    window.dispatchEvent(new CustomEvent('open-new-match-dialog'));
  };

  const handleClearHistory = async () => {
    try {
      await clearHistoryMutation.mutateAsync();
      setShowClearHistoryDialog(false);
      toast.success('All match history cleared successfully');
      // Navigate to scoring view if currently viewing history or analytics
      if (currentView === 'history' || currentView === 'analytics' || currentView === 'scorecard' || currentView === 'matchAnalytics') {
        onViewChange('scoring');
      }
    } catch (error) {
      console.error('Error clearing match history:', error);
      toast.error('Failed to clear match history. Please try again.');
    }
  };

  const getViewIcon = () => {
    switch (currentView) {
      case 'stats':
        return <BarChart3 className="w-5 h-5" />;
      case 'history':
        return <History className="w-5 h-5" />;
      case 'analytics':
        return <TrendingUp className="w-5 h-5" />;
      case 'scorecard':
        return <History className="w-5 h-5" />;
      case 'matchAnalytics':
        return <BarChart3 className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'stats':
        return 'Match Stats';
      case 'history':
        return 'Match History';
      case 'analytics':
        return 'Analytics';
      case 'scorecard':
        return 'Scorecard';
      case 'matchAnalytics':
        return 'Match Analytics';
      default:
        return 'Cricket Scorer';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-6xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70">
              {getViewIcon()}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{getViewTitle()}</h1>
              {match.isMatchStarted && currentView === 'scoring' && (
                <p className="text-xs text-muted-foreground">{match.matchOvers} overs match</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {match.isMatchStarted && currentView === 'scoring' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onViewChange('stats')}
                className="relative"
              >
                <BarChart3 className="w-5 h-5" />
              </Button>
            )}
            
            {currentView !== 'scoring' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onViewChange('scoring')}
                className="relative"
              >
                <Target className="w-5 h-5" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onViewChange('scoring')}>
                  <Target className="w-4 h-4 mr-2" />
                  Scoring
                </DropdownMenuItem>
                {match.isMatchStarted && (
                  <DropdownMenuItem onClick={() => onViewChange('stats')}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Match Stats
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onViewChange('history')}>
                  <History className="w-4 h-4 mr-2" />
                  Match History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewChange('analytics')}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analytics
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowNewMatchDialog(true)}>
                  New Match
                </DropdownMenuItem>
                {match.isMatchStarted && (
                  <DropdownMenuItem onClick={() => setShowResetDialog(true)} className="text-destructive">
                    Reset Match
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowClearHistoryDialog(true)} 
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All History
                </DropdownMenuItem>
                {(isEnabled || diagnostics) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onOpenDiagnostics}>
                      <Bug className="w-4 h-4 mr-2" />
                      Deployment Diagnostics
                      {diagnostics && (
                        <Badge variant="destructive" className="ml-auto text-xs">
                          Error
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Match Info Bar */}
        {match.isMatchStarted && match.toss && currentView === 'scoring' && (
          <div className="border-t border-border/40 bg-muted/30">
            <div className="container mx-auto px-4 py-2 max-w-6xl">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{match.teamA}</span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="font-semibold">{match.teamB}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Trophy className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Toss won by {match.toss.winner}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="default" className="text-xs">
                  Batting: {match.battingTeam}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Bowling: {match.bowlingTeam}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </header>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Match?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all match data including scores, players, and statistics. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showNewMatchDialog} onOpenChange={setShowNewMatchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start New Match?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear the current match data. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleNewMatch}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showClearHistoryDialog} onOpenChange={setShowClearHistoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Match History?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all stored match history, scorecards, and analytics data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearHistory} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={clearHistoryMutation.isPending}
            >
              {clearHistoryMutation.isPending ? 'Clearing...' : 'Clear All History'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
