import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import type { Database } from '../types/database';

type TacticRow = Database['public']['Tables']['tactics']['Row'];
type CompletionRow = Database['public']['Tables']['tactic_completions']['Row'];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeGoals: 0,
    currentWeek: 0,
    weeklyScore: '-',
    loading: true,
  });

  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
      try {
        // Load active goals count
        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (goalsError) throw goalsError;

        const goalCount = goalsData?.length || 0;
        const goalIds = (goalsData as { id: string }[])?.map((g) => g.id) || [];

        let programWeek = 0;
        let weeklyScore = '-';

        if (goalIds.length > 0) {
          // Load tactics for these goals
          const { data: tacticsData, error: tacticsError } = await supabase
            .from('tactics')
            .select('id, frequency_per_week')
            .in('goal_id', goalIds)
            .eq('is_active', true);

          if (tacticsError) throw tacticsError;

          const tacticsList = (tacticsData as TacticRow[]) || [];

          if (tacticsList.length > 0) {
            const tacticIds = tacticsList.map((t) => t.id);

            // Find the current program week by getting the max week_number from completions
            const { data: maxWeekData } = await supabase
              .from('tactic_completions')
              .select('week_number')
              .in('tactic_id', tacticIds)
              .eq('user_id', user.id)
              .order('week_number', { ascending: false })
              .limit(1);

            programWeek = maxWeekData && maxWeekData.length > 0 ? (maxWeekData[0] as any).week_number : 1;

            // Load completions for current program week
            const { data: completionsData, error: completionsError } = await supabase
              .from('tactic_completions')
              .select('*')
              .in('tactic_id', tacticIds)
              .eq('user_id', user.id)
              .eq('week_number', programWeek);

            if (completionsError) throw completionsError;

            const completions = (completionsData as CompletionRow[]) || [];
            const completionsMap = new Map<string, CompletionRow>();
            completions.forEach((c) => completionsMap.set(c.tactic_id, c));

            // Calculate weekly score
            let completedCount = 0;
            tacticsList.forEach((tactic) => {
              const completion = completionsMap.get(tactic.id);
              if (completion && completion.completion_count >= tactic.frequency_per_week) {
                completedCount++;
              }
            });

            const score = Math.round((completedCount / tacticsList.length) * 100);
            weeklyScore = `${score}%`;
          }
        }

        setStats({
          activeGoals: goalCount,
          currentWeek: programWeek,
          weeklyScore,
          loading: false,
        });
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    loadDashboardData();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.user_metadata?.name || 'there'}!
          </h1>
          <p className="mt-2 text-gray-600">
            Your 12 Week Year Dashboard
          </p>
        </div>

        {stats.loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="h-5 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                  <div className="h-9 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Active Goals
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.activeGoals}</dd>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Current Week
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  Week {stats.currentWeek}
                </dd>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Weekly Score
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.weeklyScore}</dd>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Getting Started
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Start building your 12 Week Year plan
              </p>
            </div>
            <ul className="divide-y divide-gray-200">
              <li className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <Link to="/visions" className="flex items-center justify-between">
                  <div className="text-sm font-medium text-blue-600">
                    1. Define your 10/3/1 year vision
                  </div>
                  <div className="text-sm text-gray-500">Start →</div>
                </Link>
              </li>
              <li className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <Link to="/goals" className="flex items-center justify-between">
                  <div className="text-sm font-medium text-blue-600">
                    2. Set your 12 week goals
                  </div>
                  <div className="text-sm text-gray-500">Start →</div>
                </Link>
              </li>
              <li className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <Link to="/tactics" className="flex items-center justify-between">
                  <div className="text-sm font-medium text-blue-600">
                    3. Define critical tactics
                  </div>
                  <div className="text-sm text-gray-500">Start →</div>
                </Link>
              </li>
              <li className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <Link to="/tracking" className="flex items-center justify-between">
                  <div className="text-sm font-medium text-blue-600">
                    4. Track your weekly progress
                  </div>
                  <div className="text-sm text-gray-500">Start →</div>
                </Link>
              </li>
              <li className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <Link to="/scorecard" className="flex items-center justify-between">
                  <div className="text-sm font-medium text-blue-600">
                    5. Review your scorecard
                  </div>
                  <div className="text-sm text-gray-500">Start →</div>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
