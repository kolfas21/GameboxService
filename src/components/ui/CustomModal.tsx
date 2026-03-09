import React from 'react'

interface CustomModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm'
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  showTextInput?: boolean
  textInputValue?: string
  onTextInputChange?: (value: string) => void
  textInputPlaceholder?: string
  textInputRequired?: boolean
}

export const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  showCancel = false,
  showTextInput = false,
  textInputValue = '',
  onTextInputChange,
  textInputPlaceholder = 'Escribe aquí...',
  textInputRequired = false
}) => {
  if (!isOpen) return null

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          headerClass: 'bg-success text-white',
          iconClass: 'text-success'
        }
      case 'error':
        return {
          icon: '❌',
          headerClass: 'bg-danger text-white',
          iconClass: 'text-danger'
        }
      case 'warning':
        return {
          icon: '⚠️',
          headerClass: 'bg-warning text-dark',
          iconClass: 'text-warning'
        }
      case 'confirm':
        return {
          icon: '❓',
          headerClass: 'bg-primary text-white',
          iconClass: 'text-primary'
        }
      default:
        return {
          icon: 'ℹ️',
          headerClass: 'bg-info text-white',
          iconClass: 'text-info'
        }
    }
  }

  const { icon, headerClass, iconClass } = getIconAndColor()

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleConfirm = () => {
    if (textInputRequired && showTextInput && (!textInputValue || !textInputValue.trim())) {
      return // Don't proceed if required text is empty
    }
    if (onConfirm) {
      onConfirm()
    }
    // Cerrar modal después de ejecutar onConfirm
    onClose()
  }

  return (
    <div 
      className="modal fade show d-block" 
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
      onClick={handleBackdropClick}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0">
          <div className={`modal-header border-0 ${headerClass}`}>
            <h5 className="modal-title d-flex align-items-center">
              <span className="me-2" style={{ fontSize: '1.2rem' }}>{icon}</span>
              {title}
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body text-center py-4">
            {!showTextInput && (
              <div className={`mb-3 ${iconClass}`} style={{ fontSize: '3rem' }}>
                {icon}
              </div>
            )}
            <p className="mb-3 fs-6">{message}</p>
            
            {showTextInput && (
              <div className="mt-3">
                <textarea
                  className={`form-control ${textInputRequired && (!textInputValue || !textInputValue.trim()) ? 'is-invalid' : ''}`}
                  rows={4}
                  placeholder={textInputPlaceholder}
                  value={textInputValue}
                  onChange={(e) => onTextInputChange?.(e.target.value)}
                  autoFocus
                />
                {textInputRequired && (!textInputValue || !textInputValue.trim()) && (
                  <div className="invalid-feedback text-start">
                    Este campo es requerido
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="modal-footer border-0 justify-content-center">
            {showCancel && (
              <button 
                type="button" 
                className="btn btn-outline-secondary me-2"
                onClick={onClose}
              >
                {cancelText}
              </button>
            )}
            <button 
              type="button" 
              className={`btn ${
                type === 'error' ? 'btn-danger' : 
                type === 'success' ? 'btn-success' : 
                type === 'warning' ? 'btn-warning' : 
                'btn-primary'
              } ${textInputRequired && showTextInput && (!textInputValue || !textInputValue.trim()) ? 'disabled' : ''}`}
              onClick={handleConfirm}
              disabled={textInputRequired && showTextInput && (!textInputValue || !textInputValue.trim())}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}