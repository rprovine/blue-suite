import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import Header from '../components/layout/Header';

type GoalRow = Database['public']['Tables']['goals']['Row'];
type TacticRow = Database['public']['Tables']['tactics']['Row'];
type CompletionRow = Database['public']['Tables']['tactic_completions']['Row'];

interface WeekScore {
  week: number;
  year: number;
  score: number;
  totalTactics: number;
  completedTactics: number;
}

interface GoalScore {
  goal: GoalRow;
  averageScore: number;
  weekScores: WeekScore[];
}

export default function Scorecard() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [weekScores, setWeekScores] = useState<WeekScore[]>([]);
  const [goalScores, setGoalScores] = useState<GoalScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const loadScorecard = async () => {
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
          setLoading(false);
          return;
        }

        // Load tactics
        const goalIds = goalsList.map((g) => g.id);
        const { data: tacticsData, error: tacticsError } = await supabase
          .from('tactics')
          .select('*')
          .in('goal_id', goalIds)
          .eq('is_active', true);

        if (tacticsError) throw tacticsError;

        const tacticsList = (tacticsData as TacticRow[]) || [];

        if (tacticsList.length === 0) {
          setLoading(false);
          return;
        }

        // Load completions for last 12 weeks
        const tacticIds = tacticsList.map((t) => t.id);

        const { data: completionsData, error: completionsError } = await supabase
          .from('tactic_completions')
          .select('*')
          .in('tactic_id', tacticIds)
          .eq('user_id', user.id);

        if (completionsError) throw completionsError;

        const completions = (completionsData as CompletionRow[]) || [];

        // Calculate week scores
        const weekScoreMap = new Map<string, WeekScore>();
        const goalScoreMap = new Map<string, { scores: number[]; weeks: WeekScore[] }>();

        // Initialize goal score tracking
        goalsList.forEach((goal) => {
          goalScoreMap.set(goal.id, { scores: [], weeks: [] });
        });

        // Group completions by week
        completions.forEach((completion) => {
          const tactic = tacticsList.find((t) => t.id === completion.tactic_id);
          if (!tactic) return;

          const weekKey = `${completion.year}-W${completion.week_number}`;

          if (!weekScoreMap.has(weekKey)) {
            weekScoreMap.set(weekKey, {
              week: completion.week_number,
              year: completion.year,
              score: 0,
              totalTactics: 0,
              completedTactics: 0,
            });
          }

          const weekScore = weekScoreMap.get(weekKey)!;
          weekScore.totalTactics++;

          if (completion.completion_count >= tactic.frequency_per_week) {
            weekScore.completedTactics++;
          }

          weekScore.score = weekScore.totalTactics > 0
            ? Math.round((weekScore.completedTactics / weekScore.totalTactics) * 100)
            : 0;

          // Track by goal
          const goalData = goalScoreMap.get(tactic.goal_id);
          if (goalData) {
            goalData.scores.push(
              completion.completion_count >= tactic.frequency_per_week ? 100 : 0
            );
          }
        });

        // Convert to sorted array (most recent first)
        const weekScoresArray = Array.from(weekScoreMap.values())
          .sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.week - a.week;
          })
          .slice(0, 12); // Last 12 weeks

        setWeekScores(weekScoresArray);

        // Calculate goal scores
        const goalScoresArray = goalsList.map((goal) => {
          const goalData = goalScoreMap.get(goal.id);
          const averageScore = goalData && goalData.scores.length > 0
            ? Math.round(goalData.scores.reduce((a, b) => a + b, 0) / goalData.scores.length)
            : 0;

          return {
            goal,
            averageScore,
            weekScores: weekScoresArray.filter((ws) => {
              // Filter week scores that have this goal's tactics
              return completions.some((c) => {
                const tactic = tacticsList.find((t) => t.id === c.tactic_id);
                return tactic?.goal_id === goal.id && c.week_number === ws.week && c.year === ws.year;
              });
            }),
          };
        });

        setGoalScores(goalScoresArray);
      } catch (err) {
        console.error('Error loading scorecard:', err);
        setError('Failed to load scorecard data');
      } finally {
        setLoading(false);
      }
    };

    loadScorecard();
  }, [user]);

  // Calculate overall stats
  const averageScore = weekScores.length > 0
    ? Math.round(weekScores.reduce((sum, ws) => sum + ws.score, 0) / weekScores.length)
    : 0;

  const bestWeek = weekScores.length > 0
    ? weekScores.reduce((best, current) => (current.score > best.score ? current : best))
    : null;

  const currentStreak = (() => {
    let streak = 0;
    for (const ws of weekScores) {
      if (ws.score >= 85) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  })();

  const trend = (() => {
    if (weekScores.length < 2) return 'steady';
    const recent = weekScores.slice(0, 3).reduce((sum, ws) => sum + ws.score, 0) / Math.min(3, weekScores.length);
    const older = weekScores.slice(3, 6).reduce((sum, ws) => sum + ws.score, 0) / Math.max(1, weekScores.slice(3, 6).length);

    if (recent > older + 5) return 'improving';
    if (recent < older - 5) return 'declining';
    return 'steady';
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading scorecard...</p>
        </div>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow-sm rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Yet</h2>
            <p className="text-gray-600 mb-4">
              Start tracking your tactics to see your scorecard and progress analytics.
            </p>
            <a
              href="/tracking"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Tracking
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Scorecard</h1>
          <p className="mt-2 text-gray-600">
            Track your weekly performance and progress over time
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Overall Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Average Score</dt>
              <dd className="mt-1 text-3xl font-semibold text-blue-600">{averageScore}%</dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Best Week</dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">
                {bestWeek ? `${bestWeek.score}%` : '-'}
              </dd>
              {bestWeek && (
                <p className="text-xs text-gray-500 mt-1">
                  Week {bestWeek.week}, {bestWeek.year}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Current Streak</dt>
              <dd className="mt-1 text-3xl font-semibold text-orange-600">
                {currentStreak} {currentStreak === 1 ? 'week' : 'weeks'}
              </dd>
              <p className="text-xs text-gray-500 mt-1">≥85% score</p>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Trend</dt>
              <dd className="mt-1 flex items-center">
                {trend === 'improving' && (
                  <span className="text-2xl font-semibold text-green-600 flex items-center">
                    ↑ Improving
                  </span>
                )}
                {trend === 'declining' && (
                  <span className="text-2xl font-semibold text-red-600 flex items-center">
                    ↓ Declining
                  </span>
                )}
                {trend === 'steady' && (
                  <span className="text-2xl font-semibold text-gray-600 flex items-center">
                    → Steady
                  </span>
                )}
              </dd>
            </div>
          </div>
        </div>

        {/* Weekly Progress Chart */}
        {weekScores.length > 0 && (
          <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Weekly Progress</h2>
            <p className="text-sm text-gray-600 mb-6">Last {weekScores.length} weeks</p>

            <div className="space-y-3">
              {weekScores.map((ws) => (
                <div key={`${ws.year}-W${ws.week}`}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">
                      Week {ws.week}, {ws.year}
                    </span>
                    <span className="text-gray-600">
                      {ws.completedTactics}/{ws.totalTactics} tactics ({ws.score}%)
                    </span>
                  </div>
                  <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all flex items-center justify-end pr-2 ${
                        ws.score >= 85
                          ? 'bg-green-500'
                          : ws.score >= 70
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${ws.score}%` }}
                    >
                      {ws.score > 15 && (
                        <span className="text-white font-semibold text-xs">{ws.score}%</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goal-Specific Scores */}
        {goalScores.length > 0 && (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Performance by Goal</h2>

            <div className="space-y-6">
              {goalScores.map((gs) => (
                <div key={gs.goal.id} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">{gs.goal.title}</h3>
                    <span
                      className={`text-2xl font-bold ${
                        gs.averageScore >= 85
                          ? 'text-green-600'
                          : gs.averageScore >= 70
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {gs.averageScore}%
                    </span>
                  </div>

                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        gs.averageScore >= 85
                          ? 'bg-green-500'
                          : gs.averageScore >= 70
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${gs.averageScore}%` }}
                    />
                  </div>

                  {gs.goal.description && (
                    <p className="text-sm text-gray-600 mt-2">{gs.goal.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Insights & Recommendations</h3>
          <div className="space-y-2 text-sm text-blue-800">
            {averageScore >= 85 && (
              <p>
                <strong>Excellent work!</strong> You're consistently hitting your targets. Keep up the
                momentum!
              </p>
            )}
            {averageScore >= 70 && averageScore < 85 && (
              <p>
                <strong>Good progress!</strong> You're on track. Focus on consistency to reach the 85%
                target.
              </p>
            )}
            {averageScore < 70 && (
              <p>
                <strong>Room for improvement.</strong> Review your tactics and consider adjusting
                frequency or breaking them into smaller actions.
              </p>
            )}
            {trend === 'improving' && (
              <p>Your scores are trending upward - whatever you're doing is working!</p>
            )}
            {trend === 'declining' && (
              <p>
                Your recent scores are lower than before. Consider revisiting your tactics or adjusting
                your approach.
              </p>
            )}
            {currentStreak >= 3 && (
              <p>You've maintained strong performance for {currentStreak} weeks in a row!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
