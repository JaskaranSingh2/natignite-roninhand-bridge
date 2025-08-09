import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { ActionSchema, SignalSchema, SignalsResponseSchema, type Signal } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:9100'

async function get<T>(path: string, schema: z.ZodSchema<T>): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  const json = await res.json()
  const parsed = schema.parse(json)
  return parsed
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export function useSignals() {
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['signals'],
    queryFn: () => get('/ui/signals', SignalsResponseSchema),
  })

  const createSignal = useMutation({
    mutationFn: (payload: { name: string; actions: string[] }) => post('/ui/signals', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['signals'] }),
  })

  const deleteSignal = useMutation({
    mutationFn: (name: string) => del(`/ui/signals/${encodeURIComponent(name)}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['signals'] }),
  })

  return { ...q, createSignal, deleteSignal }
}

export function useSignal(name: string) {
  return useQuery({
    queryKey: ['signal', name],
    queryFn: () => get(`/ui/signals/${encodeURIComponent(name)}`, SignalSchema),
  })
}

export function useUpdateSignalActions(name: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { actions: { name: string; bit: number | null }[] }) =>
      put(`/ui/signals/${encodeURIComponent(name)}/actions`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['signals'] })
      qc.invalidateQueries({ queryKey: ['signal', name] })
    },
  })
}

