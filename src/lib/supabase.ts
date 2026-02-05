import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ljzdjgtptkcfagvfvenj.supabase.co'
const supabaseKey = 'sb_publishable_yf_CmYOY3MNcvxNgTzqlrQ_XpuzkOuN'

export const supabase = createClient(supabaseUrl, supabaseKey)

export type User = {
  id: string
  email: string
}

export type Project = {
  id: string
  name: string
  color: string
  icon: string
  user_id: string
  created_at: string
}

export type Tag = {
  id: string
  name: string
  color: string
  user_id: string
  created_at: string
}

export type Todo = {
  id: string
  text: string
  description?: string
  completed: boolean
  category: string
  priority: 'high' | 'medium' | 'low'
  due_date?: string
  parent_id?: string
  order_index: number
  is_archived: boolean
  user_id: string
  created_at: string
  project_id?: string
  tags?: Tag[]
  subtasks?: Todo[]
}

export type ViewType = 'list' | 'kanban' | 'calendar' | 'stats'