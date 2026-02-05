import { useState, useEffect } from 'react'
import { supabase, type Todo, type User } from '../lib/supabase'
import { 
  Plus, Trash2, Edit2, Check, X, Moon, Sun, LogOut, 
  Tag, Flag, Filter, CheckCircle2, Circle,
  TrendingUp
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  user: User
  onLogout: () => void
}

const CATEGORIES = [
  { id: 'arbeit', name: 'Arbeit', color: 'bg-blue-500' },
  { id: 'privat', name: 'Privat', color: 'bg-green-500' },
  { id: 'wichtig', name: 'Wichtig', color: 'bg-red-500' },
  { id: 'sonstiges', name: 'Sonstiges', color: 'bg-gray-500' },
]

const PRIORITIES = [
  { id: 'high', name: 'Hoch', color: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200' },
  { id: 'medium', name: 'Mittel', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200' },
  { id: 'low', name: 'Niedrig', color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200' },
]

export default function TodoApp({ user, onLogout }: Props) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('privat')
  const [selectedPriority, setSelectedPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load todos
  useEffect(() => {
    fetchTodos()
    
    // Check system dark mode preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching todos:', error)
    } else {
      setTodos(data || [])
    }
    setLoading(false)
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim()) return

    const { error } = await supabase.from('todos').insert([
      {
        text: newTodo.trim(),
        completed: false,
        category: selectedCategory,
        priority: selectedPriority,
        user_id: user.id,
      }
    ])

    if (error) {
      console.error('Error adding todo:', error)
    } else {
      setNewTodo('')
      fetchTodos()
    }
  }

  const toggleTodo = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from('todos')
      .update({ completed: !completed })
      .eq('id', id)

    if (!error) fetchTodos()
  }

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from('todos').delete().eq('id', id)
    if (!error) fetchTodos()
  }

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id)
    setEditText(todo.text)
  }

  const saveEdit = async (id: string) => {
    if (!editText.trim()) return
    
    const { error } = await supabase
      .from('todos')
      .update({ text: editText.trim() })
      .eq('id', id)

    if (!error) {
      setEditingId(null)
      fetchTodos()
    }
  }

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active' && todo.completed) return false
    if (filter === 'completed' && !todo.completed) return false
    if (categoryFilter !== 'all' && todo.category !== categoryFilter) return false
    return true
  })

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    active: todos.filter(t => !t.completed).length,
  }

  const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📝 Todo App</h1>
            <span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Gesamt</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Erledigt</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.active}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Offen</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="card p-4 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fortschritt</span>
            <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Add Todo Form */}
        <div className="card p-6 mb-8">
          <form onSubmit={addTodo} className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Neue Aufgabe..."
                className="input flex-1"
              />
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Hinzufügen
              </button>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input py-1 px-3 text-sm w-32"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as any)}
                  className="input py-1 px-3 text-sm w-32"
                >
                  {PRIORITIES.map(pri => (
                    <option key={pri.id} value={pri.id}>{pri.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex gap-1">
              {(['all', 'active', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                  }`}
                >
                  {f === 'all' && 'Alle'}
                  {f === 'active' && 'Offen'}
                  {f === 'completed' && 'Erledigt'}
                </button>
              ))}
            </div>
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input py-1 px-3 text-sm w-40"
          >
            <option value="all">Alle Kategorien</option>
            {CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Todo List */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredTodos.map((todo) => (
              <motion.div
                key={todo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="card p-4 flex items-center gap-4 group"
              >
                <button
                  onClick={() => toggleTodo(todo.id, todo.completed)}
                  className="flex-shrink-0"
                >
                  {todo.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400 hover:text-blue-600" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  {editingId === todo.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="input flex-1 py-1"
                        autoFocus
                      />
                      <button
                        onClick={() => saveEdit(todo.id)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className={`text-gray-900 dark:text-gray-100 ${todo.completed ? 'line-through opacity-50' : ''}`}>
                        {todo.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full text-white ${
                          CATEGORIES.find(c => c.id === todo.category)?.color
                        }`}>
                          {CATEGORIES.find(c => c.id === todo.category)?.name}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          PRIORITIES.find(p => p.id === todo.priority)?.color
                        }`}>
                          {PRIORITIES.find(p => p.id === todo.priority)?.name}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {editingId !== todo.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <button
                      onClick={() => startEdit(todo)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredTodos.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Keine Aufgaben gefunden</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}