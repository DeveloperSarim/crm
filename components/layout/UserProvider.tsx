'use client'

import { CurrentUserContext } from '@/lib/hooks/useCurrentUser'

interface UserProviderProps {
  user: { id: string; role: string; full_name: string }
  children: React.ReactNode
}

export function UserProvider({ user, children }: UserProviderProps) {
  return (
    <CurrentUserContext.Provider value={user}>
      {children}
    </CurrentUserContext.Provider>
  )
}
