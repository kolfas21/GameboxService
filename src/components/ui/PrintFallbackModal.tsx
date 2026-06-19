import React from 'react'
import { Printer, Download, X, PowerOff, AlertTriangle } from 'lucide-react'

interface PrintFallbackModalProps {
  isOpen: boolean
  errorDetail: string
  onManualPrint: () => void
  onSavePdf?: () => void
  onDisableQz: () => void
  onClose: () => void
}

export const PrintFallbackModal: React.FC<PrintFallbackModalProps> = ({
  isOpen,
  errorDetail,
  onManualPrint,
  onSavePdf,
  onDisableQz,
  onClose
}) => {
  if (!isOpen) return null

  const isCertError = errorDetail.toLowerCase().includes('sign') || 
                      errorDetail.toLowerCase().includes('certificate') || 
                      errorDetail.toLowerCase().includes('trusted') || 
                      errorDetail.toLowerCase().includes('firma')

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0">
          <div className="modal-header border-0 bg-warning text-dark">
            <h5 className="modal-title d-flex align-items-center">
              <AlertTriangle className="me-2" size={24} />
              Impresión directa no disponible
            </h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body py-4">
            <p className="mb-3 fs-6">
              QZ Tray no está disponible para imprimir directamente en esta sucursal o presentó un problema de certificado/firma. Puedes imprimir manualmente desde el navegador{onSavePdf ? ' o guardar el PDF' : ''}.
            </p>
            
            {isCertError ? (
              <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: '0.85rem' }}>
                <strong>Detalle técnico:</strong> {errorDetail}
              </div>
            ) : (
              errorDetail && (
                <div className="text-muted mb-3" style={{ fontSize: '0.8rem' }}>
                  Detalle: {errorDetail}
                </div>
              )
            )}

            <div className="d-flex flex-column gap-2 mt-4">
              <button className="btn btn-primary w-100 d-flex align-items-center justify-content-center py-2" onClick={onManualPrint}>
                <Printer size={18} className="me-2" />
                Imprimir manualmente
              </button>
              
              {onSavePdf && (
                <button className="btn btn-success w-100 d-flex align-items-center justify-content-center py-2" onClick={onSavePdf}>
                  <Download size={18} className="me-2" />
                  Guardar PDF
                </button>
              )}
              
              <button className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center py-2" onClick={onDisableQz}>
                <PowerOff size={18} className="me-2" />
                Deshabilitar QZ para esta sucursal
              </button>
              
              <button className="btn btn-light w-100 d-flex align-items-center justify-content-center py-2" onClick={onClose}>
                <X size={18} className="me-2" />
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
