/**
 * Application-wide constants
 * Centralizes magic numbers, strings, and configuration values
 */

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DELIVERED: 'delivered'
} as const

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Pendiente',
  [ORDER_STATUS.IN_PROGRESS]: 'En Progreso',
  [ORDER_STATUS.COMPLETED]: 'Completado',
  [ORDER_STATUS.DELIVERED]: 'Entregado'
} as const

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist',
  TECHNICIAN: 'technician'
} as const

export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrador',
  [USER_ROLES.RECEPTIONIST]: 'Recepcionista',
  [USER_ROLES.TECHNICIAN]: 'Técnico'
} as const

// Print Settings
export const PRINT_SETTINGS = {
  STICKER: {
    WIDTH: '7cm',
    HEIGHT: '5cm',
    PADDING: '2mm',
    LOGO_WIDTH: '4cm',
    LOGO_MARGIN: '2mm',
    FONT_SIZE: '9px',
    LINE_HEIGHT: '1.2'
  },
  TIRILLA: {
    WIDTH: '80mm',
    PADDING: '2mm',
    FONT_SIZE: '10px',
    LINE_HEIGHT: '1.3'
  }
} as const

// Auto-refresh intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  FAST: 10000, // 10 seconds
  NORMAL: 30000, // 30 seconds
  SLOW: 60000 // 1 minute
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  PRINTERS: 'gameboxservice_printers',
  AUTO_REFRESH: 'gameboxservice_auto_refresh',
  THEME: 'gameboxservice_theme',
  USER_PREFERENCES: 'gameboxservice_user_prefs'
} as const

// Validation Rules
export const VALIDATION = {
  CEDULA: {
    MIN_LENGTH: 7,
    MAX_LENGTH: 15
  },
  PHONE: {
    MIN_LENGTH: 7,
    MAX_LENGTH: 20
  },
  EMAIL: {
    MAX_LENGTH: 255
  },
  NAME: {
    MAX_LENGTH: 100
  },
  TEXT: {
    MAX_LENGTH: 500
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 72
  }
} as const

// Pagination Settings
export const PAGINATION = {
  DASHBOARD_ORDERS: 8,
  CUSTOMERS: 10,
  USERS: 10,
  TECHNICIAN_REPAIRS: 5
} as const

// Timeouts (in milliseconds)
export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 segundos
  DEBOUNCE: 300,      // 300ms
  THROTTLE: 1000,     // 1 segundo
  MODAL_ANIMATION: 300 // 300ms
} as const

// Auto-refresh Configuration
export const AUTO_REFRESH_CONFIG = {
  INTERVAL: 30000, // 30 segundos
  ENABLED_ROLES: [USER_ROLES.RECEPTIONIST, USER_ROLES.TECHNICIAN]
} as const

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY HH:mm',
  FILE: 'YYYYMMDD',
  ISO: 'YYYY-MM-DDTHH:mm:ss'
} as const

// API Endpoints (if needed in the future)
export const API_ENDPOINTS = {
  ORDERS: '/api/orders',
  CUSTOMERS: '/api/customers',
  USERS: '/api/users'
} as const

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'Ha ocurrido un error. Por favor, intenta nuevamente.',
  NETWORK: 'Error de conexión. Verifica tu conexión a internet.',
  UNAUTHORIZED: 'No tienes permisos para realizar esta acción.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  VALIDATION: 'Por favor, verifica los datos ingresados.'
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  ORDER_CREATED: 'Orden creada exitosamente',
  ORDER_UPDATED: 'Orden actualizada exitosamente',
  ORDER_DELETED: 'Orden eliminada exitosamente',
  USER_INVITED: 'Invitación enviada exitosamente',
  CHANGES_SAVED: 'Cambios guardados exitosamente'
} as const
