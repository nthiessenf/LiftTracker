-- Supabase/PostgreSQL Schema for Custom Routines
-- This schema can be used when migrating to Supabase backend

-- Routines table
CREATE TABLE IF NOT EXISTS routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Routine exercises junction table
CREATE TABLE IF NOT EXISTS routine_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id VARCHAR(255) NOT NULL, -- References exercise ID from exercises table
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(routine_id, exercise_id, order_index)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine_id ON routine_exercises(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_order ON routine_exercises(routine_id, order_index);

-- Function to get routine with exercises (for efficient querying)
-- This can be used as a view or function in Supabase
CREATE OR REPLACE FUNCTION get_user_routines_with_exercises(p_user_id UUID)
RETURNS TABLE (
  routine_id UUID,
  routine_name VARCHAR,
  routine_created_at TIMESTAMP WITH TIME ZONE,
  exercise_id VARCHAR,
  exercise_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id as routine_id,
    r.name as routine_name,
    r.created_at as routine_created_at,
    re.exercise_id,
    re.order_index as exercise_order
  FROM routines r
  LEFT JOIN routine_exercises re ON r.id = re.routine_id
  WHERE r.user_id = p_user_id
  ORDER BY r.created_at DESC, re.order_index ASC;
END;
$$ LANGUAGE plpgsql;

