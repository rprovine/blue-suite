import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import Header from '../components/layout/Header';

type GoalRow = Database['public']['Tables']['goals']['Row'];
type WeeklyPlanRow = Database['public']['Tables']['weekly_plans']['Row'];
type WeeklyPlanInsert = Database['public']['Tables']['weekly_plans']['Insert'];

interface GoalWithPlan extends GoalRow {
  plan?: WeeklyPlanRow;
  planText: string;
  saving: boolean;
}

// Get ISO week number
function getWeekNumber(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week: weekNo, year: d.getUTCFullYear() };
}

export default function WeeklyPlans() {
  const { user } = useAuth();
  const [currentWeek] = useState(() => getWeekNumber(new Date()));
  const [goals, setGoals] = useState<GoalWithPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveTimers, setSaveTimers] = useState<{ [key: string]: ReturnType<typeof setTimeout> }>({});

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        // Load active goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (goalsError) throw goalsError;

        const goalsList = (goalsData as GoalRow[]) || [];

        if (goalsList.length === 0) {
          setGoals([]);
          setLoading(false);
          return;
        }

        // Load existing weekly plans for current week
        const goalIds = goalsList.map((g) => g.id);
        const { data: plansData, error: plansError } = await supabase
          .from('weekly_plans')
          .select('*')
          .in('goal_id', goalIds)
          .eq('user_id', user.id)
          .eq('week_number', currentWeek.week)
          .eq('year', currentWeek.year);

        if (plansError) throw plansError;

        const plansMap = new Map<string, WeeklyPlanRow>();
        (plansData as WeeklyPlanRow[])?.forEach((plan) => {
          plansMap.set(plan.goal_id, plan);
        });

        // Combine goals with their plans
        const goalsWithPlans: GoalWithPlan[] = goalsList.map((goal) => {
          const existingPlan = plansMap.get(goal.id);
          return {
            ...goal,
            plan: existingPlan,
            planText: existingPlan?.plan_text || '',
            saving: false,
          };
        });

        setGoals(goalsWithPlans);
      } catch (err) {
        console.error('Error loading weekly plans:', err);
        setError('Failed to load weekly plans data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, currentWeek]);

  const savePlan = useCallback(
    async (goalId: string, planText: string) => {
      if (!user) return;

      try {
        const goal = goals.find((g) => g.id === goalId);
        if (!goal) return;

        // Set saving state
        setGoals((prev) =>
          prev.map((g) => (g.id === goalId ? { ...g, saving: true } : g))
        );

        if (goal.plan) {
          // Update existing plan
          const { error } = await (supabase
            .from('weekly_plans')
            .update as any)(
            {
              plan_text: planText,
              updated_at: new Date().toISOString(),
            },
            {
              eq: { id: goal.plan.id },
            }
          );

          if (error) throw error;
        } else {
          // Create new plan
          const newPlan: WeeklyPlanInsert = {
            user_id: user.id,
            goal_id: goalId,
            week_number: currentWeek.week,
            year: currentWeek.year,
            plan_text: planText,
          };

          const { data, error } = await (supabase
            .from('weekly_plans')
            .insert as any)(newPlan)
            .select()
            .single();

          if (error) throw error;

          // Update local state with new plan
          setGoals((prev) =>
            prev.map((g) =>
              g.id === goalId
                ? { ...g, plan: data as WeeklyPlanRow, saving: false }
                : g
            )
          );
          return;
        }

        // Clear saving state
        setGoals((prev) =>
          prev.map((g) => (g.id === goalId ? { ...g, saving: false } : g))
        );
      } catch (err) {
        console.error('Error saving plan:', err);
        setError('Failed to save plan');
        setGoals((prev) =>
          prev.map((g) => (g.id === goalId ? { ...g, saving: false } : g))
        );
      }
    },
    [user, goals, currentWeek]
  );

  const handlePlanChange = (goalId: string, value: string) => {
    // Update local state immediately
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, planText: value } : g))
    );

    // Clear existing timer for this goal
    if (saveTimers[goalId]) {
      clearTimeout(saveTimers[goalId]);
    }

    // Set new timer to auto-save after 1 second
    const timer = setTimeout(() => {
      savePlan(goalId, value);
    }, 1000);

    setSaveTimers((prev) => ({ ...prev, [goalId]: timer }));
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimers).forEach((timer) => clearTimeout(timer));
    };
  }, [saveTimers]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading weekly plans...</p>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Goals Yet</h2>
            <p className="text-gray-600 mb-4">
              You need to create goals before you can plan your week.
            </p>
            <a
              href="/goals"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Goals
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Weekly Plans</h1>
          <p className="mt-2 text-gray-600">
            Week {currentWeek.week}, {currentWeek.year} - Define your weekly plans for each goal
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="space-y-6">
            {goals.map((goal) => (
              <div key={goal.id} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                    )}
                  </div>
                  {goal.saving && (
                    <span className="text-xs text-blue-600 ml-4">Saving...</span>
                  )}
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What will you do this week to achieve this goal?
                  </label>
                  <textarea
                    value={goal.planText}
                    onChange={(e) => handlePlanChange(goal.id, e.target.value)}
                    placeholder="Enter your weekly plan for this goal..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {goal.planText.length} characters (auto-saves)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Set specific, actionable plans for each goal this week. Review
            your tactics and determine what concrete steps you'll take to make progress.
          </p>
        </div>
      </div>
    </div>
  );
}
