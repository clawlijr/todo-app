import { useState, useEffect } from 'react'
import { supabase, type Todo, type User } from '../lib/supabase'
import { 
  Plus, Calendar, Flag, Trash2, Edit2, Check
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO, isPast, isToday, isTomorrow } from 'date-fns'
import { de } from 'date-fns/locale'

interface Props {
  user: User
}

const PRIORITIES = [
  { id: 'high', label: 'Hoch', color: 'bg-red-500', text: 'text-red-600' },
  { id: 'medium', label: 'Mittel', color: 'bg-yellow-500', text: 'text-yellow-600' },
  { id: 'low', label: 'Niedrig', color: 'bg-green-500', text: 'text-green-600' },
]

const CATEGORIES = [
  { id: 'arbeit', label: 'Arbeit', color: 'bg-blue-500' },
  { id: 'privat', label: 'Privat', color: 'bg-green-500' },
  { id: 'wichtig', label: 'Wichtig', color: 'bg-red-500' },
  { id: 'ideen', label: 'Ideen', color: 'bg-purple-500' },
]

export default function TodoList({ user }: Props) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [selectedPriority, setSelectedPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [selectedCategory, setSelectedCategory] = useState('privat')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'today' | 'overdue'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'alpha'>('date')

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (!error) setTodos(data || [])
    setLoading(false)
  }

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim()) return

    const { error } = await supabase.from('todos').insert({
      text: newTodo.trim(),
      description: newDescription.trim() || null,
      completed: false,
      category: selectedCategory,
      priority: selectedPriority,
      due_date: dueDate || null,
      user_id: user.id,
    })

    if (!error) {
      setNewTodo('')
      setNewDescription('')
      setDueDate('')
      fetchTodos()
    }
  }

  const toggleTodo = async (id: string, completed: boolean) => {
    await supabase.from('todos').update({ completed: !completed }).eq('id', id)
    fetchTodos()
  }

  const deleteTodo = async (id: string) => {
    await supabase.from('todos').delete().eq('id', id)
    fetchTodos()
  }

  const getDueDateColor = (date?: string) => {
    if (!date) return ''
    const d = parseISO(date)
    if (isPast(d) && !isToday(d)) return 'text-red-600 bg-red-50'
    if (isToday(d)) return 'text-orange-600 bg-orange-50'
    if (isTomorrow(d)) return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getDueDateLabel = (date?: string) => {
    if (!date) return ''
    const d = parseISO(date)
    if (isToday(d)) return 'Heute'
    if (isTomorrow(d)) return 'Morgen'
    return format(d, 'dd.MM.yyyy', { locale: de })
  }

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active' && todo.completed) return false
    if (filter === 'completed' && !todo.completed) return false
    if (filter === 'today' && (!todo.due_date || !isToday(parseISO(todo.due_date)))) return false
    if (filter === 'overdue' && (!todo.due_date || !isPast(parseISO(todo.due_date)) || isToday(parseISO(todo.due_date)))) return false
    return true
  })

  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    if (sortBy === 'alpha') return a.text.localeCompare(b.text)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    today: todos.filter(t => t.due_date && isToday(parseISO(t.due_date))).length,
    overdue: todos.filter(t => t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)) && !t.completed).length,
  }

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" /></div>

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Gesamt', value: stats.total, color: 'bg-blue-500' },
          { label: 'Erledigt', value: stats.completed, color: 'bg-green-500' },
          { label: 'Heute fällig', value: stats.today, color: 'bg-orange-500' },
          { label: 'Überfällig', value: stats.overdue, color: 'bg-red-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            <div className={`mt-2 h-1 rounded-full ${stat.color} opacity-20`}></div>
          </div>
        ))}
      </div>

      {/* Add Todo Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <form onSubmit={addTodo} className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Neue Aufgabe hinzufügen..."
              className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border-0 focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Hinzufügen
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Beschreibung (optional)..."
              className="flex-1 min-w-[200px] px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border-0 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border-0 text-sm dark:text-white"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border-0 text-sm dark:text-white"
            >
              {PRIORITIES.map(pri => (
                <option key={pri.id} value={pri.id}>{pri.label}</option>
              ))}
            </select>

            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border-0 text-sm dark:text-white"
            />
          </div>
        </form>
      </motion.div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'Alle' },
          { id: 'active', label: 'Offen' },
          { id: 'completed', label: 'Erledigt' },
          { id: 'today', label: 'Heute' },
          { id: 'overdue', label: 'Überfällig' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-500">Sortieren:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm dark:text-white"
          >
            <option value="date">Datum</option>
            <option value="priority">Priorität</option>
            <option value="alpha">Alphabetisch</option>
          </select>
        </div>
      </div>

      {/* Todo List */}
      <div className="space-y-3">
        <AnimatePresence>
          {sortedTodos.map((todo) => (
            <motion.div
              key={todo.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-white dark:bg-gray-800 rounded-2xl border transition-all ${
                todo.completed 
                  ? 'border-gray-200 dark:border-gray-700 opacity-60' 
                  : 'border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="p-4 flex items-start gap-3">
                <button
                  onClick={() => toggleTodo(todo.id, todo.completed)}
                  className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    todo.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500'
                  }`}
                >
                  {todo.completed && <Check className="w-4 h-4" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className={`font-medium ${todo.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                        {todo.text}
                      </p>
                      
                      {todo.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{todo.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full text-white ${
                          CATEGORIES.find(c => c.id === todo.category)?.color
                        }`}>
                          {CATEGORIES.find(c => c.id === todo.category)?.label}
                        </span>

                        <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                          PRIORITIES.find(p => p.id === todo.priority)?.color.replace('bg-', 'bg-opacity-20 bg-')
                        } ${PRIORITIES.find(p => p.id === todo.priority)?.text}`}
                        >
                          <Flag className="w-3 h-3" />
                          {PRIORITIES.find(p => p.id === todo.priority)?.label}
                        </span>

                        {todo.due_date && (
                          <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getDueDateColor(todo.due_date)}`}>
                            <Calendar className="w-3 h-3" />
                            {getDueDateLabel(todo.due_date)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingId(editingId === todo.id ? null : todo.id)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sortedTodos.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Check className="w-8 h-8" />
            </div>
            <p>Keine Aufgaben gefunden</p>
            <p className="text-sm mt-1">Erstelle eine neue Aufgabe oben</p>
          </div>
        )}
      </div>
    </div>
  )
}