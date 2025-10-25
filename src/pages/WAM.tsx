import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import Header from '../components/layout/Header';

type WAMRow = Database['public']['Tables']['wam_responses']['Row'];
type WAMInsert = Database['public']['Tables']['wam_responses']['Insert'];

// Get ISO week number
function getWeekNumber(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week: weekNo, year: d.getUTCFullYear() };
}

export default function WAM() {
  const { user } = useAuth();
  const [currentWeek] = useState(() => getWeekNumber(new Date()));
  const [wamData, setWamData] = useState({
    whatWentWell: '',
    whatDidntGoWell: '',
    whatWillDoDifferently: '',
    whatSupportNeeded: '',
  });
  const [existingWAM, setExistingWAM] = useState<WAMRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveTimers, setSaveTimers] = useState<{ [key: string]: ReturnType<typeof setTimeout> }>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadWAM = async () => {
      setLoading(true);
      setError('');

      try {
        // Load existing WAM response for current week
        const { data, error: wamError } = await supabase
          .from('wam_responses')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_number', currentWeek.week)
          .eq('year', currentWeek.year)
          .maybeSingle();

        if (wamError) throw wamError;

        if (data) {
          const wamResponse = data as WAMRow;
          setExistingWAM(wamResponse);
          setWamData({
            whatWentWell: wamResponse.what_went_well || '',
            whatDidntGoWell: wamResponse.what_didnt_go_well || '',
            whatWillDoDifferently: wamResponse.what_will_do_differently || '',
            whatSupportNeeded: wamResponse.what_support_needed || '',
          });
        }
      } catch (err) {
        console.error('Error loading WAM:', err);
        setError('Failed to load weekly accountability meeting data');
      } finally {
        setLoading(false);
      }
    };

    loadWAM();
  }, [user, currentWeek]);

  const saveWAM = useCallback(
    async (data: typeof wamData) => {
      if (!user) return;

      setSaving(true);
      setError('');

      try {
        if (existingWAM) {
          // Update existing WAM
          const { error } = await (supabase
            .from('wam_responses')
            .update as any)(
            {
              what_went_well: data.whatWentWell,
              what_didnt_go_well: data.whatDidntGoWell,
              what_will_do_differently: data.whatWillDoDifferently,
              what_support_needed: data.whatSupportNeeded,
              updated_at: new Date().toISOString(),
            },
            {
              eq: { id: existingWAM.id },
            }
          );

          if (error) throw error;
        } else {
          // Create new WAM
          const newWAM: WAMInsert = {
            user_id: user.id,
            week_number: currentWeek.week,
            year: currentWeek.year,
            what_went_well: data.whatWentWell,
            what_didnt_go_well: data.whatDidntGoWell,
            what_will_do_differently: data.whatWillDoDifferently,
            what_support_needed: data.whatSupportNeeded,
          };

          const { data: createdData, error } = await (supabase
            .from('wam_responses')
            .insert as any)(newWAM)
            .select()
            .single();

          if (error) throw error;

          setExistingWAM(createdData as WAMRow);
        }

        setLastSaved(new Date());
      } catch (err) {
        console.error('Error saving WAM:', err);
        setError('Failed to save WAM response');
      } finally {
        setSaving(false);
      }
    },
    [user, existingWAM, currentWeek]
  );

  const handleFieldChange = (field: keyof typeof wamData, value: string) => {
    const newData = { ...wamData, [field]: value };
    setWamData(newData);

    // Clear existing timer for this field
    if (saveTimers[field]) {
      clearTimeout(saveTimers[field]);
    }

    // Set new timer to auto-save after 1 second
    const timer = setTimeout(() => {
      saveWAM(newData);
    }, 1000);

    setSaveTimers((prev) => ({ ...prev, [field]: timer }));
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
          <p className="mt-2 text-sm text-gray-600">Loading WAM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Weekly Accountability Meeting
          </h1>
          <p className="mt-2 text-gray-600">
            Week {currentWeek.week}, {currentWeek.year} - Reflect on your progress and learnings
          </p>
          {lastSaved && (
            <p className="mt-1 text-sm text-gray-500">
              Last saved at {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="space-y-6">
            {/* Question 1: What Went Well */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-base font-semibold text-gray-900">
                  1. What went well this week?
                </label>
                {saving && <span className="text-xs text-blue-600">Saving...</span>}
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Celebrate your wins and successes, no matter how small.
              </p>
              <textarea
                value={wamData.whatWentWell}
                onChange={(e) => handleFieldChange('whatWentWell', e.target.value)}
                placeholder="What are you proud of this week? What did you accomplish?"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                {wamData.whatWentWell.length} characters
              </p>
            </div>

            {/* Question 2: What Didn't Go Well */}
            <div>
              <label className="block text-base font-semibold text-gray-900 mb-2">
                2. What didn't go well this week?
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Be honest about challenges and setbacks you encountered.
              </p>
              <textarea
                value={wamData.whatDidntGoWell}
                onChange={(e) => handleFieldChange('whatDidntGoWell', e.target.value)}
                placeholder="What obstacles did you face? What goals did you miss?"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                {wamData.whatDidntGoWell.length} characters
              </p>
            </div>

            {/* Question 3: What Will Do Differently */}
            <div>
              <label className="block text-base font-semibold text-gray-900 mb-2">
                3. What will you do differently next week?
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Commit to specific changes based on what you learned.
              </p>
              <textarea
                value={wamData.whatWillDoDifferently}
                onChange={(e) => handleFieldChange('whatWillDoDifferently', e.target.value)}
                placeholder="What adjustments will you make? What new approach will you try?"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                {wamData.whatWillDoDifferently.length} characters
              </p>
            </div>

            {/* Question 4: What Support Needed */}
            <div>
              <label className="block text-base font-semibold text-gray-900 mb-2">
                4. What support do you need?
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Identify resources, help, or accountability you need to succeed.
              </p>
              <textarea
                value={wamData.whatSupportNeeded}
                onChange={(e) => handleFieldChange('whatSupportNeeded', e.target.value)}
                placeholder="What help do you need? What resources would be helpful?"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                {wamData.whatSupportNeeded.length} characters
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> The Weekly Accountability Meeting is a critical component of the
            12 Week Year. Be honest with yourself - this reflection helps you learn and improve
            each week. Your responses are automatically saved as you type.
          </p>
        </div>
      </div>
    </div>
  );
}
