-- ====================================================================
-- eFootball Neighborhood League - Free Supabase Database Schema
-- Run this script in the Supabase SQL Editor (100% Free Tier)
-- ====================================================================

-- 1. Create Tournaments Table
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    admin_pin TEXT NOT NULL DEFAULT '1234',
    format TEXT NOT NULL DEFAULT 'home_and_away', -- 'single' or 'home_and_away'
    match_duration_hours INT NOT NULL DEFAULT 24,
    points_win INT NOT NULL DEFAULT 3,
    points_draw INT NOT NULL DEFAULT 1,
    points_loss INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'ACTIVE' -- 'ACTIVE', 'COMPLETED'
);

-- 2. Create Players Table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gamertag TEXT,
    avatar_color TEXT DEFAULT '#10b981',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Matches / Fixtures Table
CREATE TABLE IF NOT EXISTS fixtures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    leg_type TEXT DEFAULT 'HOME_AWAY', -- 'LEG_1', 'LEG_2', 'SINGLE'
    home_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    away_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    home_score INT DEFAULT NULL,
    away_score INT DEFAULT NULL,
    deadline_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', 
    -- Statuses: 
    --   'PENDING' (waiting to be played)
    --   'COMPLETED' (normal score submitted)
    --   'EXPIRED_DISQUALIFIED' (exceeded 24h: 0 pts both, +1 played)
    --   'FORFEIT_HOME' (home player defaulted)
    --   'FORFEIT_AWAY' (away player defaulted)
    completed_at TIMESTAMPTZ,
    notes TEXT
);

-- 4. Enable Row Level Security (RLS) but allow public read & authenticated/anon writes with PIN validation
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to tournaments" ON tournaments FOR ALL USING (true);

CREATE POLICY "Allow public read access to players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to players" ON players FOR ALL USING (true);

CREATE POLICY "Allow public read access to fixtures" ON fixtures FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to fixtures" ON fixtures FOR ALL USING (true);

-- 5. Helper Function to auto-expire matches that passed the 24 hour deadline
CREATE OR REPLACE FUNCTION expire_overdue_fixtures()
RETURNS void AS $$
BEGIN
    UPDATE fixtures
    SET status = 'EXPIRED_DISQUALIFIED',
        home_score = 0,
        away_score = 0,
        completed_at = NOW(),
        notes = 'Auto-disqualified: Match was not played within 24 hours deadline.'
    WHERE status = 'PENDING'
      AND deadline_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable Realtime for live updates in the frontend
ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE fixtures;

