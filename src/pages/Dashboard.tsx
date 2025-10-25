import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import type { Database } from '../types/database';

type TacticRow = Database['public']['Tables']['tactics']['Row'];
type CompletionRow = Database['public']['Tables']['tactic_completions']['Row'];

interface StepStatus {
  visions: 'not-started' | 'in-progress' | 'completed';
  goals: 'not-started' | 'in-progress' | 'completed';
  tactics: 'not-started' | 'in-progress' | 'completed';
  tracking: 'not-started' | 'in-progress' | 'completed';
  scorecard: 'not-started' | 'in-progress' | 'completed';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeGoals: 0,
    currentWeek: 0,
    weeklyScore: '-',
    loading: true,
  });
  const [stepStatus, setStepStatus] = useState<StepStatus>({
    visions: 'not-started',
    goals: 'not-started',
    tactics: 'not-started',
    tracking: 'not-started',
    scorecard: 'not-started',
  });

  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
      try {
        // Check visions
        const { data: visionsData } = await supabase
          .from('visions')
          .select('id, one_year_vision, three_year_vision, ten_year_vision')
          .eq('user_id', user.id)
          .maybeSingle();

        let visionsStatus: StepStatus['visions'] = 'not-started';
        if (visionsData) {
          const visions = visionsData as any;
          const hasContent =
            (visions.one_year_vision && visions.one_year_vision.length > 20) ||
            (visions.three_year_vision && visions.three_year_vision.length > 20) ||
            (visions.ten_year_vision && visions.ten_year_vision.length > 20);

          const allComplete =
            visions.one_year_vision && visions.one_year_vision.length > 50 &&
            visions.three_year_vision && visions.three_year_vision.length > 50 &&
            visions.ten_year_vision && visions.ten_year_vision.length > 50;

          visionsStatus = allComplete ? 'completed' : hasContent ? 'in-progress' : 'not-started';
        }

        // Load active goals count
        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (goalsError) throw goalsError;

        const goalCount = goalsData?.length || 0;
        const goalIds = (goalsData as { id: string }[])?.map((g) => g.id) || [];

        const goalsStatus: StepStatus['goals'] = goalCount === 0 ? 'not-started' :
                                                  goalCount >= 3 ? 'completed' : 'in-progress';

        let programWeek = 0;
        let weeklyScore = '-';
        let tacticsStatus: StepStatus['tactics'] = 'not-started';
        let trackingStatus: StepStatus['tracking'] = 'not-started';
        let scorecardStatus: StepStatus['scorecard'] = 'not-started';

        if (goalIds.length > 0) {
          // Load tactics for these goals
          const { data: tacticsData, error: tacticsError } = await supabase
            .from('tactics')
            .select('id, frequency_per_week')
            .in('goal_id', goalIds)
            .eq('is_active', true);

          if (tacticsError) throw tacticsError;

          const tacticsList = (tacticsData as TacticRow[]) || [];
          const tacticsCount = tacticsList.length;

          tacticsStatus = tacticsCount === 0 ? 'not-started' :
                         tacticsCount >= goalCount * 2 ? 'completed' : 'in-progress';

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

            // Check if tracking has been done
            const { data: allCompletions } = await supabase
              .from('tactic_completions')
              .select('id')
              .in('tactic_id', tacticIds)
              .eq('user_id', user.id);

            trackingStatus = !allCompletions || allCompletions.length === 0 ? 'not-started' : 'in-progress';
            scorecardStatus = trackingStatus === 'in-progress' ? 'in-progress' : 'not-started';

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

        setStepStatus({
          visions: visionsStatus,
          goals: goalsStatus,
          tactics: tacticsStatus,
          tracking: trackingStatus,
          scorecard: scorecardStatus,
        });
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    loadDashboardData();
  }, [user]);

  const getStatusBadge = (status: StepStatus[keyof StepStatus]) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Completed
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            In Progress
          </span>
        );
      case 'not-started':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-gray-200 text-gray-700 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Not Started
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Welcome back, {user?.user_metadata?.name || 'there'}!
          </h1>
          <p className="mt-3 text-lg text-gray-600">
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
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 overflow-hidden shadow-lg rounded-xl transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
              <div className="px-6 py-7 sm:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <dt className="text-sm font-medium text-blue-100 uppercase tracking-wide">
                      Active Goals
                    </dt>
                    <dd className="mt-2 text-4xl font-bold text-white">{stats.activeGoals}</dd>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 overflow-hidden shadow-lg rounded-xl transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
              <div className="px-6 py-7 sm:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <dt className="text-sm font-medium text-indigo-100 uppercase tracking-wide">
                      Current Week
                    </dt>
                    <dd className="mt-2 text-4xl font-bold text-white">
                      Week {stats.currentWeek}
                    </dd>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-emerald-700 overflow-hidden shadow-lg rounded-xl transform transition-all duration-200 hover:scale-105 hover:shadow-xl">
              <div className="px-6 py-7 sm:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <dt className="text-sm font-medium text-green-100 uppercase tracking-wide">
                      Weekly Score
                    </dt>
                    <dd className="mt-2 text-4xl font-bold text-white">{stats.weeklyScore}</dd>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10">
          <div className="bg-white shadow-xl overflow-hidden rounded-2xl border border-gray-100">
            <div className="px-6 py-6 sm:px-8 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-2xl leading-7 font-bold text-gray-900">
                Getting Started
              </h3>
              <p className="mt-2 text-base text-gray-600">
                Build your 12 Week Year plan step by step
              </p>
            </div>
            <ul className="divide-y divide-gray-100">
              <li className="px-6 py-5 sm:px-8 hover:bg-blue-50/50 transition-all duration-200">
                <Link to="/visions" className="flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      1
                    </div>
                    <div className="text-base font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                      Define your 10/3/1 year vision
                    </div>
                  </div>
                  {getStatusBadge(stepStatus.visions)}
                </Link>
              </li>
              <li className="px-6 py-5 sm:px-8 hover:bg-blue-50/50 transition-all duration-200">
                <Link to="/goals" className="flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      2
                    </div>
                    <div className="text-base font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                      Set your 12 week goals
                    </div>
                  </div>
                  {getStatusBadge(stepStatus.goals)}
                </Link>
              </li>
              <li className="px-6 py-5 sm:px-8 hover:bg-blue-50/50 transition-all duration-200">
                <Link to="/tactics" className="flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      3
                    </div>
                    <div className="text-base font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                      Define critical tactics
                    </div>
                  </div>
                  {getStatusBadge(stepStatus.tactics)}
                </Link>
              </li>
              <li className="px-6 py-5 sm:px-8 hover:bg-blue-50/50 transition-all duration-200">
                <Link to="/tracking" className="flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      4
                    </div>
                    <div className="text-base font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                      Track your weekly progress
                    </div>
                  </div>
                  {getStatusBadge(stepStatus.tracking)}
                </Link>
              </li>
              <li className="px-6 py-5 sm:px-8 hover:bg-blue-50/50 transition-all duration-200">
                <Link to="/scorecard" className="flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      5
                    </div>
                    <div className="text-base font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                      Review your scorecard
                    </div>
                  </div>
                  {getStatusBadge(stepStatus.scorecard)}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
