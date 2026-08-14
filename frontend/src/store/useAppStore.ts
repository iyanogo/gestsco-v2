import { create } from 'zustand'

interface AppState {
  isLoading: boolean
  setLoading: (loading: boolean) => void
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

interface User {
  id: string
  email: string
  name: string
}

export const useAppStore = create<AppState>((set) => ({
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  user: null,
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('token')
    set({ user: null })
  },
}))
