/**
 * Central barrel export for all utility functions
 * This makes imports cleaner throughout the application
 */

// Image utilities
export { convertImageToBase64, preloadImageAsBase64 } from './imageConverter'

// Print utilities
export {
  openPrintWindow,
  formatDateForPrint,
  getStatusDisplayName,
  truncateText,
  generatePageStyles
} from './printHelpers'

// Order number utilities
export {
  generateOrderNumber,
  generateOrderNumberSequential,
  generateOrderNumberSimple
} from './orderNumber'
