import React, { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  PlugZap,
  Printer,
  Receipt,
  RefreshCw,
  Save,
  Tags
} from 'lucide-react'
import { CustomModal } from './ui/CustomModal'
import {
  connectQzTray,
  getPrinters,
  isQzConnected,
  printTestSticker,
  printTestTicket,
  getBranchPrinterSettings,
  saveBranchPrinterSettings
} from '../services/qzPrinterService'
import { useAuth } from '../contexts/AuthContext'

interface ModalState {
  isOpen: boolean
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm'
  title: string
  message: string
  onConfirm?: () => void
}

const PrinterSettings: React.FC = () => {
  const { user } = useAuth()
  const branch = user?.sede || 'Parque Caldas'

  const [connected, setConnected] = useState(false)
  const [printers, setPrinters] = useState<string[]>([])
  const [qzEnabled, setQzEnabled] = useState(true)
  const [ticketPrinter, setTicketPrinter] = useState('')
  const [stickerPrinter, setStickerPrinter] = useState('')
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState<'ticket' | 'sticker' | null>(null)
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  })

  useEffect(() => {
    setConnected(isQzConnected())
    const settings = getBranchPrinterSettings(user?.sede)
    setQzEnabled(settings.qzEnabled)
    setTicketPrinter(settings.ticketPrinter || '')
    setStickerPrinter(settings.stickerPrinter || '')
  }, [user?.sede])

  const handleToggleQz = (checked: boolean) => {
    setQzEnabled(checked)
    saveBranchPrinterSettings(user?.sede, { qzEnabled: checked })
  }

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }))

  const showMessage = (type: ModalState['type'], title: string, message: string) => {
    setModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm: closeModal
    })
  }

  const handleConnect = async () => {
    setLoading(true)

    try {
      await connectQzTray()
      setConnected(true)
      showMessage('success', 'QZ Tray conectado', 'La aplicación ya puede leer las impresoras instaladas en este computador.')
    } catch (error) {
      setConnected(false)
      showMessage('error', 'No se pudo conectar QZ Tray', error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }

  const handleSearchPrinters = async () => {
    setLoading(true)

    try {
      const localPrinters = await getPrinters()
      setPrinters(localPrinters)
      setConnected(true)

      if (localPrinters.length === 0) {
        showMessage('warning', 'Sin impresoras', 'QZ Tray respondió correctamente, pero no encontró impresoras instaladas en Windows.')
      } else {
        showMessage('success', 'Impresoras encontradas', `Se encontraron ${localPrinters.length} impresora(s) en este computador.`)
      }
    } catch (error) {
      setConnected(false)
      showMessage('error', 'Error buscando impresoras', error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    try {
      if (!ticketPrinter && !stickerPrinter) {
        showMessage('warning', 'Selecciona una impresora', 'Debes seleccionar al menos una impresora para guardar la configuración.')
        return
      }

      saveBranchPrinterSettings(user?.sede, {
        ticketPrinter: ticketPrinter || undefined,
        stickerPrinter: stickerPrinter || undefined
      })

      showMessage('success', 'Configuración guardada', 'Las impresoras quedaron guardadas en este navegador y computador.')
    } catch (error) {
      showMessage('error', 'Error guardando configuración', error instanceof Error ? error.message : String(error))
    }
  }

  const handleTestTicket = async () => {
    setTesting('ticket')

    try {
      if (ticketPrinter) saveBranchPrinterSettings(user?.sede, { ticketPrinter })
      await printTestTicket(user?.sede)
      showMessage('success', 'Prueba enviada', 'Se envió un ticket de prueba a la impresora configurada.')
    } catch (error) {
      showMessage('error', 'Error imprimiendo ticket', error instanceof Error ? error.message : String(error))
    } finally {
      setTesting(null)
    }
  }

  const handleTestSticker = async () => {
    setTesting('sticker')

    try {
      if (stickerPrinter) saveBranchPrinterSettings(user?.sede, { stickerPrinter })
      await printTestSticker(user?.sede)
      showMessage('success', 'Prueba enviada', 'Se envió un sticker de prueba a la impresora configurada.')
    } catch (error) {
      showMessage('error', 'Error imprimiendo sticker', error instanceof Error ? error.message : String(error))
    } finally {
      setTesting(null)
    }
  }

  const renderSelect = (
    value: string,
    onChange: (value: string) => void,
    label: string,
    icon: React.ReactNode
  ) => (
    <div className="p-3 rounded border bg-light h-100">
      <label className="form-label fw-semibold d-flex align-items-center gap-2">
        {icon}
        {label}
      </label>
      <select
        className="form-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Sin seleccionar</option>
        {printers.map((printerName) => (
          <option key={printerName} value={printerName}>
            {printerName}
          </option>
        ))}
        {value && !printers.includes(value) && (
          <option value={value}>
            {value} (guardada)
          </option>
        )}
      </select>
    </div>
  )

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-secondary text-white d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
        <div className="d-flex align-items-center">
          <Printer size={20} className="me-2" />
          <h5 className="mb-0">Configuración de impresoras</h5>
        </div>

        <span className={`badge rounded-pill d-inline-flex align-items-center gap-1 ${connected ? 'bg-success' : 'bg-danger'}`}>
          {connected ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {connected ? 'QZ conectado' : 'QZ no conectado'}
        </span>
      </div>

      <div className="card-body">
        <div className="alert alert-info mb-4">
          <strong>Opcional:</strong> Esta configuración aplica solo para este computador si deseas impresión directa. Si QZ Tray no está configurado o conectado, el sistema seguirá permitiendo imprimir manualmente desde el navegador de forma transparente.
        </div>

        <div className="form-check form-switch mb-4 bg-light p-3 rounded border d-flex align-items-center">
          <input 
            className="form-check-input mt-0 me-3 fs-4" 
            type="checkbox" 
            id="qzEnabledToggle"
            checked={qzEnabled}
            onChange={(e) => handleToggleQz(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <label className="form-check-label fw-bold d-flex flex-column mb-0" htmlFor="qzEnabledToggle" style={{ cursor: 'pointer' }}>
            <span>Usar QZ Tray en esta sucursal</span>
            <small className="text-muted fw-normal">Sucursal actual: {branch}</small>
          </label>
        </div>

        <div className={`row g-3 mb-4 ${!qzEnabled ? 'opacity-50' : ''}`}>
          <div className="col-12 col-md-6">
            {renderSelect(ticketPrinter, setTicketPrinter, 'Impresora para tickets/facturas', <Receipt size={18} />)}
          </div>
          <div className="col-12 col-md-6">
            {renderSelect(stickerPrinter, setStickerPrinter, 'Impresora para stickers/etiquetas', <Tags size={18} />)}
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-12 col-lg-6">
            <div className="p-3 rounded border h-100">
              <h6 className="fw-semibold mb-2">Impresoras guardadas</h6>
              <div className="small text-muted">
                <div><strong>Tickets:</strong> {ticketPrinter || 'Sin configurar'}</div>
                <div><strong>Stickers:</strong> {stickerPrinter || 'Sin configurar'}</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="p-3 rounded border h-100">
              <h6 className="fw-semibold mb-2">Impresoras detectadas</h6>
              <div className="small text-muted">
                {printers.length > 0 ? `${printers.length} impresora(s) disponibles en este PC.` : 'Busca impresoras para cargar el listado local.'}
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={handleConnect}
            disabled={loading}
          >
            <PlugZap size={16} className="me-2" />
            Conectar QZ Tray
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={handleSearchPrinters}
            disabled={loading}
          >
            <RefreshCw size={16} className="me-2" />
            Buscar impresoras
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
          >
            <Save size={16} className="me-2" />
            Guardar configuración
          </button>

          <button
            type="button"
            className="btn btn-success"
            onClick={handleTestTicket}
            disabled={testing !== null}
          >
            <Receipt size={16} className="me-2" />
            {testing === 'ticket' ? 'Probando...' : 'Probar ticket'}
          </button>

          <button
            type="button"
            className="btn btn-success"
            onClick={handleTestSticker}
            disabled={testing !== null}
          >
            <Tags size={16} className="me-2" />
            {testing === 'sticker' ? 'Probando...' : 'Probar sticker'}
          </button>
        </div>
      </div>

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
