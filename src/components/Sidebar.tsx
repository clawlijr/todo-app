import { 
  LayoutList, Columns, CalendarDays, BarChart3, 
  LogOut, Command, Moon, Sun
} from 'lucide-react'
import { useState, useEffect } from 'react'
import type { User, ViewType } from '../lib/supabase'

interface Props {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  user: User
  onLogout: () => void
}

const menuItems = [
  { id: 'list' as ViewType, label: 'Listenansicht', icon: LayoutList },
  { id: 'kanban' as ViewType, label: 'Kanban Board', icon: Columns },
  { id: 'calendar' as ViewType, label: 'Kalender', icon: CalendarDays },
  { id: 'stats' as ViewType, label: 'Statistiken', icon: BarChart3 },
]

export default function Sidebar({ currentView, onViewChange, user, onLogout }: Props) {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Command className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-gray-900 dark:text-white">TaskFlow</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Produktivität neu definiert</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ansichten</p>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              currentView === item.id
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
            {item.label}
          </button>
        ))}

        <div className="mt-8">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Features</p>
          <p className="px-3 text-sm text-gray-500 dark:text-gray-400">Drag & Drop • Kalender • Stats</p>
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 space-y-2">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="flex items-center gap-3">
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {darkMode ? 'Hellmodus' : 'Dunkelmodus'}
          </span>
        </button>

        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[140px]">{user.email}</span>
          <button
            onClick={onLogout}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            title="Abmelden"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}