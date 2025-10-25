import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import Header from '../components/layout/Header';

type GoalRow = Database['public']['Tables']['goals']['Row'];
type TacticRow = Database['public']['Tables']['tactics']['Row'];
type CompletionRow = Database['public']['Tables']['tactic_completions']['Row'];
type CompletionInsert = Database['public']['Tables']['tactic_completions']['Insert'];

interface TacticWithCompletion extends TacticRow {
  goal?: GoalRow;
  completion?: CompletionRow;
}

export default function WeeklyTracking() {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [maxWeek, setMaxWeek] = useState<number>(1);
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [tactics, setTactics] = useState<TacticWithCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Load data for current week
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        // Load goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (goalsError) throw goalsError;

        const goalsList = (goalsData as GoalRow[]) || [];
        setGoals(goalsList);

        if (goalsList.length === 0) {
          setTactics([]);
          setLoading(false);
          return;
        }

        // Load tactics for these goals
        const goalIds = goalsList.map((g) => g.id);
        const { data: tacticsData, error: tacticsError } = await supabase
          .from('tactics')
          .select('*')
          .in('goal_id', goalIds)
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (tacticsError) throw tacticsError;

        const tacticsList = (tacticsData as TacticRow[]) || [];

        if (tacticsList.length === 0) {
          setTactics([]);
          setLoading(false);
          return;
        }

        const tacticIds = tacticsList.map((t) => t.id);

        // Find max program week if currentWeek is still 1 (initial load)
        if (currentWeek === 1 && maxWeek === 1) {
          const { data: maxWeekData } = await supabase
            .from('tactic_completions')
            .select('week_number')
            .in('tactic_id', tacticIds)
            .eq('user_id', user.id)
            .order('week_number', { ascending: false })
            .limit(1);

          const programWeek = maxWeekData && maxWeekData.length > 0 ? (maxWeekData[0] as any).week_number : 1;
          setCurrentWeek(programWeek);
          setMaxWeek(programWeek);
        }

        // Load completions for current week
        const { data: completionsData, error: completionsError } = await supabase
          .from('tactic_completions')
          .select('*')
          .in('tactic_id', tacticIds)
          .eq('user_id', user.id)
          .eq('week_number', currentWeek);

        if (completionsError) throw completionsError;

        const completionsMap = new Map<string, CompletionRow>();
        (completionsData as CompletionRow[])?.forEach((c) => {
          completionsMap.set(c.tactic_id, c);
        });

        // Combine tactics with their goals and completions
        const tacticsWithData = tacticsList.map((tactic) => ({
          ...tactic,
          goal: goalsList.find((g) => g.id === tactic.goal_id),
          completion: completionsMap.get(tactic.id),
        }));

        setTactics(tacticsWithData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load tracking data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, currentWeek]);

  const handleMarkCompletion = async (tactic: TacticWithCompletion, increment: boolean) => {
    if (!user || updating) return;

    setUpdating(tactic.id);
    setError('');

    try {
      const currentCount = tactic.completion?.completion_count || 0;
      const newCount = increment
        ? Math.min(currentCount + 1, tactic.frequency_per_week)
        : Math.max(currentCount - 1, 0);

      if (tactic.completion) {
        // Update existing completion
        const { error } = await (supabase
          .from('tactic_completions')
          .update as any)(
          {
            completion_count: newCount,
            updated_at: new Date().toISOString(),
          },
          {
            eq: { id: tactic.completion.id },
          }
        );

        if (error) throw error;

        setTactics(
          tactics.map((t) =>
            t.id === tactic.id
              ? {
                  ...t,
                  completion: {
                    ...t.completion!,
                    completion_count: newCount,
                    updated_at: new Date().toISOString(),
                  },
                }
              : t
          )
        );
      } else {
        // Create new completion
        const newCompletion: CompletionInsert = {
          tactic_id: tactic.id,
          user_id: user.id,
          week_number: currentWeek,
          year: new Date().getFullYear(),
          completion_count: newCount,
          completed_dates: [],
        };

        const { data, error } = await (supabase
          .from('tactic_completions')
          .insert as any)(newCompletion)
          .select()
          .single();

        if (error) throw error;

        setTactics(
          tactics.map((t) =>
            t.id === tactic.id
              ? {
                  ...t,
                  completion: data as CompletionRow,
                }
              : t
          )
        );
      }
    } catch (err) {
      console.error('Error updating completion:', err);
      setError('Failed to update completion');
    } finally {
      setUpdating(null);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentWeek(Math.max(1, currentWeek - 1));
    } else {
      setCurrentWeek(Math.min(12, currentWeek + 1));
    }
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(maxWeek);
  };

  // Group tactics by goal
  const tacticsByGoal = goals.map((goal) => ({
    goal,
    tactics: tactics.filter((t) => t.goal_id === goal.id),
  }));

  // Calculate overall week score
  const totalTactics = tactics.length;
  const completedTactics = tactics.filter(
    (t) => (t.completion?.completion_count || 0) >= t.frequency_per_week
  ).length;
  const weekScore = totalTactics > 0 ? Math.round((completedTactics / totalTactics) * 100) : 0;

  const isCurrentWeek = currentWeek === maxWeek;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  if (tactics.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow-sm rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Tactics Yet</h2>
            <p className="text-gray-600 mb-4">
              You need to create tactics before you can track weekly progress.
            </p>
            <a
              href="/tactics"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Tactics
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Week Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Weekly Tracking</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateWeek('prev')}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
              >
                ← Previous
              </button>
              {!isCurrentWeek && (
                <button
                  onClick={goToCurrentWeek}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Current Week
                </button>
              )}
              <button
                onClick={() => navigateWeek('next')}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
              >
                Next →
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg text-gray-700">
                Week {currentWeek} of 12
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{weekScore}%</p>
              <p className="text-sm text-gray-600">
                {completedTactics} / {totalTactics} tactics on track
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Tactics by Goal */}
        <div className="space-y-6">
          {tacticsByGoal.map(({ goal, tactics: goalTactics }) =>
            goalTactics.length > 0 ? (
              <div key={goal.id} className="bg-white shadow-sm rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{goal.title}</h3>

                <div className="space-y-4">
                  {goalTactics.map((tactic) => {
                    const completionCount = tactic.completion?.completion_count || 0;
                    const target = tactic.frequency_per_week;
                    const percentage = Math.round((completionCount / target) * 100);
                    const isComplete = completionCount >= target;

                    return (
                      <div
                        key={tactic.id}
                        className={`border rounded-lg p-4 ${
                          isComplete ? 'border-green-300 bg-green-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="text-gray-900 font-medium mb-1">{tactic.description}</p>
                            <p className="text-sm text-gray-600">
                              Target: {target}x per week
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p
                              className={`text-2xl font-bold ${
                                isComplete ? 'text-green-600' : 'text-gray-900'
                              }`}
                            >
                              {completionCount}/{target}
                            </p>
                            <p className="text-xs text-gray-500">{percentage}%</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                isComplete ? 'bg-green-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* X Markers */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: target }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-8 h-8 rounded border-2 flex items-center justify-center text-sm font-bold ${
                                  i < completionCount
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : 'border-gray-300 bg-white text-gray-400'
                                }`}
                              >
                                {i < completionCount ? 'X' : ''}
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleMarkCompletion(tactic, false)}
                              disabled={completionCount === 0 || updating === tactic.id}
                              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                              −
                            </button>
                            <button
                              onClick={() => handleMarkCompletion(tactic, true)}
                              disabled={completionCount >= target || updating === tactic.id}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                              + Mark
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null
          )}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Mark your tactics as you complete them each week. Aim for 85% or
            higher to stay on track with your 12 week goals!
          </p>
        </div>
      </div>
    </div>
  );
}
