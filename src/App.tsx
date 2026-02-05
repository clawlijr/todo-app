import { useState, useEffect, useCallback } from 'react'
import { supabase, type User } from './lib/supabase'
import Sidebar from './components/Sidebar'
import TodoList from './components/TodoList'
import KanbanBoard from './components/KanbanBoard'
import CalendarView from './components/CalendarView'
import StatsView from './components/StatsView'
import CommandPalette from './components/CommandPalette'
import { Loader2 } from 'lucide-react'
import type { ViewType } from './lib/supabase'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<ViewType>('list')
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! })
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! })
      } else {
        setUser(null)
      }
    })

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        user={user}
        onLogout={handleLogout}
      />
      
      <main className="ml-72 p-8">
        {currentView === 'list' && <TodoList user={user} />}
        {currentView === 'kanban' && <KanbanBoard user={user} />}
        {currentView === 'calendar' && <CalendarView user={user} />}
        {currentView === 'stats' && <StatsView user={user} />}
      </main>

      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)}
        onViewChange={setCurrentView}
      />

      {/* Keyboard shortcut hint */}
      <div className="fixed bottom-4 right-4 text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-3 py-2 rounded-full backdrop-blur-sm">
        Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">K</kbd> for commands
      </div>
    </div>
  )
}

import Auth from './components/Auth'
export default App