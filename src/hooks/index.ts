/**
 * Central barrel export for all custom hooks
 * This makes imports cleaner throughout the application
 */

// Auto-refresh functionality
export { useAutoRefresh } from './useAutoRefresh'

// Data hooks
export { useCustomers } from './useCustomers'
export { useServiceOrders } from './useServiceOrders'
export { useUsers } from './useUsers'
export { useCompanySettings } from './useCompanySettings'
export { useExternalWorkshops } from './useExternalWorkshops'
export { useExternalRepairs } from './useExternalRepairs'

// Realtime functionality
export { useRealtimeSubscription } from './useRealtimeSubscription'

// Dynamic page info (title & favicon)
export { useDynamicPageInfo } from './useDynamicPageInfo'

// Image processing
export { useImageToBase64 } from './useImageToBase64'
