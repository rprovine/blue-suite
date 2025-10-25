import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import Header from '../components/layout/Header';

type VisionRow = Database['public']['Tables']['visions']['Row'];

export default function Visions() {
  const { user } = useAuth();
  const [tenYear, setTenYear] = useState('');
  const [threeYear, setThreeYear] = useState('');
  const [oneYear, setOneYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState('');

  // Load existing visions
  useEffect(() => {
    if (!user) return;

    const loadVisions = async () => {
      try {
        const { data, error } = await supabase
          .from('visions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data) {
          const visionData = data as VisionRow;
          setTenYear(visionData.ten_year_vision ?? '');
          setThreeYear(visionData.three_year_vision ?? '');
          setOneYear(visionData.one_year_vision ?? '');
        }
      } catch (err) {
        console.error('Error loading visions:', err);
        setError('Failed to load visions');
      } finally {
        setLoading(false);
      }
    };

    loadVisions();
  }, [user]);

  // Auto-save function
  const saveVisions = async () => {
    if (!user) return;

    setSaving(true);
    setError('');

    try {
      const visionData: Database['public']['Tables']['visions']['Insert'] = {
        user_id: user.id,
        ten_year_vision: tenYear || null,
        three_year_vision: threeYear || null,
        one_year_vision: oneYear || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase
        .from('visions')
        .upsert as any)(visionData, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setLastSaved(new Date());
    } catch (err) {
      console.error('Error saving visions:', err);
      setError('Failed to save visions');
    } finally {
      setSaving(false);
    }
  };

  // Debounced auto-save
  useEffect(() => {
    if (loading) return;

    const timeoutId = setTimeout(() => {
      saveVisions();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [tenYear, threeYear, oneYear, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading your vision...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Vision</h1>
          <p className="mt-2 text-gray-600">
            Define your long-term vision to guide your 12 Week Year goals
          </p>
          <div className="mt-2 flex items-center text-sm">
            {saving ? (
              <span className="text-blue-600">Saving...</span>
            ) : lastSaved ? (
              <span className="text-green-600">
                Saved at {lastSaved.toLocaleTimeString()}
              </span>
            ) : null}
          </div>
          {error && (
            <div className="mt-2 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* 10 Year Vision */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                10 Year Vision
              </h2>
              <span className="text-sm text-gray-500">
                {tenYear.length} characters
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Where do you see yourself in 10 years? What does your ideal life look like?
            </p>
            <textarea
              value={tenYear}
              onChange={(e) => setTenYear(e.target.value)}
              placeholder="Describe your 10 year vision in detail..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* 3 Year Vision */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                3 Year Vision
              </h2>
              <span className="text-sm text-gray-500">
                {threeYear.length} characters
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              What milestones will you achieve in 3 years to move toward your 10 year vision?
            </p>
            <textarea
              value={threeYear}
              onChange={(e) => setThreeYear(e.target.value)}
              placeholder="Describe your 3 year vision in detail..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* 1 Year Vision */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                1 Year Vision
              </h2>
              <span className="text-sm text-gray-500">
                {oneYear.length} characters
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              What will you accomplish this year to progress toward your 3 year vision?
            </p>
            <textarea
              value={oneYear}
              onChange={(e) => setOneYear(e.target.value)}
              placeholder="Describe your 1 year vision in detail..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Your vision statements should be specific, inspiring, and written in present tense as if they've already happened. They guide your 12 week goals and daily actions.
          </p>
        </div>
      </div>
    </div>
  );
}
