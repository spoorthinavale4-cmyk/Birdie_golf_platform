'use client'

import * as React from 'react'
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from '@/components/ui/toast'

type ToasterToast = {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 3000

let count = 0
function genId() { count = (count + 1) % Number.MAX_VALUE; return count.toString() }

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
const listeners: Array<(state: ToasterToast[]) => void> = []
let memoryState: ToasterToast[] = []

function dispatch(toast: ToasterToast) {
  memoryState = [toast, ...memoryState].slice(0, TOAST_LIMIT)
  listeners.forEach(l => l(memoryState))
  const timeout = setTimeout(() => {
    memoryState = memoryState.filter(t => t.id !== toast.id)
    listeners.forEach(l => l(memoryState))
  }, TOAST_REMOVE_DELAY)
  toastTimeouts.set(toast.id, timeout)
}

export function toast({ title, description, variant }: Omit<ToasterToast, 'id'>) {
  dispatch({ id: genId(), title, description, variant })
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToasterToast[]>(memoryState)
  React.useEffect(() => {
    listeners.push(setToasts)
    return () => { const idx = listeners.indexOf(setToasts); if (idx > -1) listeners.splice(idx, 1) }
  }, [])
  return { toasts }
}

export function Toaster() {
  const { toasts } = useToast()
  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant }) => (
        <Toast key={id} variant={variant}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
