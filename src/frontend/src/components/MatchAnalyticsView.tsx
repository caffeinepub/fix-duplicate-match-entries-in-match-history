import { useMatchAnalytics, useMatchHistory } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Target, TrendingUp, Loader2, Award } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface MatchAnalyticsViewProps {
  matchIndex: number;
  onBack: () => void;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function MatchAnalyticsView({ matchIndex, onBack }: MatchAnalyticsViewProps) {
  const { data: matches, isLoading: matchesLoading } = useMatchHistory();
  const { data: analytics, isLoading: analyticsLoading, error } = useMatchAnalytics(matchIndex);

  const isLoading = matchesLoading || analyticsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading match analytics...</p>
        </div>
      </div>
    );
  }

  if (!matches || matchIndex >= matches.length || matchIndex < 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Match Not Found</CardTitle>
            <CardDescription>The requested match could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const match = matches[matchIndex];

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Analytics Not Available</CardTitle>
            <CardDescription>
              Analytics data is not available for this match. This may happen if the match data is incomplete.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const teamAScore = Number(match.teamAScore);
  const teamBScore = Number(match.teamBScore);

  // Get top 5 batsmen from both innings
  const allBatsmen = [
    ...match.innings1.batsmen.map(b => ({ name: b.name, runs: Number(b.runs), strikeRate: b.strikeRate })),
    ...match.innings2.batsmen.map(b => ({ name: b.name, runs: Number(b.runs), strikeRate: b.strikeRate }))
  ].filter(b => b.runs > 0).sort((a, b) => b.runs - a.runs).slice(0, 5);

  const batsmenChartData = allBatsmen.map((b, idx) => ({
    name: b.name,
    runs: b.runs,
    strikeRate: b.strikeRate,
    fill: COLORS[idx % COLORS.length]
  }));

  // Get top bowlers from both innings
  const allBowlers = [
    ...match.innings1.bowlers.map(b => ({ name: b.name, wickets: Number(b.wickets), economy: b.economyRate })),
    ...match.innings2.bowlers.map(b => ({ name: b.name, wickets: Number(b.wickets), economy: b.economyRate }))
  ].filter(b => b.wickets > 0).sort((a, b) => b.wickets - a.wickets).slice(0, 5);

  const bowlersChartData = allBowlers.map((b, idx) => ({
    name: b.name,
    wickets: b.wickets,
    economy: b.economy,
    fill: COLORS[idx % COLORS.length]
  }));

  // Score comparison data
  const scoreComparisonData = [
    { team: match.teamA, score: teamAScore, fill: COLORS[0] },
    { team: match.teamB, score: teamBScore, fill: COLORS[1] }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">Match Analytics</h2>
          <p className="text-muted-foreground">
            {match.teamA} vs {match.teamB}
          </p>
        </div>
      </div>

      {/* Key Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-yellow-500/5 to-transparent border-yellow-500/20">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Top Scorer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.topScorer.name || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">{Number(analytics.topScorer.runs)} runs</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Highest Strike Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.highestStrikeRate.name || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">{analytics.highestStrikeRate.rate.toFixed(1)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/5 to-transparent border-red-500/20">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Target className="w-4 h-4 text-red-500" />
              Top Wicket Taker
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.topWicketTaker.name || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">{Number(analytics.topWicketTaker.wickets)} wickets</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Award className="w-4 h-4 text-green-500" />
              Best Economy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{analytics.bestEconomyRate.name || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">{analytics.bestEconomyRate.rate.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Match Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Match Result
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{match.teamA}</p>
              <p className="text-3xl font-bold">{teamAScore}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{match.teamB}</p>
              <p className="text-3xl font-bold">{teamBScore}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Winner:</span>
            <Badge variant="default" className="text-sm">
              {match.winner}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Score Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Score Comparison</CardTitle>
            <CardDescription>Total runs scored by each team</CardDescription>
          </CardHeader>
          <CardContent>
            {scoreComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={scoreComparisonData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, score }) => `${name}: ${score}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="score"
                  >
                    {scoreComparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Batsmen */}
        <Card>
          <CardHeader>
            <CardTitle>Top Batsmen</CardTitle>
            <CardDescription>Highest run scorers in the match</CardDescription>
          </CardHeader>
          <CardContent>
            {batsmenChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={batsmenChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="runs" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No batting data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Bowlers */}
        {bowlersChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Bowlers</CardTitle>
              <CardDescription>Most wickets taken in the match</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={bowlersChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="wickets" fill="hsl(var(--destructive))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
