import React, { useState, useEffect } from 'react'
import { Printer, FileText, Download, Eye } from 'lucide-react'
import { CustomModal } from './ui/CustomModal'
import type { ServiceOrder, Customer } from '../types'

interface PrinterConfig {
  id: string
  name: string
  type: 'pos' | 'zebra' | 'thermal'
  connectionType: 'usb' | 'network' | 'bluetooth'
  ipAddress?: string
  port?: number
  isDefault: boolean
  paperWidth: number
  settings: {
    fontSize: number
    fontFamily: string
    charset: string
    density: number
  }
}

interface ModalState {
  isOpen: boolean
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm'
  title: string
  message: string
  onConfirm?: () => void
  onCancel?: () => void
  showCancel?: boolean
  confirmText?: string
}

interface CommandaPrintProps {
  order: ServiceOrder
  customer: Customer
  onPrint?: () => void
  onClose?: () => void
}

const CommandaPrint: React.FC<CommandaPrintProps> = ({ order, customer, onPrint, onClose }) => {
  const [printers, setPrinters] = useState<PrinterConfig[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)
  const [printing, setPrinting] = useState(false)
  
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  })

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }))
  }

  const showSuccessModal = (message: string) => {
    setModal({
      isOpen: true,
      type: 'success',
      title: '¡Impresión Exitosa!',
      message,
      onConfirm: closeModal
    })
  }

  const showErrorModal = (message: string) => {
    setModal({
      isOpen: true,
      type: 'error',
      title: 'Error de Impresión',
      message,
      onConfirm: closeModal
    })
  }

  // Cargar impresoras configuradas
  useEffect(() => {
    const savedPrinters = localStorage.getItem('gameboxservice_printers')
    if (savedPrinters) {
      const printersData = JSON.parse(savedPrinters)
      setPrinters(printersData)
      
      // Seleccionar impresora por defecto
      const defaultPrinter = printersData.find((p: PrinterConfig) => p.isDefault)
      if (defaultPrinter) {
        setSelectedPrinter(defaultPrinter.id)
      }
    }
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'pending':
        return 'PENDIENTE'
      case 'in_progress':
        return 'EN PROGRESO'
      case 'completed':
        return 'COMPLETADO'
      case 'delivered':
        return 'ENTREGADO'
      default:
        return status.toUpperCase()
    }
  }

  // Generar contenido de la comanda según el tipo de impresora
  const generateCommandaContent = (printer: PrinterConfig) => {
    const width = printer.paperWidth
    const isSmall = width <= 58
    const separator = '='.repeat(isSmall ? 32 : 48)
    const lineSeparator = '-'.repeat(isSmall ? 32 : 48)
    
    const content = `
${separator}
     🎮 GAMEBOXSERVICE 🎮
    COMANDA DE SERVICIO
${separator}

ORDEN #: ${order.order_number}
FECHA: ${formatDate(order.created_at)}

${lineSeparator}
CLIENTE:
${lineSeparator}
Nombre: ${customer.full_name}
${customer.phone ? `Tel: ${customer.phone}` : ''}
${customer.email ? `Email: ${customer.email}` : ''}

${lineSeparator}
DISPOSITIVO:
${lineSeparator}
Tipo: ${order.device_type}
Marca: ${order.device_brand}
Modelo: ${order.device_model}

${lineSeparator}
PROBLEMA:
${lineSeparator}
${order.problem_description}

${lineSeparator}
DETALLES:
${lineSeparator}
Estado: ${getStatusDisplayName(order.status)}
${order.serial_number ? `Num. Serie: ${order.serial_number}` : 'Sin número de serie'}
${order.estimated_completion ? `Est. Entrega: ${formatDate(order.estimated_completion)}` : ''}

${separator}
   Conserve este ticket
     como comprobante
${separator}

Generado: ${formatDate(new Date().toISOString())}
Sistema: GameBoxService v1.0
`

    return content.trim()
  }

  // Generar formato para impresora Zebra (ZPL)
  const generateZebraZPL = () => {
    const zplContent = `
^XA
^LH0,0
^FO50,50^A0N,30,30^FDGameBoxService^FS
^FO50,90^A0N,20,20^FDComanda de Servicio^FS
^FO50,120^GB400,2,2^FS

^FO50,140^A0N,15,15^FDORDEN: ${order.order_number}^FS
^FO250,140^A0N,15,15^FDFECHA: ${formatDate(order.created_at).split(' ')[0]}^FS

^FO50,170^A0N,15,15^FDCLIENTE: ${customer.full_name}^FS
${customer.phone ? `^FO50,190^A0N,15,15^FDTEL: ${customer.phone}^FS` : ''}

^FO50,220^A0N,15,15^FDDISPOSITIVO: ${order.device_type}^FS
^FO50,260^A0N,15,15^FDMARCA: ${order.device_brand}^FS
^FO50,280^A0N,15,15^FDMODELO: ${order.device_model}^FS

^FO50,310^A0N,15,15^FDPROBLEMA:^FS
^FO50,330^A0N,12,12^FD${order.problem_description.substring(0, 40)}^FS
${order.problem_description.length > 40 ? `^FO50,350^A0N,12,12^FD${order.problem_description.substring(40, 80)}^FS` : ''}

^FO50,380^A0N,15,15^FDESTADO: ${getStatusDisplayName(order.status)}^FS
^FO250,380^A0N,15,15^FDSERIE: ${order.serial_number || 'N/A'}^FS

^FO50,420^GB400,2,2^FS
^FO50,440^A0N,12,12^FDConserve este ticket como comprobante^FS
^FO50,460^A0N,10,10^FD${formatDate(new Date().toISOString())}^FS

^XZ
`
    return zplContent.trim()
  }

  const printComanda = async () => {
    if (!selectedPrinter) {
      showErrorModal('Por favor selecciona una impresora')
      return
    }

    const printer = printers.find(p => p.id === selectedPrinter)
    if (!printer) {
      showErrorModal('Impresora no encontrada')
      return
    }

    setPrinting(true)

    try {
      // Generar contenido según el tipo de impresora
      let content = ''
      
      if (printer.type === 'zebra') {
        content = generateZebraZPL()
      } else {
        content = generateCommandaContent(printer)
      }

      // Simulación de impresión (aquí integrarías con la API real de impresión)
      if (printer.connectionType === 'network' && printer.ipAddress) {
        // Para impresoras de red, enviarías a la IP
        console.log(`Enviando a ${printer.ipAddress}:${printer.port}`, content)
      } else {
        // Para USB/Bluetooth, usarías APIs específicas del navegador o una app nativa
        console.log('Enviando a impresora local:', content)
      }

      // Simular tiempo de impresión
      await new Promise(resolve => setTimeout(resolve, 2000))

      showSuccessModal(`Comanda enviada a ${printer.name}. Verifica que se haya impreso correctamente.`)
      
      if (onPrint) {
        onPrint()
      }
    } catch (error) {
      showErrorModal(`Error al imprimir: ${error}`)
    }

    setPrinting(false)
  }

  const downloadComanda = () => {
    const printer = printers.find(p => p.id === selectedPrinter) || printers[0]
    if (!printer) return

    const content = printer?.type === 'zebra' 
      ? generateZebraZPL()
      : generateCommandaContent(printer)
    
    const fileName = `comanda_${order.order_number}_${Date.now()}.${printer.type === 'zebra' ? 'zpl' : 'txt'}`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  const previewContent = () => {
    const printer = printers.find(p => p.id === selectedPrinter) || printers[0]
    if (!printer) return ''

    return printer.type === 'zebra' 
      ? generateZebraZPL()
      : generateCommandaContent(printer)
  }

  if (printers.length === 0) {
    return (
      <div className="alert alert-warning">
        <Printer size={16} className="me-2" />
        No hay impresoras configuradas. Ve a Configuración para agregar una impresora.
      </div>
    )
  }

  return (
    <>
      {/* Modal Backdrop */}
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Imprimir Comanda</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body p-0">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-info text-white d-flex align-items-center">
                  <FileText size={20} className="me-2" />
                  <h6 className="mb-0">Orden #{order.order_number}</h6>
                </div>
      
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Seleccionar Impresora</label>
            <select
              className="form-select"
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
            >
              {printers.map((printer) => (
                <option key={printer.id} value={printer.id}>
                  {printer.name} ({printer.type.toUpperCase()}) 
                  {printer.isDefault ? ' - Por defecto' : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="col-md-6 d-flex align-items-end gap-2">
            <button
              className="btn btn-primary"
              onClick={printComanda}
              disabled={printing || !selectedPrinter}
            >
              {printing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Imprimiendo...
                </>
              ) : (
                <>
                  <Printer size={16} className="me-2" />
                  Imprimir
                </>
              )}
            </button>
            
            <button
              className="btn btn-outline-secondary"
              onClick={() => setShowPreview(true)}
              disabled={!selectedPrinter}
            >
              <Eye size={16} className="me-1" />
              Vista Previa
            </button>
            
            <button
              className="btn btn-outline-info"
              onClick={downloadComanda}
              disabled={!selectedPrinter}
            >
              <Download size={16} className="me-1" />
              Descargar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Vista Previa */}
      {showPreview && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Vista Previa - Comanda</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPreview(false)}
                />
              </div>
              <div className="modal-body">
                <pre className="bg-light p-3 rounded" style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '500px',
                  overflow: 'auto'
                }}>
                  {previewContent()}
                </pre>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowPreview(false)}
                >
                  Cerrar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowPreview(false)
                    printComanda()
                  }}
                  disabled={printing}
                >
                  <Printer size={16} className="me-1" />
                  Imprimir Ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Custom Modal */}
      <CustomModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CommandaPrint