-- Erweiterte Datenbank-Schema

-- Todos-Tabelle erweitert
ALTER TABLE todos ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES todos(id) ON DELETE CASCADE;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Tags-Tabelle
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, user_id)
);

-- Todo-Tag Verknüpfung (Many-to-Many)
CREATE TABLE IF NOT EXISTS todo_tags (
  todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (todo_id, tag_id)
);

-- Projects/Kategorien
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'folder',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies für Tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tags" ON tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tags" ON tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tags" ON tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tags" ON tags FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies für Todo-Tags
ALTER TABLE todo_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view todo_tags" ON todo_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM todos WHERE todos.id = todo_tags.todo_id AND todos.user_id = auth.uid())
);
CREATE POLICY "Users can insert todo_tags" ON todo_tags FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM todos WHERE todos.id = todo_tags.todo_id AND todos.user_id = auth.uid())
);
CREATE POLICY "Users can delete todo_tags" ON todo_tags FOR DELETE USING (
  EXISTS (SELECT 1 FROM todos WHERE todos.id = todo_tags.todo_id AND todos.user_id = auth.uid())
);

-- RLS Policies für Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Realtime für neue Tabellen
ALTER PUBLICATION supabase_realtime ADD TABLE tags;
ALTER PUBLICATION supabase_realtime ADD TABLE todo_tags;
ALTER PUBLICATION supabase_realtime ADD TABLE projects;