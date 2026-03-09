import React, { useState, useEffect } from 'react'
import { Printer, Settings, Monitor, Zap, Save, Plus, Trash2 } from 'lucide-react'
import { CustomModal } from './ui/CustomModal'

interface PrinterConfig {
  id: string
  name: string
  type: 'pos' | 'zebra' | 'thermal'
  connectionType: 'usb' | 'network' | 'bluetooth'
  ipAddress?: string
  port?: number
  isDefault: boolean
  paperWidth: number // en mm
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
}

const PrinterSettings: React.FC = () => {
  const [printers, setPrinters] = useState<PrinterConfig[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string>('')
  const [showAddPrinter, setShowAddPrinter] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  })

  const [newPrinter, setNewPrinter] = useState<Partial<PrinterConfig>>({
    name: '',
    type: 'pos',
    connectionType: 'usb',
    ipAddress: '',
    port: 9100,
    isDefault: false,
    paperWidth: 80,
    settings: {
      fontSize: 12,
      fontFamily: 'monospace',
      charset: 'utf-8',
      density: 8
    }
  })

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }))
  }

  const showSuccessModal = (message: string) => {
    setModal({
      isOpen: true,
      type: 'success',
      title: '¡Éxito!',
      message,
      onConfirm: closeModal
    })
  }

  const showErrorModal = (message: string) => {
    setModal({
      isOpen: true,
      type: 'error',
      title: 'Error',
      message,
      onConfirm: closeModal
    })
  }

  const showConfirmModal = (message: string, onConfirm: () => void) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Confirmar',
      message,
      onConfirm
    })
  }

  // Cargar configuración de impresoras desde localStorage
  useEffect(() => {
    const savedPrinters = localStorage.getItem('gameboxservice_printers')
    if (savedPrinters) {
      const printersData = JSON.parse(savedPrinters)
      setPrinters(printersData)
      
      // Encontrar impresora por defecto
      const defaultPrinter = printersData.find((p: PrinterConfig) => p.isDefault)
      if (defaultPrinter) {
        setSelectedPrinter(defaultPrinter.id)
      }
    }
  }, [])

  const savePrinters = (printersData: PrinterConfig[]) => {
    localStorage.setItem('gameboxservice_printers', JSON.stringify(printersData))
    setPrinters(printersData)
  }

  const addPrinter = () => {
    if (!newPrinter.name?.trim()) {
      showErrorModal('El nombre de la impresora es obligatorio')
      return
    }

    const printerId = `printer_${Date.now()}`
    const printer: PrinterConfig = {
      id: printerId,
      name: newPrinter.name.trim(),
      type: newPrinter.type!,
      connectionType: newPrinter.connectionType!,
      ipAddress: newPrinter.ipAddress,
      port: newPrinter.port,
      isDefault: printers.length === 0, // Primera impresora es por defecto
      paperWidth: newPrinter.paperWidth!,
      settings: newPrinter.settings!
    }

    const updatedPrinters = [...printers, printer]
    savePrinters(updatedPrinters)
    
    setNewPrinter({
      name: '',
      type: 'pos',
      connectionType: 'usb',
      ipAddress: '',
      port: 9100,
      isDefault: false,
      paperWidth: 80,
      settings: {
        fontSize: 12,
        fontFamily: 'monospace',
        charset: 'utf-8',
        density: 8
      }
    })
    
    setShowAddPrinter(false)
    showSuccessModal('Impresora agregada exitosamente')
  }

  const deletePrinter = (printerId: string) => {
    const updatedPrinters = printers.filter(p => p.id !== printerId)
    savePrinters(updatedPrinters)
    
    if (selectedPrinter === printerId) {
      setSelectedPrinter(updatedPrinters.length > 0 ? updatedPrinters[0].id : '')
    }
    
    showSuccessModal('Impresora eliminada exitosamente')
  }

  const setDefaultPrinter = (printerId: string) => {
    const updatedPrinters = printers.map(p => ({
      ...p,
      isDefault: p.id === printerId
    }))
    
    savePrinters(updatedPrinters)
    setSelectedPrinter(printerId)
    showSuccessModal('Impresora configurada como predeterminada')
  }

  const testPrinter = async (printer: PrinterConfig) => {
    setLoading(true)
    
    try {
      // Aquí implementarías la lógica de prueba según el tipo de impresora
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulación
      
      showSuccessModal(`Prueba enviada a ${printer.name}. Verifica que se haya impreso correctamente.`)
    } catch (error) {
      showErrorModal(`Error probando la impresora: ${error}`)
    }
    
    setLoading(false)
  }

  const getPrinterTypeIcon = (type: string) => {
    switch (type) {
      case 'pos':
        return <Monitor size={16} />
      case 'zebra':
        return <Zap size={16} />
      case 'thermal':
        return <Printer size={16} />
      default:
        return <Printer size={16} />
    }
  }

  const getPrinterTypeName = (type: string) => {
    switch (type) {
      case 'pos':
        return 'POS/Ticket'
      case 'zebra':
        return 'Zebra Desktop'
      case 'thermal':
        return 'Térmica'
      default:
        return type
    }
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-secondary text-white d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <Settings size={20} className="me-2" />
          <h5 className="mb-0">Configuración de Impresoras</h5>
        </div>
        <button
          className="btn btn-light btn-sm"
          onClick={() => setShowAddPrinter(true)}
        >
          <Plus size={16} className="me-1" />
          Agregar
        </button>
      </div>
      
      <div className="card-body">
        {printers.length === 0 ? (
          <div className="text-center py-4">
            <Printer size={48} className="text-muted mb-3" />
            <p className="text-muted mb-0">No hay impresoras configuradas</p>
            <small>Agrega una impresora para comenzar a imprimir comandas</small>
          </div>
        ) : (
          <div className="row">
            <div className="col-md-8">
              <h6 className="fw-semibold mb-3">Impresoras Disponibles</h6>
              <div className="list-group">
                {printers.map((printer) => (
                  <div
                    key={printer.id}
                    className={`list-group-item d-flex align-items-center justify-content-between ${
                      printer.isDefault ? 'border-primary' : ''
                    }`}
                  >
                    <div className="d-flex align-items-center">
                      {getPrinterTypeIcon(printer.type)}
                      <div className="ms-3">
                        <div className="d-flex align-items-center">
                          <strong>{printer.name}</strong>
                          {printer.isDefault && (
                            <span className="badge bg-primary ms-2">Por defecto</span>
                          )}
                        </div>
                        <small className="text-muted">
                          {getPrinterTypeName(printer.type)} • {printer.connectionType.toUpperCase()}
                          {printer.ipAddress && ` • ${printer.ipAddress}:${printer.port}`}
                          • {printer.paperWidth}mm
                        </small>
                      </div>
                    </div>
                    
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => testPrinter(printer)}
                        disabled={loading}
                        title="Probar impresora"
                      >
                        <Printer size={14} />
                      </button>
                      
                      {!printer.isDefault && (
                        <button
                          className="btn btn-outline-success"
                          onClick={() => setDefaultPrinter(printer.id)}
                          title="Establecer como predeterminada"
                        >
                          <Save size={14} />
                        </button>
                      )}
                      
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => showConfirmModal(
                          `¿Estás seguro de eliminar la impresora "${printer.name}"?`,
                          () => deletePrinter(printer.id)
                        )}
                        title="Eliminar impresora"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card bg-light">
                <div className="card-body">
                  <h6 className="fw-semibold mb-3">Seleccionar Impresora</h6>
                  <select
                    className="form-select"
                    value={selectedPrinter}
                    onChange={(e) => setSelectedPrinter(e.target.value)}
                  >
                    <option value="">Sin seleccionar</option>
                    {printers.map((printer) => (
                      <option key={printer.id} value={printer.id}>
                        {printer.name} ({getPrinterTypeName(printer.type)})
                      </option>
                    ))}
                  </select>
                  
                  {selectedPrinter && (
                    <div className="mt-3 text-center">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          const printer = printers.find(p => p.id === selectedPrinter)
                          if (printer) testPrinter(printer)
                        }}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" />
                            Probando...
                          </>
                        ) : (
                          <>
                            <Printer size={14} className="me-1" />
                            Probar Impresión
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulario para agregar impresora */}
        {showAddPrinter && (
          <div className="mt-4 p-3 border rounded bg-light">
            <h6 className="fw-semibold mb-3">Agregar Nueva Impresora</h6>
            
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Nombre de la Impresora</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Impresora Principal"
                  value={newPrinter.name || ''}
                  onChange={(e) => setNewPrinter({...newPrinter, name: e.target.value})}
                />
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Tipo de Impresora</label>
                <select
                  className="form-select"
                  value={newPrinter.type || 'pos'}
                  onChange={(e) => setNewPrinter({...newPrinter, type: e.target.value as any})}
                >
                  <option value="pos">POS/Ticket (58mm-80mm)</option>
                  <option value="zebra">Zebra Desktop (Etiquetas)</option>
                  <option value="thermal">Térmica (Recibos)</option>
                </select>
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Conexión</label>
                <select
                  className="form-select"
                  value={newPrinter.connectionType || 'usb'}
                  onChange={(e) => setNewPrinter({...newPrinter, connectionType: e.target.value as any})}
                >
                  <option value="usb">USB</option>
                  <option value="network">Red (IP)</option>
                  <option value="bluetooth">Bluetooth</option>
                </select>
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Ancho del Papel (mm)</label>
                <select
                  className="form-select"
                  value={newPrinter.paperWidth || 80}
                  onChange={(e) => setNewPrinter({...newPrinter, paperWidth: parseInt(e.target.value)})}
                >
                  <option value="58">58mm (POS pequeña)</option>
                  <option value="80">80mm (POS estándar)</option>
                  <option value="110">110mm (Zebra desktop)</option>
                </select>
              </div>
              
              {newPrinter.connectionType === 'network' && (
                <>
                  <div className="col-md-6">
                    <label className="form-label">Dirección IP</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="192.168.1.100"
                      value={newPrinter.ipAddress || ''}
                      onChange={(e) => setNewPrinter({...newPrinter, ipAddress: e.target.value})}
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label">Puerto</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="9100"
                      value={newPrinter.port || 9100}
                      onChange={(e) => setNewPrinter({...newPrinter, port: parseInt(e.target.value)})}
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="d-flex gap-2 mt-3">
              <button
                className="btn btn-primary"
                onClick={addPrinter}
              >
                <Plus size={16} className="me-1" />
                Agregar Impresora
              </button>
              
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddPrinter(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Custom Modal */}
      <CustomModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={modal.onConfirm || closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  )
}

export default PrinterSettings