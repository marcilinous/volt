-- Clash Dating App: Supabase PostgreSQL Schema
-- Run in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE user_intent AS ENUM ('casual', 'serious', 'open');
CREATE TYPE user_type AS ENUM ('student', 'early_career', 'professional');
CREATE TYPE gender_type AS ENUM ('M', 'F', 'O');

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender gender_type NOT NULL,
    user_category user_type NOT NULL,
    birth_city VARCHAR(100) NOT NULL,
    current_city VARCHAR(100) NOT NULL,
    current_location GEOMETRY(Point, 4326),
    religion VARCHAR(50),
    languages TEXT[] NOT NULL,
    monthly_income_bracket VARCHAR(50),
    profession VARCHAR(100),
    bio TEXT,
    photos_urls TEXT[] CHECK (cardinality(photos_urls) <= 6),
    intent user_intent NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compute age via a view (PostgreSQL rejects AGE() in generated columns)
CREATE OR REPLACE VIEW profiles_with_age AS
SELECT *, EXTRACT(YEAR FROM AGE(date_of_birth))::INT AS age FROM profiles;

CREATE TABLE ai_prompt_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    question_id INT CHECK (question_id BETWEEN 1 AND 3),
    question_text TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    UNIQUE(user_id, question_id)
);

CREATE TABLE user_monetization_ledger (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    token_balance INT DEFAULT 0 CHECK (token_balance >= 0),
    premium_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user_b UUID REFERENCES profiles(id) ON DELETE CASCADE,
    match_type VARCHAR(10) CHECK (match_type IN ('clash', 'spark', 'normal')),
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_a, user_b)
);

CREATE TABLE swipe_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    target_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    action VARCHAR(10) CHECK (action IN ('like', 'pass', 'super_like')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, target_id)
);

CREATE TABLE daily_clashes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    target_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    answers JSONB DEFAULT '[]'::JSONB,
    completed BOOLEAN DEFAULT FALSE,
    clash_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, clash_date)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_monetization_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Own profile update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Own ledger" ON user_monetization_ledger FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Match messages read" ON messages FOR SELECT USING (
    match_id IN (SELECT id FROM matches WHERE user_a = auth.uid() OR user_b = auth.uid())
);
CREATE POLICY "Match messages send" ON messages FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    match_id IN (SELECT id FROM matches WHERE user_a = auth.uid() OR user_b = auth.uid())
);

-- Indexes
CREATE INDEX idx_profiles_location ON profiles USING GIST(current_location);
CREATE INDEX idx_profiles_city ON profiles(current_city);
CREATE INDEX idx_messages_match ON messages(match_id, created_at);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Distance helper
CREATE OR REPLACE FUNCTION get_nearby_profiles(
    user_lat DOUBLE PRECISION, user_lng DOUBLE PRECISION, radius_km INTEGER DEFAULT 50
) RETURNS TABLE (profile_id UUID, display_name VARCHAR, distance_km DOUBLE PRECISION)
LANGUAGE SQL AS $$
    SELECT p.id, p.display_name,
        ST_Distance(p.current_location::geography, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography) / 1000
    FROM profiles p
    WHERE p.current_location IS NOT NULL
      AND ST_DWithin(p.current_location::geography, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography, radius_km * 1000)
    ORDER BY 3;
$$;
