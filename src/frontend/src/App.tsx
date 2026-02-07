import { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import Header from './components/Header';
import Footer from './components/Footer';
import ScoringPanel from './components/ScoringPanel';
import MatchStats from './components/MatchStats';
import MatchHistory from './components/MatchHistory';
import Analytics from './components/Analytics';
import MatchScorecard from './components/MatchScorecard';
import MatchAnalyticsView from './components/MatchAnalyticsView';
import NewMatchDialog from './components/NewMatchDialog';
import DeploymentDiagnosticsDialog from './components/DeploymentDiagnosticsDialog';
import { MatchProvider } from './contexts/MatchContext';

const queryClient = new QueryClient();

type View = 'scoring' | 'stats' | 'history' | 'analytics' | 'scorecard' | 'matchAnalytics';

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('scoring');
  const [selectedMatchIndex, setSelectedMatchIndex] = useState<number | null>(null);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  const handleViewScorecard = (matchIndex: number) => {
    setSelectedMatchIndex(matchIndex);
    setCurrentView('scorecard');
  };

  const handleViewMatchAnalytics = (matchIndex: number) => {
    setSelectedMatchIndex(matchIndex);
    setCurrentView('matchAnalytics');
  };

  const handleBackToHistory = () => {
    setSelectedMatchIndex(null);
    setCurrentView('history');
  };

  const renderView = () => {
    switch (currentView) {
      case 'stats':
        return <MatchStats />;
      case 'history':
        return <MatchHistory onViewMatch={handleViewScorecard} onViewAnalytics={handleViewMatchAnalytics} />;
      case 'analytics':
        return <Analytics />;
      case 'scorecard':
        return selectedMatchIndex !== null ? (
          <MatchScorecard matchIndex={selectedMatchIndex} onBack={handleBackToHistory} />
        ) : (
          <MatchHistory onViewMatch={handleViewScorecard} onViewAnalytics={handleViewMatchAnalytics} />
        );
      case 'matchAnalytics':
        return selectedMatchIndex !== null ? (
          <MatchAnalyticsView matchIndex={selectedMatchIndex} onBack={handleBackToHistory} />
        ) : (
          <MatchHistory onViewMatch={handleViewScorecard} onViewAnalytics={handleViewMatchAnalytics} />
        );
      default:
        return <ScoringPanel />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenDiagnostics={() => setDiagnosticsOpen(true)}
      />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        {renderView()}
      </main>
      <Footer />
      <NewMatchDialog />
      <DeploymentDiagnosticsDialog 
        open={diagnosticsOpen} 
        onOpenChange={setDiagnosticsOpen}
      />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
        <MatchProvider>
          <AppContent />
        </MatchProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
