/**
 * Hook reutilizable para manejar modales en la aplicación
 * Centraliza la lógica de modales de éxito, error, confirmación, etc.
 */

import { useState } from 'react'

export type ModalType = 'success' | 'error' | 'warning' | 'info' | 'confirm'

export interface ModalState {
  isOpen: boolean
  type: ModalType
  title: string
  message: string
  onConfirm?: () => void
  onCancel?: () => void
  showCancel?: boolean
  confirmText?: string
  cancelText?: string
}

export const useModal = () => {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    showCancel: false,
    confirmText: 'Aceptar',
    cancelText: 'Cancelar'
  })

  /**
   * Muestra un modal con configuración personalizada
   */
  const showModal = (
    type: ModalType,
    title: string,
    message: string,
    options?: {
      onConfirm?: () => void
      onCancel?: () => void
      showCancel?: boolean
      confirmText?: string
      cancelText?: string
    }
  ) => {
    setModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm: options?.onConfirm,
      onCancel: options?.onCancel,
      showCancel: options?.showCancel || false,
      confirmText: options?.confirmText || 'Aceptar',
      cancelText: options?.cancelText || 'Cancelar'
    })
  }

  /**
   * Cierra el modal actual
   */
  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }))
    
    // Limpiar callbacks después de cerrar
    setTimeout(() => {
      setModal(prev => ({
        ...prev,
        onConfirm: undefined,
        onCancel: undefined
      }))
    }, 300) // Esperar animación de cierre
  }

  /**
   * Muestra un modal de éxito
   */
  const showSuccess = (title: string, message: string, onConfirm?: () => void) => {
    showModal('success', title, message, { onConfirm })
  }

  /**
   * Muestra un modal de error
   */
  const showError = (title: string, message: string, onConfirm?: () => void) => {
    showModal('error', title, message, { onConfirm })
  }

  /**
   * Muestra un modal de advertencia
   */
  const showWarning = (title: string, message: string, onConfirm?: () => void) => {
    showModal('warning', title, message, { onConfirm })
  }

  /**
   * Muestra un modal de información
   */
  const showInfo = (title: string, message: string, onConfirm?: () => void) => {
    showModal('info', title, message, { onConfirm })
  }

  /**
   * Muestra un modal de confirmación con botones Sí/No
   */
  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    options?: {
      confirmText?: string
      cancelText?: string
    }
  ) => {
    showModal('confirm', title, message, {
      onConfirm,
      onCancel,
      showCancel: true,
      confirmText: options?.confirmText || 'Confirmar',
      cancelText: options?.cancelText || 'Cancelar'
    })
  }

  return {
    modal,
    showModal,
    closeModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm
  }
}
