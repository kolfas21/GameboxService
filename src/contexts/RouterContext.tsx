import React, { createContext, useContext, useState } from 'react'
import type { Customer } from '../types'

export type Page = 'dashboard' | 'orders' | 'customers' | 'settings' | 'create-order' | 'warranty' | 'external-workshops' | 'users' | 'caja'

interface RouterContextType {
  currentPage: Page
  navigate: (page: Page) => void
  preSelectedCustomer: Customer | null
  setPreSelectedCustomer: (customer: Customer | null) => void
}

const RouterContext = createContext<RouterContextType | undefined>(undefined)

export const useRouter = () => {
  const context = useContext(RouterContext)
  if (context === undefined) {
    throw new Error('useRouter must be used within a RouterProvider')
  }
  return context
}

interface RouterProviderProps {
  children: React.ReactNode
}

export const RouterProvider: React.FC<RouterProviderProps> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [preSelectedCustomer, setPreSelectedCustomer] = useState<Customer | null>(null)

  const navigate = (page: Page) => {
    setCurrentPage(page)
  }

  const value = {
    currentPage,
    navigate,
    preSelectedCustomer,
    setPreSelectedCustomer,
  }

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}
