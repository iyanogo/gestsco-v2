export interface User {
  id: string
  email: string
  name: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Export types from etudiant module
export * from './etudiant';

// Export types from inscription module
export * from './inscription';

// Export types from evaluation module
export * from './evaluation';
