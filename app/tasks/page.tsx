import { signOut, getTasks } from './actions'
import TaskCard from '@/components/TaskCard'
import NewTaskForm from '@/components/NewTaskForm'
import { createClient } from '@/lib/supabase/server'

const STATUS_ORDER = ['todo', 'in_progress', 'done'] as const

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const tasks = await getTasks()

  const grouped = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  }

  const columnLabels = {
    todo: 'Pendiente',
    in_progress: 'En progreso',
    done: 'Hecho',
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">TaskFlow</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 hidden sm:block">{user?.email}</span>
          <form action={signOut}>
            <button className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800">
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <NewTaskForm />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUS_ORDER.map(status => (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  {columnLabels[status]}
                </h2>
                <span className="text-xs bg-gray-800 text-gray-500 rounded-full px-2 py-0.5">
                  {grouped[status].length}
                </span>
              </div>
              <div className="space-y-3">
                {grouped[status].map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {grouped[status].length === 0 && (
                  <div className="border-2 border-dashed border-gray-800 rounded-xl p-6 text-center text-gray-600 text-sm">
                    Sin tareas
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
