import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { MatchResult, MatchAnalytics, Innings, TossInfo } from '../backend';

export function useStoreMatch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      teamA: string;
      teamB: string;
      overs: number;
      winner: string;
      turns: number;
      teamAScore: number;
      teamBScore: number;
      tossInfo: TossInfo;
      innings1: Innings;
      innings2: Innings;
      date: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.storeMatchOutcome(
        params.teamA,
        params.teamB,
        BigInt(params.overs),
        params.winner,
        BigInt(params.turns),
        BigInt(params.teamAScore),
        BigInt(params.teamBScore),
        params.tossInfo,
        params.innings1,
        params.innings2,
        params.date
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchHistory'] });
      queryClient.invalidateQueries({ queryKey: ['matchAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['dateFilteredMatches'] });
    },
  });
}

export function useMatchHistory() {
  const { actor, isFetching } = useActor();

  return useQuery<MatchResult[]>({
    queryKey: ['matchHistory'],
    queryFn: async () => {
      if (!actor) return [];
      const history = await actor.getMatchHistory();
      // Return in backend order (oldest first)
      return history;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMatchAnalytics(matchIndex: number) {
  const { actor, isFetching } = useActor();

  return useQuery<MatchAnalytics | null>({
    queryKey: ['matchAnalytics', matchIndex],
    queryFn: async () => {
      if (!actor) return null;

      try {
        // matchIndex is now the backend index directly
        const analytics = await actor.getMatchAnalytics(BigInt(matchIndex));
        return analytics;
      } catch (error) {
        console.error('Error fetching match analytics:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && matchIndex >= 0,
  });
}

export function useClearMatchHistory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.clearMatchHistory();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchHistory'] });
      queryClient.invalidateQueries({ queryKey: ['matchAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['dateFilteredMatches'] });
    },
  });
}

export function useGetDateFilteredMatches(date: string) {
  const { actor, isFetching } = useActor();

  return useQuery<MatchResult[]>({
    queryKey: ['dateFilteredMatches', date],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDateFilteredMatches(date);
    },
    enabled: !!actor && !isFetching && !!date,
  });
}

export function useGetDateFilteredAnalytics(date: string) {
  const { actor, isFetching } = useActor();

  return useQuery<MatchAnalytics | null>({
    queryKey: ['dateFilteredAnalytics', date],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDateFilteredAnalytics(date);
    },
    enabled: !!actor && !isFetching && !!date,
  });
}
