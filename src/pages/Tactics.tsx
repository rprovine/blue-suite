import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import Header from '../components/layout/Header';

type GoalRow = Database['public']['Tables']['goals']['Row'];
type TacticRow = Database['public']['Tables']['tactics']['Row'];
type TacticInsert = Database['public']['Tables']['tactics']['Insert'];

interface TacticWithGoal extends TacticRow {
  goal?: GoalRow;
}

export default function Tactics() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [tactics, setTactics] = useState<TacticWithGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingTacticId, setEditingTacticId] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [description, setDescription] = useState('');
  const [frequencyPerWeek, setFrequencyPerWeek] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Load goals and tactics
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
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

        // Load tactics for these goals
        if (goalsList.length > 0) {
          const goalIds = goalsList.map((g) => g.id);
          const { data: tacticsData, error: tacticsError } = await supabase
            .from('tactics')
            .select('*')
            .in('goal_id', goalIds)
            .eq('is_active', true)
            .order('order_index', { ascending: true });

          if (tacticsError) throw tacticsError;

          // Attach goal info to each tactic
          const tacticsWithGoals = (tacticsData as TacticRow[])?.map((tactic) => ({
            ...tactic,
            goal: goalsList.find((g) => g.id === tactic.goal_id),
          })) || [];

          setTactics(tacticsWithGoals);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const resetForm = () => {
    setSelectedGoalId('');
    setDescription('');
    setFrequencyPerWeek(1);
    setStartDate('');
    setEndDate('');
    setIsEditing(false);
    setEditingTacticId(null);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !description.trim() || !selectedGoalId) return;

    setSaving(true);
    setError('');

    try {
      if (editingTacticId) {
        // Update existing tactic
        const { error } = await (supabase
          .from('tactics')
          .update as any)(
          {
            goal_id: selectedGoalId,
            description: description.trim(),
            frequency_per_week: frequencyPerWeek,
            start_date: startDate || null,
            end_date: endDate || null,
            updated_at: new Date().toISOString(),
          },
          {
            eq: { id: editingTacticId },
          }
        );

        if (error) throw error;

        setTactics(
          tactics.map((t) =>
            t.id === editingTacticId
              ? {
                  ...t,
                  goal_id: selectedGoalId,
                  description: description.trim(),
                  frequency_per_week: frequencyPerWeek,
                  start_date: startDate || null,
                  end_date: endDate || null,
                  updated_at: new Date().toISOString(),
                  goal: goals.find((g) => g.id === selectedGoalId),
                }
              : t
          )
        );
      } else {
        // Create new tactic
        const goalTactics = tactics.filter((t) => t.goal_id === selectedGoalId);

        const newTactic: TacticInsert = {
          goal_id: selectedGoalId,
          description: description.trim(),
          frequency_per_week: frequencyPerWeek,
          start_date: startDate || null,
          end_date: endDate || null,
          order_index: goalTactics.length,
          is_active: true,
        };

        const { data, error } = await (supabase
          .from('tactics')
          .insert as any)(newTactic)
          .select()
          .single();

        if (error) throw error;

        const tacticWithGoal: TacticWithGoal = {
          ...(data as TacticRow),
          goal: goals.find((g) => g.id === selectedGoalId),
        };

        setTactics([...tactics, tacticWithGoal]);
      }

      resetForm();
    } catch (err) {
      console.error('Error saving tactic:', err);
      setError('Failed to save tactic');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tactic: TacticWithGoal) => {
    setIsEditing(true);
    setEditingTacticId(tactic.id);
    setSelectedGoalId(tactic.goal_id);
    setDescription(tactic.description);
    setFrequencyPerWeek(tactic.frequency_per_week);
    setStartDate(tactic.start_date || '');
    setEndDate(tactic.end_date || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (tacticId: string) => {
    if (!confirm('Are you sure you want to delete this tactic?')) return;

    try {
      const { error } = await (supabase
        .from('tactics')
        .update as any)({ is_active: false }, { eq: { id: tacticId } });

      if (error) throw error;

      setTactics(tactics.filter((t) => t.id !== tacticId));
    } catch (err) {
      console.error('Error deleting tactic:', err);
      setError('Failed to delete tactic');
    }
  };

  // Group tactics by goal
  const tacticsByGoal = goals.map((goal) => ({
    goal,
    tactics: tactics.filter((t) => t.goal_id === goal.id),
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading tactics...</p>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Goals Yet
            </h2>
            <p className="text-gray-600 mb-4">
              You need to create goals before you can add tactics.
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
          <h1 className="text-3xl font-bold text-gray-900">Tactics</h1>
          <p className="mt-2 text-gray-600">
            Define critical tactics to achieve your goals
          </p>
        </div>

        {/* Tactic Form */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {isEditing ? 'Edit Tactic' : 'Add New Tactic'}
          </h2>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="goalId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Goal *
              </label>
              <select
                id="goalId"
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a goal</option>
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Tactic Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Example: Call 5 prospective clients per day"
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <div>
              <label
                htmlFor="frequency"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Frequency per Week *
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="frequency"
                  type="number"
                  min="1"
                  max="7"
                  value={frequencyPerWeek}
                  onChange={(e) => setFrequencyPerWeek(parseInt(e.target.value))}
                  required
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-sm text-gray-600">
                  times per week (1-7)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || !description.trim() || !selectedGoalId}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? isEditing
                    ? 'Updating...'
                    : 'Adding...'
                  : isEditing
                  ? 'Update Tactic'
                  : 'Add Tactic'}
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tactics List grouped by Goal */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Tactics by Goal ({tactics.length})
          </h2>

          {tacticsByGoal.map(({ goal, tactics: goalTactics }) => (
            <div key={goal.id} className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {goal.title}
              </h3>

              {goalTactics.length === 0 ? (
                <p className="text-gray-500 text-sm">No tactics yet for this goal</p>
              ) : (
                <div className="space-y-3">
                  {goalTactics.map((tactic, index) => (
                    <div
                      key={tactic.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-semibold text-xs">
                              {index + 1}
                            </span>
                            <p className="text-gray-900">{tactic.description}</p>
                          </div>

                          <div className="ml-9 flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Frequency:</span>
                              <span className="inline-flex items-center gap-1">
                                {tactic.frequency_per_week}x/week
                                {/* Visual indicator */}
                                <span className="inline-flex gap-0.5">
                                  {Array.from({ length: 7 }).map((_, i) => (
                                    <span
                                      key={i}
                                      className={`w-1.5 h-3 rounded-sm ${
                                        i < tactic.frequency_per_week
                                          ? 'bg-blue-600'
                                          : 'bg-gray-200'
                                      }`}
                                    />
                                  ))}
                                </span>
                              </span>
                            </div>

                            {tactic.start_date && (
                              <div>
                                <span className="font-medium">Start:</span>{' '}
                                {new Date(tactic.start_date).toLocaleDateString()}
                              </div>
                            )}

                            {tactic.end_date && (
                              <div>
                                <span className="font-medium">End:</span>{' '}
                                {new Date(tactic.end_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(tactic)}
                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(tactic.id)}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Tactics are the specific actions you'll take each
            week to achieve your goals. Each tactic should be measurable and have a
            clear frequency (1-7 times per week).
          </p>
        </div>
      </div>
    </div>
  );
}
