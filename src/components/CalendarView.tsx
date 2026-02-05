import { useState, useEffect } from 'react'
import { supabase, type Todo, type User } from '../lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  user: User
}

export default function CalendarView({ user: _user }: Props) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    const { data } = await supabase.from('todos').select('*').eq('is_archived', false)
    setTodos(data || [])
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { locale: de })
  const calendarEnd = endOfWeek(monthEnd, { locale: de })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getTodosForDay = (day: Date) => {
    return todos.filter(todo => todo.due_date && isSameDay(parseISO(todo.due_date), day))
  }

  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kalender</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-medium min-w-[140px] text-center">
            {format(currentDate, 'MMMM yyyy', { locale: de })}
          </span>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {weekDays.map((day) => (
            <div key={day} className="py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayTodos = getTodosForDay(day)
            const isCurrentMonth = day.getMonth() === currentDate.getMonth()
            const isToday = isSameDay(day, new Date())
            
            return (
              <motion.button
                key={day.toISOString()}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedDate(day)}
                className={`min-h-[100px] p-2 border-b border-r border-gray-100 dark:border-gray-700/50 text-left transition-colors ${
                  !isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-800/30' : ''
                } ${isToday ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
              >
                <span className={`text-sm font-medium ${
                  isToday ? 'text-indigo-600 dark:text-indigo-400' : 
                  !isCurrentMonth ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {format(day, 'd')}
                </span>

                <div className="mt-1 space-y-1">
                  {dayTodos.slice(0, 3).map((todo) => (
                    <div
                      key={todo.id}
                      className={`text-xs px-1.5 py-0.5 rounded truncate ${
                        todo.completed 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 line-through' 
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                      }`}
                    >
                      {todo.text}
                    </div>
                  ))}
                  {dayTodos.length > 3 && (
                    <div className="text-xs text-gray-500 px-1.5">+{dayTodos.length - 3} mehr</div>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Selected Day Detail */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold mb-4">
            Aufgaben für {format(selectedDate, 'dd. MMMM', { locale: de })}
          </h3>
          <div className="space-y-2">
            {getTodosForDay(selectedDate).length === 0 ? (
              <p className="text-gray-500">Keine Aufgaben für diesen Tag</p>
            ) : (
              getTodosForDay(selectedDate).map((todo) => (
                <div
                  key={todo.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    todo.completed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700/50'
                  }`}
                >
                  {todo.completed && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  <span className={todo.completed ? 'line-through text-gray-400' : ''}>{todo.text}</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}