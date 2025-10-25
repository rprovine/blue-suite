import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import Header from '../components/layout/Header';

type GoalRow = Database['public']['Tables']['goals']['Row'];
type GoalInsert = Database['public']['Tables']['goals']['Insert'];

export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Load goals
  useEffect(() => {
    if (!user) return;

    const loadGoals = async () => {
      try {
        const { data, error } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (error) throw error;

        setGoals((data as GoalRow[]) || []);
      } catch (err) {
        console.error('Error loading goals:', err);
        setError('Failed to load goals');
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, [user]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setIsEditing(false);
    setEditingGoalId(null);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setSaving(true);
    setError('');

    try {
      if (editingGoalId) {
        // Update existing goal
        const { error } = await (supabase
          .from('goals')
          .update as any)({
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
          updated_at: new Date().toISOString(),
        }, {
          eq: { id: editingGoalId },
        });

        if (error) throw error;

        setGoals(
          goals.map((g) =>
            g.id === editingGoalId
              ? {
                  ...g,
                  title: title.trim(),
                  description: description.trim() || null,
                  due_date: dueDate || null,
                  updated_at: new Date().toISOString(),
                }
              : g
          )
        );
      } else {
        // Create new goal
        const newGoal: GoalInsert = {
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
          order_index: goals.length,
          is_active: true,
        };

        const { data, error } = await (supabase
          .from('goals')
          .insert as any)(newGoal)
          .select()
          .single();

        if (error) throw error;

        setGoals([...goals, data as GoalRow]);
      }

      resetForm();
    } catch (err) {
      console.error('Error saving goal:', err);
      setError('Failed to save goal');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (goal: GoalRow) => {
    setIsEditing(true);
    setEditingGoalId(goal.id);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setDueDate(goal.due_date || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const { error } = await (supabase
        .from('goals')
        .update as any)({ is_active: false }, { eq: { id: goalId } });

      if (error) throw error;

      setGoals(goals.filter((g) => g.id !== goalId));
    } catch (err) {
      console.error('Error deleting goal:', err);
      setError('Failed to delete goal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading your goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your 12 Week Goals</h1>
          <p className="mt-2 text-gray-600">
            Define 1-3 goals for your current 12 week period
          </p>
        </div>

        {/* Goal Form */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {isEditing ? 'Edit Goal' : 'Add New Goal'}
          </h2>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Goal Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Example: Increase revenue by 25%"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about this goal..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            <div>
              <label
                htmlFor="dueDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Due Date
              </label>
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? isEditing
                    ? 'Updating...'
                    : 'Adding...'
                  : isEditing
                  ? 'Update Goal'
                  : 'Add Goal'}
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

        {/* Goals List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Active Goals ({goals.length})
          </h2>

          {goals.length === 0 ? (
            <div className="bg-white shadow-sm rounded-lg p-8 text-center">
              <p className="text-gray-600">
                No goals yet. Add your first goal above to get started!
              </p>
            </div>
          ) : (
            goals.map((goal, index) => (
              <div
                key={goal.id}
                className="bg-white shadow-sm rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                        {index + 1}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {goal.title}
                      </h3>
                    </div>

                    {goal.description && (
                      <p className="text-gray-600 ml-11 mb-2">{goal.description}</p>
                    )}

                    {goal.due_date && (
                      <p className="text-sm text-gray-500 ml-11">
                        Due:{' '}
                        {new Date(goal.due_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Focus on 1-3 clear, measurable goals for your 12 week
            period. Each goal should support your long-term vision and have specific
            tactics to achieve it.
          </p>
        </div>
      </div>
    </div>
  );
}
