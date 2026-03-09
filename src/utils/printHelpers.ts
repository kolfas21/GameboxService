/**
 * Utility functions for printing functionality
 * Centralizes print-related operations
 */

/**
 * Opens a print window with custom HTML content
 * @param htmlContent - HTML content to print
 * @param autoPrint - Whether to automatically trigger print dialog
 * @param delay - Delay before printing (in milliseconds)
 */
export const openPrintWindow = (
  htmlContent: string,
  autoPrint: boolean = true,
  delay: number = 1000
): void => {
  const printWindow = window.open('', '_blank', 'width=600,height=800')
  
  if (!printWindow) {
    throw new Error('Failed to open print window. Please check popup blocker settings.')
  }

  printWindow.document.write(htmlContent)
  printWindow.document.close()
  
  if (autoPrint) {
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, delay)
  }
}

/**
 * Formats a date string for display in Spanish format
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatDateForPrint = (dateString: string): string => {
  return new Date(dateString).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Gets display name for order status
 * @param status - Order status code
 * @returns Display name in Spanish
 */
export const getStatusDisplayName = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'PENDIENTE',
    'in_progress': 'EN PROGRESO',
    'completed': 'COMPLETADO',
    'delivered': 'ENTREGADO'
  }
  
  return statusMap[status] || status.toUpperCase()
}

/**
 * Truncates text to a maximum length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength)
}

/**
 * Generates print CSS styles for different paper sizes
 * @param width - Paper width in cm
 * @param height - Paper height in cm
 * @returns CSS string for @page rule
 */
export const generatePageStyles = (width: string, height: string): string => {
  return `
    @page {
      margin: 0;
      size: ${width} ${height};
    }
  `
}
