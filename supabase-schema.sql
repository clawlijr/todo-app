-- Erstelle die Todos-Tabelle
CREATE TABLE IF NOT EXISTS todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'sonstiges',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own todos
CREATE POLICY "Users can view own todos" ON todos
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own todos
CREATE POLICY "Users can insert own todos" ON todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own todos
CREATE POLICY "Users can update own todos" ON todos
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own todos
CREATE POLICY "Users can delete own todos" ON todos
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for todos
ALTER PUBLICATION supabase_realtime ADD TABLE todos;