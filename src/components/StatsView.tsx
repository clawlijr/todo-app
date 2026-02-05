import { useState, useEffect } from 'react'
import { supabase, type Todo, type User } from '../lib/supabase'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts'
import { format, subDays, parseISO, isSameDay } from 'date-fns'
import { de } from 'date-fns/locale'
import { CheckCircle2, Clock, TrendingUp, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  user: User
}

export default function StatsView({ user: _user }: Props) {
  const [todos, setTodos] = useState<Todo[]>([])

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    const { data } = await supabase.from('todos').select('*')
    setTodos(data || [])
  }

  // Stats calculations
  const totalTodos = todos.length
  const completedTodos = todos.filter(t => t.completed).length
  const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0
  
  const highPriority = todos.filter(t => t.priority === 'high' && !t.completed).length
  const overdue = todos.filter(t => 
    t.due_date && !t.completed && new Date(t.due_date) < new Date()
  ).length

  // Priority distribution
  const priorityData = [
    { name: 'Hoch', value: todos.filter(t => t.priority === 'high').length, color: '#ef4444' },
    { name: 'Mittel', value: todos.filter(t => t.priority === 'medium').length, color: '#f59e0b' },
    { name: 'Niedrig', value: todos.filter(t => t.priority === 'low').length, color: '#10b981' },
  ].filter(p => p.value > 0)

  // Weekly completion data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    const completed = todos.filter(t => 
      t.completed && t.created_at && isSameDay(parseISO(t.created_at), date)
    ).length
    return {
      day: format(date, 'EEE', { locale: de }),
      completed,
      created: todos.filter(t => 
        t.created_at && isSameDay(parseISO(t.created_at), date)
      ).length
    }
  })

  // Category data
  const categories = ['arbeit', 'privat', 'wichtig', 'ideen']
  const categoryData = categories.map(cat => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    completed: todos.filter(t => t.category === cat && t.completed).length,
    pending: todos.filter(t => t.category === cat && !t.completed).length,
  })).filter(c => c.completed + c.pending > 0)

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Statistiken</h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { 
            label: 'Abschlussrate', 
            value: `${completionRate}%`, 
            icon: TrendingUp, 
            color: 'bg-green-500',
            subtext: `${completedTodos}/${totalTodos} erledigt`
          },
          { 
            label: 'Hohe Priorität', 
            value: highPriority, 
            icon: Clock, 
            color: 'bg-red-500',
            subtext: 'Ausstehend'
          },
          { 
            label: 'Überfällig', 
            value: overdue, 
            icon: Calendar, 
            color: 'bg-orange-500',
            subtext: 'Benötigt Aufmerksamkeit'
          },
          { 
            label: 'Gesamt', 
            value: totalTodos, 
            icon: CheckCircle2, 
            color: 'bg-indigo-500',
            subtext: 'Alle Aufgaben'
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>
              </div>
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Aktivität der letzten 7 Tage</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Bar dataKey="created" name="Erstellt" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Erledigt" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Priority Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Prioritätsverteilung</h3>
          <div className="h-64">
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Keine Daten verfügbar
              </div>
            )}
          </div>
          
          <div className="flex justify-center gap-4 mt-4">
            {priorityData.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-sm text-gray-600 dark:text-gray-400">{p.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Category Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Kategorien</h3>
        <div className="h-64">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="name" type="category" stroke="#6b7280" width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Bar dataKey="completed" name="Erledigt" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="pending" name="Ausstehend" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Keine Daten verfügbar
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}