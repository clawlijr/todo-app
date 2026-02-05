import { useState, useEffect } from 'react'
import { supabase, type Todo, type User } from '../lib/supabase'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  user: User
}

interface Column {
  id: string
  title: string
  filter: (todo: Todo) => boolean
}

const columns: Column[] = [
  { id: 'todo', title: 'Zu erledigen', filter: (t) => !t.completed },
  { id: 'done', title: 'Erledigt', filter: (t) => t.completed },
]

function SortableTask({ todo }: { todo: Todo }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-3 cursor-move"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-3">
        <GripVertical className="w-4 h-4 text-gray-400 mt-0.5" />
        <div className="flex-1">
          <p className={`font-medium ${todo.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
            {todo.text}
          </p>
          <div className="flex gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              todo.priority === 'high' ? 'bg-red-100 text-red-600' :
              todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
              'bg-green-100 text-green-600'
            }`}>
              {todo.priority === 'high' ? 'Hoch' : todo.priority === 'medium' ? 'Mittel' : 'Niedrig'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function KanbanBoard({ user: _user }: Props) {
  const [todos, setTodos] = useState<Todo[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    const { data } = await supabase.from('todos').select('*').eq('is_archived', false)
    setTodos(data || [])
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    if (!over) return

    const activeTodo = todos.find(t => t.id === active.id)
    if (!activeTodo) return

    // Toggle completed if dropped in different column
    const overColumn = columns.find(c => c.id === over.id || todos.filter(c.filter).some(t => t.id === over.id))
    if (overColumn) {
      const shouldBeCompleted = overColumn.id === 'done'
      if (activeTodo.completed !== shouldBeCompleted) {
        await supabase.from('todos').update({ completed: shouldBeCompleted }).eq('id', activeTodo.id)
        fetchTodos()
      }
    }

  }

  return (
    <div className="h-full">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Kanban Board</h2>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-2 gap-6">
          {columns.map((column) => {
            const columnTodos = todos.filter(column.filter)
            return (
              <motion.div
                key={column.id}
                layout
                className="bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl p-4 min-h-[400px]"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">{column.title}</h3>
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm px-2 py-1 rounded-full">
                    {columnTodos.length}
                  </span>
                </div>

                <SortableContext items={columnTodos.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {columnTodos.map((todo) => (
                      <SortableTask key={todo.id} todo={todo} />
                    ))}
                  </div>
                </SortableContext>
              </motion.div>
            )
          })}
        </div>
      </DndContext>
    </div>
  )
}