-- Blue Suite: 12 Week Year Goal Tracker
-- Initial Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  cohort TEXT DEFAULT 'Cohort 3',
  cohort_start_date DATE NOT NULL DEFAULT '2025-09-15',
  cohort_end_date DATE NOT NULL DEFAULT '2025-12-07',
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visions table
CREATE TABLE visions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  ten_year_vision TEXT,
  three_year_vision TEXT,
  one_year_vision TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Goals table
CREATE TABLE goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tactics table
CREATE TABLE tactics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  frequency_per_week INTEGER DEFAULT 1 CHECK (frequency_per_week >= 1 AND frequency_per_week <= 7),
  start_date DATE,
  end_date DATE,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tactic completions table
CREATE TABLE tactic_completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tactic_id UUID REFERENCES tactics(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 12),
  year INTEGER NOT NULL,
  completion_count INTEGER DEFAULT 0,
  completed_dates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tactic_id, week_number, year)
);

-- Weekly scorecards table
CREATE TABLE weekly_scorecards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 12),
  year INTEGER NOT NULL,
  goal_scores JSONB NOT NULL,
  overall_score NUMERIC(5,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_number, year)
);

-- Weekly plans table
CREATE TABLE weekly_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 12),
  year INTEGER NOT NULL,
  plan_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, goal_id, week_number, year)
);

-- WAM (Weekly Accountability Meeting) responses table
CREATE TABLE wam_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 12),
  year INTEGER NOT NULL,
  what_went_well TEXT,
  what_didnt_go_well TEXT,
  what_will_do_differently TEXT,
  what_support_needed TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_number, year)
);

-- Create indexes for better query performance
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_active ON goals(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_tactics_goal_id ON tactics(goal_id);
CREATE INDEX idx_tactics_active ON tactics(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_tactic_completions_user_week ON tactic_completions(user_id, week_number, year);
CREATE INDEX idx_weekly_scorecards_user_week ON weekly_scorecards(user_id, week_number, year);
CREATE INDEX idx_weekly_plans_user_week ON weekly_plans(user_id, week_number, year);
CREATE INDEX idx_wam_responses_user_week ON wam_responses(user_id, week_number, year);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE visions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactic_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE wam_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- RLS Policies for visions
CREATE POLICY "Users can view own vision" ON visions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vision" ON visions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vision" ON visions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for goals
CREATE POLICY "Users can view own goals" ON goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON goals
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for tactics
CREATE POLICY "Users can view own tactics" ON tactics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM goals WHERE goals.id = tactics.goal_id AND goals.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own tactics" ON tactics
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM goals WHERE goals.id = tactics.goal_id AND goals.user_id = auth.uid())
  );

CREATE POLICY "Users can update own tactics" ON tactics
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM goals WHERE goals.id = tactics.goal_id AND goals.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own tactics" ON tactics
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM goals WHERE goals.id = tactics.goal_id AND goals.user_id = auth.uid())
  );

-- RLS Policies for tactic_completions
CREATE POLICY "Users can view own completions" ON tactic_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions" ON tactic_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own completions" ON tactic_completions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions" ON tactic_completions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for weekly_scorecards
CREATE POLICY "Users can view own scorecards" ON weekly_scorecards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scorecards" ON weekly_scorecards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scorecards" ON weekly_scorecards
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for weekly_plans
CREATE POLICY "Users can view own plans" ON weekly_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans" ON weekly_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans" ON weekly_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans" ON weekly_plans
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for wam_responses
CREATE POLICY "Users can view own WAM responses" ON wam_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own WAM responses" ON wam_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own WAM responses" ON wam_responses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own WAM responses" ON wam_responses
  FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visions_updated_at BEFORE UPDATE ON visions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tactics_updated_at BEFORE UPDATE ON tactics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tactic_completions_updated_at BEFORE UPDATE ON tactic_completions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_plans_updated_at BEFORE UPDATE ON weekly_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wam_responses_updated_at BEFORE UPDATE ON wam_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
