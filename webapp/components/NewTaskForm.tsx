'use client'

import { createTask } from '@/app/tasks/actions'
import { useRef, useState } from 'react'

export default function NewTaskForm() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    await createTask(formData)
    formRef.current?.reset()
    setOpen(false)
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-3 px-4 transition-colors flex items-center justify-center gap-2 text-base"
      >
        <span className="text-xl leading-none">+</span>
        Nueva tarea
      </button>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="bg-gray-900 border border-indigo-500/50 rounded-xl p-4 space-y-3">
      <input
        name="title"
        required
        autoFocus
        placeholder="Título de la tarea"
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors text-base"
      />
      <textarea
        name="description"
        placeholder="Descripción (opcional)"
        rows={2}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors text-base resize-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-colors"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
