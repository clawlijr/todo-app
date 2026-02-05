import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutList, Columns, CalendarDays, BarChart3, 
  Search, Moon
} from 'lucide-react'
import type { ViewType } from '../lib/supabase'

interface Props {
  isOpen: boolean
  onClose: () => void
  onViewChange: (view: ViewType) => void
}

interface CommandItem {
  id: string
  label: string
  icon: any
  shortcut?: string
  action: () => void
  keywords: string[]
}

export default function CommandPalette({ isOpen, onClose, onViewChange }: Props) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands: CommandItem[] = [
    {
      id: 'list',
      label: 'Listenansicht öffnen',
      icon: LayoutList,
      shortcut: '1',
      action: () => { onViewChange('list'); onClose() },
      keywords: ['list', 'liste', 'aufgaben', 'tasks']
    },
    {
      id: 'kanban',
      label: 'Kanban Board öffnen',
      icon: Columns,
      shortcut: '2',
      action: () => { onViewChange('kanban'); onClose() },
      keywords: ['kanban', 'board', 'spalten', 'columns']
    },
    {
      id: 'calendar',
      label: 'Kalender öffnen',
      icon: CalendarDays,
      shortcut: '3',
      action: () => { onViewChange('calendar'); onClose() },
      keywords: ['kalender', 'calendar', 'datum', 'termin']
    },
    {
      id: 'stats',
      label: 'Statistiken öffnen',
      icon: BarChart3,
      shortcut: '4',
      action: () => { onViewChange('stats'); onClose() },
      keywords: ['stats', 'statistik', 'charts', 'analyse']
    },
    {
      id: 'dark',
      label: 'Dunkelmodus umschalten',
      icon: Moon,
      action: () => {
        document.documentElement.classList.toggle('dark')
        onClose()
      },
      keywords: ['dark', 'dunkel', 'theme', 'modus']
    },
  ]

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.keywords.some(k => k.toLowerCase().includes(search.toLowerCase()))
  )

  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(i => (i + 1) % filteredCommands.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length)
          break
        case 'Enter':
          e.preventDefault()
          filteredCommands[selectedIndex]?.action()
          break
        case 'Escape':
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setSelectedIndex(0)
                }}
                placeholder="Befehl suchen..."
                className="flex-1 bg-transparent border-none outline-none text-lg text-gray-900 dark:text-white placeholder-gray-400"
              />
              <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 rounded">ESC</kbd>
            </div>

            {/* Commands List */}
            <div className="max-h-96 overflow-y-auto p-2">
              {filteredCommands.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Keine Befehle gefunden
                </div>
              ) : (
                <>
                  <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Befehle</p>
                  {filteredCommands.map((cmd, index) => (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                        index === selectedIndex
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <cmd.icon className={`w-5 h-5 ${index === selectedIndex ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                      <span className="flex-1">{cmd.label}</span>
                      {cmd.shortcut && (
                        <kbd className={`px-2 py-1 text-xs rounded ${
                          index === selectedIndex
                            ? 'bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                        }`}
                        >
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded">↑↓</kbd>
                Navigieren
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded">Enter</kbd>
                Auswählen
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}