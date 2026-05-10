'use client'

import { createContext, useContext } from 'react'

interface CurrentUser {
  id: string
  role: string
  full_name: string
}

export const CurrentUserContext = createContext<CurrentUser | null>(null)

export function useCurrentUser() {
  return useContext(CurrentUserContext)
}
