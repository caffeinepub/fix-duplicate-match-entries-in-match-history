import { useState } from 'react';
import { useGetDateFilteredMatches } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp, Target, Loader2, BarChart3, AlertCircle, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function Analytics() {
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const dateString = filterDate ? format(filterDate, 'yyyy-MM-dd') : '';
  const { data: matches, isLoading, error } = useGetDateFilteredMatches(dateString);

  const clearFilter = () => {
    setFilterDate(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Analytics</CardTitle>
            <CardDescription>Failed to load analytics data. Please try again.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
            <p className="text-muted-foreground">
              {filterDate ? `Matches on ${format(filterDate, 'PPP')}` : 'All matches'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !filterDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterDate ? format(filterDate, 'PPP') : <span>Filter by date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={filterDate}
                  onSelect={setFilterDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {filterDate && (
              <Button variant="ghost" size="icon" onClick={clearFilter}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md text-center">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-muted-foreground" />
              </div>
              <CardTitle>No Analytics Available</CardTitle>
              <CardDescription>
                {filterDate 
                  ? `No matches found on ${format(filterDate, 'PPP')}. Try selecting a different date or clear the filter.`
                  : 'Complete some matches to see aggregated statistics and performance trends.'}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  // Validate and calculate analytics with error handling
  try {
    const totalMatches = matches.length;
    
    // Validate match data and convert scores safely
    const validMatches = matches.filter(m => {
      return m && 
             typeof m.teamA === 'string' && 
             typeof m.teamB === 'string' && 
             m.teamAScore !== undefined && 
             m.teamBScore !== undefined &&
             m.winner !== undefined;
    });

    if (validMatches.length === 0) {
      throw new Error('No valid match data found');
    }

    // Highest team totals
    const allScores = validMatches.flatMap(m => [
      { team: m.teamA, score: Number(m.teamAScore) },
      { team: m.teamB, score: Number(m.teamBScore) }
    ]).filter(s => !isNaN(s.score) && s.score >= 0);

    if (allScores.length === 0) {
      throw new Error('No valid scores found');
    }

    const highestScore = allScores.reduce((max, curr) => curr.score > max.score ? curr : max, allScores[0]);
    
    // Average scores
    const averageScore = allScores.reduce((sum, curr) => sum + curr.score, 0) / allScores.length;
    
    // Team statistics
    const teamStats = new Map<string, { played: number; won: number; totalRuns: number }>();
    
    validMatches.forEach(match => {
      // Team A stats
      if (!teamStats.has(match.teamA)) {
        teamStats.set(match.teamA, { played: 0, won: 0, totalRuns: 0 });
      }
      const teamAStats = teamStats.get(match.teamA)!;
      teamAStats.played++;
      const teamAScore = Number(match.teamAScore);
      if (!isNaN(teamAScore)) {
        teamAStats.totalRuns += teamAScore;
      }
      if (match.winner === match.teamA) teamAStats.won++;
      
      // Team B stats
      if (!teamStats.has(match.teamB)) {
        teamStats.set(match.teamB, { played: 0, won: 0, totalRuns: 0 });
      }
      const teamBStats = teamStats.get(match.teamB)!;
      teamBStats.played++;
      const teamBScore = Number(match.teamBScore);
      if (!isNaN(teamBScore)) {
        teamBStats.totalRuns += teamBScore;
      }
      if (match.winner === match.teamB) teamBStats.won++;
    });
    
    if (teamStats.size === 0) {
      throw new Error('No team statistics available');
    }

    // Most successful team
    const teamStatsArray = Array.from(teamStats.entries()).map(([team, stats]) => ({
      team,
      ...stats,
      winRate: stats.played > 0 ? (stats.won / stats.played) * 100 : 0,
      avgRuns: stats.played > 0 ? stats.totalRuns / stats.played : 0
    }));
    
    const mostSuccessfulTeam = teamStatsArray.reduce((max, curr) => 
      curr.winRate > max.winRate ? curr : max, 
      teamStatsArray[0]
    );
    
    const highestAvgTeam = teamStatsArray.reduce((max, curr) => 
      curr.avgRuns > max.avgRuns ? curr : max, 
      teamStatsArray[0]
    );

    // Prepare chart data - score trends over matches
    const scoreTrendsData = validMatches.map((match, idx) => ({
      match: `Match ${idx + 1}`,
      [match.teamA]: Number(match.teamAScore),
      [match.teamB]: Number(match.teamBScore)
    }));

    // Team performance chart data
    const teamPerformanceData = teamStatsArray.map(team => ({
      team: team.team,
      wins: team.won,
      avgRuns: Math.round(team.avgRuns)
    }));

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
            <p className="text-muted-foreground">
              {filterDate 
                ? `${totalMatches} match${totalMatches !== 1 ? 'es' : ''} on ${format(filterDate, 'PPP')}`
                : `Aggregated statistics from ${totalMatches} match${totalMatches !== 1 ? 'es' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !filterDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterDate ? format(filterDate, 'PPP') : <span>Filter by date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={filterDate}
                  onSelect={setFilterDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {filterDate && (
              <Button variant="ghost" size="icon" onClick={clearFilter} title="Clear filter">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {filterDate && (
          <Badge variant="secondary" className="text-sm">
            Showing matches from {format(filterDate, 'PPP')}
          </Badge>
        )}

        {validMatches.length < totalMatches && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Partial Data</AlertTitle>
            <AlertDescription>
              Some matches had incomplete data and were excluded from analytics. 
              Showing statistics for {validMatches.length} of {totalMatches} matches.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Total Matches */}
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Matches</CardDescription>
              <CardTitle className="text-4xl">{validMatches.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Trophy className="w-4 h-4" />
                Completed matches
              </div>
            </CardContent>
          </Card>

          {/* Highest Score */}
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardHeader className="pb-3">
              <CardDescription>Highest Team Total</CardDescription>
              <CardTitle className="text-4xl text-primary">{highestScore.score}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Target className="w-4 h-4" />
                {highestScore.team}
              </div>
            </CardContent>
          </Card>

          {/* Average Score */}
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Average Score</CardDescription>
              <CardTitle className="text-4xl">{averageScore.toFixed(0)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                Per innings
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Score Trends */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Score Trends</CardTitle>
              <CardDescription>Team scores across all matches</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={scoreTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="match" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {Array.from(teamStats.keys()).map((team, idx) => (
                    <Line 
                      key={team} 
                      type="monotone" 
                      dataKey={team} 
                      stroke={`hsl(${(idx * 137.5) % 360}, 70%, 50%)`}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Team Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Team Wins</CardTitle>
              <CardDescription>Total wins by team</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={teamPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="team" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="wins" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Average Runs */}
          <Card>
            <CardHeader>
              <CardTitle>Average Runs</CardTitle>
              <CardDescription>Average score per team</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={teamPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="team" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgRuns" fill="hsl(var(--secondary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Team Performance */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold tracking-tight">Team Performance</h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* Most Successful Team */}
            <Card className="bg-gradient-to-br from-yellow-500/5 to-transparent border-yellow-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Most Successful Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold">{mostSuccessfulTeam.team}</p>
                  <p className="text-sm text-muted-foreground">
                    {mostSuccessfulTeam.won} wins from {mostSuccessfulTeam.played} matches
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Win Rate</span>
                    <span className="font-medium">{mostSuccessfulTeam.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all" 
                      style={{ width: `${mostSuccessfulTeam.winRate}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Highest Average Team */}
            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Highest Average Runs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold">{highestAvgTeam.team}</p>
                  <p className="text-sm text-muted-foreground">
                    {highestAvgTeam.avgRuns.toFixed(0)} runs per match
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Runs</span>
                    <span className="font-medium">{highestAvgTeam.totalRuns}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Matches Played</span>
                    <span className="font-medium">{highestAvgTeam.played}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* All Teams Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Teams Statistics</CardTitle>
              <CardDescription>Complete performance breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Team</th>
                      <th className="text-center py-3 px-2 font-medium">Played</th>
                      <th className="text-center py-3 px-2 font-medium">Won</th>
                      <th className="text-center py-3 px-2 font-medium">Win %</th>
                      <th className="text-center py-3 px-2 font-medium">Avg Runs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamStatsArray.map((team, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-3 px-2 font-medium">{team.team}</td>
                        <td className="text-center py-3 px-2">{team.played}</td>
                        <td className="text-center py-3 px-2">{team.won}</td>
                        <td className="text-center py-3 px-2">{team.winRate.toFixed(1)}%</td>
                        <td className="text-center py-3 px-2">{team.avgRuns.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error calculating analytics:', error);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Processing Analytics</CardTitle>
            <CardDescription>
              There was an error processing the match data. Please try again or contact support if the issue persists.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
}
