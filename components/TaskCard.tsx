'use client'

import { deleteTask, updateTaskStatus, type Task, type TaskStatus } from '@/app/tasks/actions'
import { useState } from 'react'

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; next: TaskStatus }> = {
  todo: { label: 'Pendiente', color: 'bg-gray-700 text-gray-300', next: 'in_progress' },
  in_progress: { label: 'En progreso', color: 'bg-blue-500/20 text-blue-300', next: 'done' },
  done: { label: 'Hecho', color: 'bg-green-500/20 text-green-300', next: 'todo' },
}

export default function TaskCard({ task }: { task: Task }) {
  const [loading, setLoading] = useState(false)
  const config = STATUS_CONFIG[task.status]

  async function handleStatusChange() {
    setLoading(true)
    await updateTaskStatus(task.id, config.next)
    setLoading(false)
  }

  async function handleDelete() {
    setLoading(true)
    await deleteTask(task.id)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium break-words ${task.status === 'done' ? 'line-through text-gray-500' : 'text-white'}`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-gray-500 mt-1 break-words">{task.description}</p>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-gray-600 hover:text-red-400 transition-colors shrink-0 disabled:opacity-50 p-1"
          aria-label="Eliminar tarea"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <button
        onClick={handleStatusChange}
        disabled={loading}
        className={`self-start text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity disabled:opacity-50 ${config.color}`}
      >
        {config.label}
      </button>
    </div>
  )
}
