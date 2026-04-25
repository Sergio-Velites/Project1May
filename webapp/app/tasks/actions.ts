'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  created_at: string
}

export async function getTasks(): Promise<Task[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function createTask(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const title = formData.get('title') as string
  const description = formData.get('description') as string

  await supabase.from('tasks').insert({
    title,
    description: description || null,
    status: 'todo',
    user_id: user.id,
  })

  revalidatePath('/tasks')
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const supabase = await createClient()
  await supabase.from('tasks').update({ status }).eq('id', id)
  revalidatePath('/tasks')
}

export async function deleteTask(id: string) {
  const supabase = await createClient()
  await supabase.from('tasks').delete().eq('id', id)
  revalidatePath('/tasks')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/')
}
