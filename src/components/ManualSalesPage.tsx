import React, { useMemo, useState } from 'react'
import {
  Ban,
  Download,
  DollarSign,
  Eye,
  FileText,
  MessageCircle,
  Plus,
  Printer,
  Receipt,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import type { CompanySettings } from '../types'
import { useCompanySettings } from '../hooks'
import { useManualSales } from '../hooks/useManualSales'
import { useModal } from '../hooks/useModal'
import { CustomModal } from './ui/CustomModal'
import logoGamebox from '../assets/logo-gamebox.png'
import { printTicket as printTicketToQz } from '../services/qzPrinterService'
import type {
  CreateManualSaleInput,
  ManualSale,
  ManualSaleItemInput,
  ManualSalePaymentMethod,
  ManualSaleProductType,
} from '../domain/entities/ManualSale'

const productTypeLabels: Record<ManualSaleProductType, string> = {
  new_console: 'Consola nueva',
  used_console: 'Consola usada',
  accessory: 'Accesorio',
  other: 'Otro',
}

const paymentLabels: Record<ManualSalePaymentMethod, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  mixto: 'Mixto',
  otro: 'Otro',
}

const getTodayString = () => new Date().toISOString().slice(0, 10)

const defaultWarrantyObservations = 'Daños ocasionados por caídas, golpes, rayones, humedad, líquidos, sulfatación, polvo excesivo, presencia de insectos, recalentamiento por mala ventilación, rayos, descargas eléctricas, bajones o subidas de voltaje, uso de cargadores o cables no originales, conexiones inadecuadas, mala instalación, manipulación interna, apertura del equipo por terceros, reparaciones no autorizadas, modificación de software, desbloqueos, baneos de cuentas, pérdida de información, daños en juegos digitales, controles, cables, accesorios o partes.'

const getWarrantyTerms = (sale: ManualSale) => sale.observations || defaultWarrantyObservations

const calculateWarrantyEndDate = (startDate: string, months: number) => {
  const base = new Date(`${startDate || getTodayString()}T00:00:00`)
  base.setMonth(base.getMonth() + months)
  return base.toISOString().slice(0, 10)
}

const emptyItem = (): ManualSaleItemInput => ({
  product_type: 'accessory',
  product_name: '',
  description: '',
  serial_number: '',
  quantity: 1,
  unit_price: 0,
  discount: 0,
})

const initialWarrantyStartDate = getTodayString()

const initialForm: CreateManualSaleInput = {
  client: {
    full_name: '',
    cedula: '',
    phone: '',
    email: '',
    address: '',
  },
  items: [emptyItem()],
  warranty_start_date: initialWarrantyStartDate,
  warranty_days: 30,
  warranty_end_date: calculateWarrantyEndDate(initialWarrantyStartDate, 1),
  payment_method: 'efectivo',
  payment_detail: '',
  observations: defaultWarrantyObservations,
}

const formatMoney = (value: number | string | null | undefined) =>
  `$${Number(value || 0).toLocaleString('es-CO')}`

const formatCopInput = (value: number | string | null | undefined) =>
  Number(value || 0) > 0 ? Number(value || 0).toLocaleString('es-CO') : ''

const parseCopInput = (value: string) => {
  const numericValue = Number(value.replace(/\D/g, ''))
  return Number.isFinite(numericValue) ? numericValue : 0
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDateOnly = (value?: string | null) => {
  if (!value) return '—'
  const [year, month, day] = value.includes('T')
    ? new Date(value).toISOString().slice(0, 10).split('-')
    : value.split('-')

  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

const ManualSalesPage: React.FC = () => {
  const { settings } = useCompanySettings()
  const displayLogo = settings?.logo_url || logoGamebox
  const logoForPreview = displayLogo.includes('supabase')
    ? `${displayLogo.split('?')[0]}?t=${Date.now()}`
    : displayLogo
  const { sales, loading, saving, canCreate, canCancel, createSale, cancelSale, sendWhatsappTicket, totals } = useManualSales(true)
  const { modal, showError, showSuccess, showConfirm, closeModal } = useModal()
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list')
  const [form, setForm] = useState<CreateManualSaleInput>(initialForm)
  const [selectedSale, setSelectedSale] = useState<ManualSale | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [sendTicketWhatsapp, setSendTicketWhatsapp] = useState(false)
  const [sendingWhatsappId, setSendingWhatsappId] = useState<string | null>(null)
  const [warrantyMonths, setWarrantyMonths] = useState('1')
  const [showTicketModal, setShowTicketModal] = useState(false)

  const filteredSales = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()
    if (!search) return sales

    return sales.filter(sale =>
      sale.invoice_number?.toLowerCase().includes(search) ||
      sale.client_name?.toLowerCase().includes(search) ||
      sale.client_document?.toLowerCase().includes(search) ||
      sale.client_phone?.toLowerCase().includes(search)
    )
  }, [sales, searchTerm])

  const formTotals = useMemo(() => {
    const subtotal = form.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0)
    const discountTotal = form.items.reduce((sum, item) => sum + Number(item.discount || 0), 0)
    return {
      subtotal,
      discountTotal,
      total: Math.max(0, subtotal - discountTotal),
    }
  }, [form.items])

  const updateClient = (field: keyof CreateManualSaleInput['client'], value: string) => {
    setForm(prev => ({ ...prev, client: { ...prev.client, [field]: value } }))
  }

  const updateItem = (index: number, field: keyof ManualSaleItemInput, value: string | number) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  const addItem = () => {
    setForm(prev => ({ ...prev, items: [...prev.items, emptyItem()] }))
  }

  const removeItem = (index: number) => {
    setForm(prev => ({ ...prev, items: prev.items.length === 1 ? prev.items : prev.items.filter((_, itemIndex) => itemIndex !== index) }))
  }

  const handleWarrantyDuration = (months: number) => {
    const normalizedMonths = Number.isFinite(months) && months > 0 ? months : 0
    setWarrantyMonths(normalizedMonths > 0 ? String(normalizedMonths) : '')
    setForm(prev => ({
      ...prev,
      warranty_days: normalizedMonths * 30,
      warranty_end_date: normalizedMonths > 0 ? calculateWarrantyEndDate(prev.warranty_start_date || getTodayString(), normalizedMonths) : '',
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const sale = await createSale({ ...form, payment_detail: '', observations: defaultWarrantyObservations })
      setSelectedSale(sale)
      setForm(initialForm)
      setWarrantyMonths('1')
      setView('detail')
      setShowTicketModal(true)
      showSuccess('Venta registrada', `Factura ${sale.invoice_number} creada correctamente.`)

      if (sendTicketWhatsapp) {
        try {
          setSendingWhatsappId(sale.id)
          await sendWhatsappTicket(sale.id)
          showSuccess('WhatsApp enviado', 'Ticket enviado correctamente por WhatsApp.')
        } catch (whatsappError) {
          showError(
            'WhatsApp falló',
            whatsappError instanceof Error
              ? `La venta quedó guardada correctamente. ${whatsappError.message}`
              : 'La venta quedó guardada correctamente, pero no se pudo enviar el WhatsApp.'
          )
        } finally {
          setSendingWhatsappId(null)
          setSendTicketWhatsapp(false)
        }
      }
    } catch (err) {
      showError('No se pudo registrar', err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  const handleCancelSale = (sale: ManualSale) => {
    showConfirm(
      'Anular venta',
      `La factura ${sale.invoice_number} quedará anulada sin eliminarse. ¿Deseas continuar?`,
      async () => {
        try {
          await cancelSale(sale.id, cancelReason || 'Anulada por administrador')
          setCancelReason('')
          setSelectedSale(null)
          setView('list')
          showSuccess('Venta anulada', 'La venta fue anulada correctamente.')
        } catch (err) {
          showError('No se pudo anular', err instanceof Error ? err.message : 'Error desconocido')
        }
      }
    )
  }

  const saveTicketPdf = () => {
    if (!selectedSale) return

    const printWindow = window.open('', '_blank', 'width=420,height=800')
    if (!printWindow) {
      showError('No se pudo imprimir', 'El navegador bloqueó la ventana de impresión.')
      return
    }

    printWindow.document.write(buildSaleTicketPrintHtml({
      sale: selectedSale,
      companyName: settings?.company_name || 'GameBox Service',
      companyNit: (settings as CompanySettings & { nit?: string })?.nit || '',
      companyAddress: (settings as CompanySettings & { address?: string })?.address || 'Ingrese su dirección',
      companyPhone: (settings as CompanySettings & { phone?: string })?.phone || '+57 XXX XXX XXXX',
      logoUrl: logoForPreview,
    }))
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  const printTicket = async () => {
    if (!selectedSale) return

    try {
      await printTicketToQz({
        invoiceNumber: selectedSale.invoice_number,
        date: selectedSale.sale_date,
        sellerName: selectedSale.user?.full_name || selectedSale.user?.email?.split('@')[0] || 'Usuario',
        clientName: selectedSale.client_name,
        clientDocument: selectedSale.client_document,
        clientPhone: selectedSale.client_phone,
        paymentMethod: paymentLabels[selectedSale.payment_method],
        subtotal: selectedSale.subtotal,
        discount: selectedSale.discount_total,
        total: selectedSale.total,
        warrantyStartDate: selectedSale.warranty_start_date || undefined,
        warrantyEndDate: selectedSale.warranty_end_date || undefined,
        items: (selectedSale.items || []).map(item => ({
          name: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          discount: item.discount,
          subtotal: item.subtotal,
          serialNumber: item.serial_number || undefined,
          type: productTypeLabels[item.product_type],
        })),
      })
    } catch (err) {
      showError('No se pudo imprimir', err instanceof Error ? err.message : 'Error desconocido al imprimir con QZ Tray.')
    }
  }

  const openDetail = (sale: ManualSale) => {
    setSelectedSale(sale)
    setView('detail')
  }

  const handleSendWhatsappTicket = async (sale: ManualSale) => {
    try {
      setSendingWhatsappId(sale.id)
      await sendWhatsappTicket(sale.id)
      showSuccess('Ticket enviado', 'Ticket enviado correctamente por WhatsApp.')
    } catch (err) {
      showError('No se pudo enviar', err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSendingWhatsappId(null)
    }
  }

  if (loading) {
    return (
      <div className="container-fluid px-3 px-md-4 py-4 text-center">
        <div className="spinner-border text-primary mb-3" role="status" />
        <p className="text-muted">Cargando ventas manuales...</p>
      </div>
    )
  }

  return (
    <div className="manual-sales-page container-fluid px-3 px-md-4 py-3">
      <div className="manual-sales-screen">
        <div className="card border-0 shadow-sm mb-3" style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #198754 100%)' }}>
          <div className="card-body text-white p-3 p-md-4">
            <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
              <div>
                <h1 className="h4 fw-bold mb-1">Ventas Manuales</h1>
                <p className="mb-1 opacity-90">Factura productos sin afectar inventario</p>
                <small className="opacity-75">Consolas, accesorios y productos ingresados manualmente</small>
              </div>
              {canCreate && (
                <button className="btn btn-light align-self-md-start" onClick={() => setView('create')}>
                  <Plus size={16} className="me-2" />
                  Nueva Venta
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="row g-3 mb-3">
          <SummaryCard title="Ventas hoy" value={totals.todayCount.toString()} icon={Receipt} color="primary" />
          <SummaryCard title="Total vendido hoy" value={formatMoney(totals.todayTotal)} icon={DollarSign} color="success" />
          <SummaryCard title="Facturas activas" value={totals.activeCount.toString()} icon={FileText} color="info" />
        </div>

        {view === 'create' && canCreate ? (
          <form onSubmit={handleSubmit} className="manual-sale-create-form">
            <div className="manual-sale-panel manual-sale-client-section">
              <Section title="Datos del cliente">
                <div className="manual-sale-client-grid">
                  <div className="manual-sale-compact-field">
                    <label className="form-label small fw-semibold">
                      Nombre completo<span className="text-danger ms-1">*</span>
                    </label>
                    <input className="form-control" value={form.client.full_name} onChange={e => updateClient('full_name', e.target.value)} required />
                  </div>
                  <div className="manual-sale-compact-field">
                    <label className="form-label small fw-semibold">
                      Cédula o documento<span className="text-danger ms-1">*</span>
                    </label>
                    <input className="form-control" value={form.client.cedula} onChange={e => updateClient('cedula', e.target.value)} required />
                  </div>
                  <div className="manual-sale-compact-field">
                    <label className="form-label small fw-semibold">
                      Celular<span className="text-danger ms-1">*</span>
                    </label>
                    <input className="form-control" value={form.client.phone} onChange={e => updateClient('phone', e.target.value)} required />
                  </div>
                  <div className="manual-sale-compact-field">
                    <label className="form-label small fw-semibold">Correo</label>
                    <input type="email" className="form-control" value={form.client.email || ''} onChange={e => updateClient('email', e.target.value)} />
                  </div>
                  <div className="manual-sale-compact-field manual-sale-client-address">
                    <label className="form-label small fw-semibold">Dirección</label>
                    <input className="form-control" value={form.client.address || ''} onChange={e => updateClient('address', e.target.value)} />
                  </div>
                </div>
              </Section>
            </div>

              <div className="manual-sale-panel manual-sale-products-column">
                <Section
                  title="Productos"
                  action={(
                  <button type="button" className="btn btn-outline-primary btn-sm" onClick={addItem}>
                    <Plus size={14} className="me-1" />
                    Agregar producto
                  </button>
                  )}
                >
                <div className="d-flex flex-column gap-3">
                  {form.items.map((item, index) => {
                    const itemSubtotal = Math.max(0, Number(item.quantity || 0) * Number(item.unit_price || 0) - Number(item.discount || 0))
                    return (
                      <div className="manual-sale-item-row border rounded-3 p-3" key={index}>
                        <div className="manual-sale-item-grid">
                          <div className="manual-sale-item-field">
                            <label className="form-label small fw-semibold">Tipo</label>
                            <select className="form-select" value={item.product_type} onChange={e => updateItem(index, 'product_type', e.target.value as ManualSaleProductType)}>
                              {Object.entries(productTypeLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="manual-sale-item-field">
                            <label className="form-label small fw-semibold">
                              Nombre o referencia<span className="text-danger ms-1">*</span>
                            </label>
                            <input className="form-control" value={item.product_name} onChange={e => updateItem(index, 'product_name', e.target.value)} required />
                          </div>
                          <div className="manual-sale-item-field">
                            <label className="form-label small fw-semibold">Número de serie</label>
                            <input className="form-control" value={item.serial_number || ''} onChange={e => updateItem(index, 'serial_number', e.target.value)} />
                          </div>
                          <div className="manual-sale-item-field">
                            <label className="form-label small fw-semibold">Cantidad</label>
                            <input type="number" min="1" className="form-control" value={item.quantity} onChange={e => updateItem(index, 'quantity', Number(e.target.value))} />
                          </div>
                          <div className="manual-sale-item-field">
                            <label className="form-label small fw-semibold">Valor unitario</label>
                            <div className="input-group">
                              <span className="input-group-text">COP</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                className="form-control"
                                placeholder="200.000"
                                value={formatCopInput(item.unit_price)}
                                onFocus={e => e.currentTarget.select()}
                                onChange={e => updateItem(index, 'unit_price', parseCopInput(e.target.value))}
                              />
                            </div>
                          </div>
                          <div className="manual-sale-item-field">
                            <label className="form-label small fw-semibold">Descuento</label>
                            <div className="input-group">
                              <span className="input-group-text">COP</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                className="form-control"
                                placeholder="0"
                                value={formatCopInput(item.discount)}
                                onFocus={e => e.currentTarget.select()}
                                onChange={e => updateItem(index, 'discount', parseCopInput(e.target.value))}
                              />
                            </div>
                          </div>
                          <div className="manual-sale-item-field">
                            <label className="form-label small fw-semibold">Subtotal</label>
                            <div className="form-control bg-light fw-semibold">{formatMoney(itemSubtotal)}</div>
                          </div>
                          <div className="manual-sale-item-action">
                            <button type="button" className="btn btn-outline-danger w-100" onClick={() => removeItem(index)} disabled={form.items.length === 1} title="Eliminar producto">
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="manual-sale-item-description">
                            <label className="form-label small fw-semibold">Descripción</label>
                            <textarea className="form-control" rows={2} value={item.description || ''} onChange={e => updateItem(index, 'description', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Section>
              </div>

              <div className="manual-sale-panel manual-sale-payment-column">
                <Section title="Garantía y pago">
                <div className="manual-sale-payment-grid">
                  <div className="manual-sale-compact-field">
                    <label className="form-label small fw-semibold">Inicio de garantía</label>
                    <input type="text" className="form-control" value={formatDateOnly(form.warranty_start_date)} readOnly />
                  </div>
                  <div className="manual-sale-compact-field">
                    <label className="form-label small fw-semibold">Meses de garantía</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="form-control"
                      placeholder="Meses"
                      value={warrantyMonths}
                      onFocus={e => e.currentTarget.select()}
                      onChange={e => {
                        const value = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
                        setWarrantyMonths(value)
                        handleWarrantyDuration(Number(value))
                      }}
                    />
                  </div>
                  <div className="manual-sale-compact-field">
                    <label className="form-label small fw-semibold">Fin de garantía</label>
                    <input type="text" className="form-control" value={formatDateOnly(form.warranty_end_date)} readOnly />
                  </div>
                  <div className="manual-sale-compact-field">
                    <label className="form-label small fw-semibold">
                      Método de pago<span className="text-danger ms-1">*</span>
                    </label>
                    <select className="form-select" value={form.payment_method} onChange={e => setForm(prev => ({ ...prev, payment_method: e.target.value as ManualSalePaymentMethod }))}>
                      {Object.entries(paymentLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </Section>
              </div>

              <div className="card border-0 shadow-sm manual-sale-panel manual-sale-summary-card">
                <div className="card-header bg-white border-0">
                  <h5 className="mb-0">Resumen de venta</h5>
                </div>
                <div className="card-body">
                  <SummaryRow label="Subtotal" value={formatMoney(formTotals.subtotal)} />
                  <SummaryRow label="Descuento" value={formatMoney(formTotals.discountTotal)} />
                  <hr />
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold">Total a pagar</span>
                    <span className="h4 fw-bold text-success mb-0">{formatMoney(formTotals.total)}</span>
                  </div>
                  <div className="form-check mt-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="sendTicketWhatsapp"
                      checked={sendTicketWhatsapp}
                      onChange={e => setSendTicketWhatsapp(e.target.checked)}
                    />
                    <label className="form-check-label small fw-semibold" htmlFor="sendTicketWhatsapp">
                      Enviar ticket por WhatsApp
                    </label>
                    {!form.client.phone.trim() && (
                      <div className="small text-danger mt-1">El cliente debe tener celular.</div>
                    )}
                  </div>
                  <div className="d-grid gap-2 mt-4">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      <Save size={16} className="me-2" />
                      {saving || sendingWhatsappId ? 'Guardando...' : 'Guardar venta'}
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setView('list')}>
                      <X size={16} className="me-2" />
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
          </form>
        ) : view === 'detail' && selectedSale ? (
          <SaleDetail
            sale={selectedSale}
            canCancel={canCancel && selectedSale.status !== 'cancelled'}
            cancelReason={cancelReason}
            setCancelReason={setCancelReason}
            onBack={() => setView('list')}
            onShowTicket={() => setShowTicketModal(true)}
            onCancel={() => handleCancelSale(selectedSale)}
            onSendWhatsapp={() => handleSendWhatsappTicket(selectedSale)}
            sendingWhatsapp={sendingWhatsappId === selectedSale.id}
            canSendWhatsapp={canCreate}
          />
        ) : (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                <div>
                  <h5 className="mb-1">Facturas guardadas</h5>
                  <small className="text-muted">Consulta, reimprime o anula ventas anteriores</small>
                </div>
                <div className="position-relative" style={{ maxWidth: '360px', width: '100%' }}>
                  <Search size={16} className="position-absolute text-muted" style={{ left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input className="form-control ps-5" placeholder="Buscar factura, cliente o documento" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              {filteredSales.length === 0 ? (
                <div className="text-center py-5">
                  <Receipt size={42} className="text-muted mb-3" />
                  <h6 className="text-muted">No hay ventas manuales registradas</h6>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Factura</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Método</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.map(sale => (
                        <tr key={sale.id}>
                          <td className="fw-semibold">{sale.invoice_number}</td>
                          <td>
                            <div className="fw-medium">{sale.client_name}</div>
                            <small className="text-muted">{sale.client_document} · {sale.client_phone}</small>
                          </td>
                          <td><small>{formatDateTime(sale.sale_date)}</small></td>
                          <td>{paymentLabels[sale.payment_method]}</td>
                          <td className="fw-bold text-success">{formatMoney(sale.total)}</td>
                          <td>
                            <span className={`badge rounded-pill ${sale.status === 'cancelled' ? 'bg-danger' : 'bg-success'}`}>
                              {sale.status === 'cancelled' ? 'Anulada' : 'Activa'}
                            </span>
                          </td>
                          <td className="text-center">
                            <button className="btn btn-outline-primary btn-sm" onClick={() => openDetail(sale)} title="Ver detalle">
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <CustomModal
        {...modal}
        onClose={closeModal}
        onConfirm={modal.onConfirm ? () => {
          modal.onConfirm?.()
          closeModal()
        } : closeModal}
      />

      {showTicketModal && selectedSale && (
        <TicketModal
          sale={selectedSale}
          companyName={settings?.company_name || 'GameBox Service'}
          companyNit={(settings as CompanySettings & { nit?: string })?.nit || ''}
          companyAddress={(settings as CompanySettings & { address?: string })?.address || 'Ingrese su dirección'}
          companyPhone={(settings as CompanySettings & { phone?: string })?.phone || '+57 XXX XXX XXXX'}
          logoUrl={logoForPreview}
          onClose={() => setShowTicketModal(false)}
          onPrint={printTicket}
          onSavePdf={saveTicketPdf}
        />
      )}
    </div>
  )
}

interface SummaryCardProps {
  title: string
  value: string
  icon: React.ElementType
  color: 'primary' | 'success' | 'info'
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon: Icon, color }) => (
  <div className="col-md-4">
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body d-flex align-items-center">
        <div className={`bg-${color} bg-opacity-10 rounded-3 p-3 me-3`}>
          <Icon size={22} className={`text-${color}`} />
        </div>
        <div>
          <small className="text-muted">{title}</small>
          <div className="h4 fw-bold mb-0">{value}</div>
        </div>
      </div>
    </div>
  </div>
)

const Section: React.FC<{ title: string; action?: React.ReactNode; children: React.ReactNode }> = ({ title, action, children }) => (
  <div className="card border-0 shadow-sm mb-3">
    <div className="card-header bg-white border-0 py-3 d-flex align-items-center justify-content-between gap-2">
      <h5 className="mb-0">{title}</h5>
      {action}
    </div>
    <div className="card-body">{children}</div>
  </div>
)

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="d-flex justify-content-between mb-2">
    <span className="text-muted">{label}</span>
    <span className="fw-semibold">{value}</span>
  </div>
)

interface SaleDetailProps {
  sale: ManualSale
  canCancel: boolean
  cancelReason: string
  setCancelReason: (value: string) => void
  onBack: () => void
  onShowTicket: () => void
  onCancel: () => void
  onSendWhatsapp: () => void
  sendingWhatsapp: boolean
  canSendWhatsapp: boolean
}

const SaleDetail: React.FC<SaleDetailProps> = ({
  sale,
  canCancel,
  cancelReason,
  setCancelReason,
  onBack,
  onShowTicket,
  onCancel,
  onSendWhatsapp,
  sendingWhatsapp,
  canSendWhatsapp,
}) => (
  <>
    <div className="card border-0 shadow-sm mb-3 sale-detail-actions">
      <div className="card-body d-flex flex-column flex-md-row justify-content-between gap-2">
        <div>
          <h5 className="mb-1">Factura {sale.invoice_number}</h5>
          <small className="text-muted">Registrada por {sale.user?.full_name || 'Usuario'}</small>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-outline-secondary" onClick={onBack}>Volver</button>
          {canSendWhatsapp && (
            <button className="btn btn-success" onClick={onSendWhatsapp} disabled={sendingWhatsapp || sale.status === 'cancelled'}>
              <MessageCircle size={16} className="me-2" />
              {sendingWhatsapp ? 'Enviando...' : sale.whatsapp_logs?.length ? 'Reenviar ticket' : 'Enviar por WhatsApp'}
            </button>
          )}
          <button className="btn btn-primary" onClick={onShowTicket}>
            <Printer size={16} className="me-2" />
            Ver ticket
          </button>
        </div>
      </div>
    </div>

    <div className="row g-3">
      <div className="col-12">
        <WhatsappStatusCard sale={sale} />
        <div className="card border-0 shadow-sm mb-3 sale-detail-actions">
          <div className="card-body">
            <h6 className="fw-bold mb-3">Detalle de venta</h6>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Unitario</th>
                    <th>Desc.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(sale.items || []).map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="fw-semibold">{item.product_name}</div>
                        <small className="text-muted">{productTypeLabels[item.product_type]}{item.serial_number ? ` · SN ${item.serial_number}` : ''}</small>
                      </td>
                      <td>{item.quantity}</td>
                      <td>{formatMoney(item.unit_price)}</td>
                      <td>{Number(item.discount) > 0 ? formatMoney(item.discount) : '—'}</td>
                      <td className="fw-semibold">{formatMoney(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <SummaryRow label="Subtotal" value={formatMoney(sale.subtotal)} />
            <SummaryRow label="Descuento total" value={formatMoney(sale.discount_total)} />
            <hr />
            <div className="d-flex justify-content-between h4 fw-bold">
              <span>Total</span>
              <span className="text-success">{formatMoney(sale.total)}</span>
            </div>
          </div>
        </div>

        {canCancel && (
          <div className="card border-danger shadow-sm sale-detail-actions">
            <div className="card-body">
              <h6 className="text-danger fw-bold">Anular venta</h6>
              <textarea className="form-control mb-2" rows={2} placeholder="Motivo de anulación" value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
              <button className="btn btn-outline-danger" onClick={onCancel}>
                <Ban size={16} className="me-2" />
                Anular factura
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  </>
)

const WhatsappStatusCard: React.FC<{ sale: ManualSale }> = ({ sale }) => {
  const lastLog = sale.whatsapp_logs?.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

  if (!lastLog) {
    return (
      <div className="card border-0 shadow-sm mb-3 sale-detail-actions">
        <div className="card-body py-2 d-flex align-items-center text-muted small">
          <MessageCircle size={16} className="me-2" />
          Sin envíos de WhatsApp registrados.
        </div>
      </div>
    )
  }

  const statusConfig = {
    pending: { label: 'Pendiente', className: 'bg-warning text-dark' },
    sent: { label: 'Enviado', className: 'bg-success' },
    failed: { label: 'Fallido', className: 'bg-danger' },
  }[lastLog.status]

  return (
    <div className="card border-0 shadow-sm mb-3 sale-detail-actions">
      <div className="card-body py-2 d-flex flex-column flex-md-row justify-content-between gap-2">
        <div className="small">
          <MessageCircle size={16} className="me-2 text-success" />
          WhatsApp a {lastLog.phone}
          {lastLog.error_message && <span className="text-danger ms-2">{lastLog.error_message}</span>}
        </div>
        <span className={`badge ${statusConfig.className} align-self-start align-self-md-center`}>
          {statusConfig.label}
        </span>
      </div>
    </div>
  )
}

const escapeHtml = (value: string | number | null | undefined) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const buildSaleTicketPrintHtml = ({
  sale,
  companyName,
  companyNit,
  companyAddress,
  companyPhone,
  logoUrl,
}: {
  sale: ManualSale
  companyName: string
  companyNit: string
  companyAddress: string
  companyPhone: string
  logoUrl: string
}) => {
  const productsHtml = (sale.items || []).map(item => `
    <div class="ticket-item">
      <div class="ticket-row">
        <span>${escapeHtml(Number(item.quantity))} x ${escapeHtml(item.product_name)}</span>
        <strong>${escapeHtml(formatMoney(item.subtotal))}</strong>
      </div>
      <div class="muted">${escapeHtml(productTypeLabels[item.product_type])}</div>
      ${item.serial_number ? `<div class="muted">SN: ${escapeHtml(item.serial_number)}</div>` : ''}
      <div class="ticket-row muted"><span>Unitario</span><span>${escapeHtml(formatMoney(item.unit_price))}</span></div>
      ${Number(item.discount) > 0 ? `<div class="ticket-row muted"><span>Descuento</span><span>-${escapeHtml(formatMoney(item.discount))}</span></div>` : ''}
    </div>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ticket - ${escapeHtml(sale.invoice_number)}</title>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 80mm;
            background: #fff;
          }
          body {
            font-family: 'Arial Black', 'Arial Bold', Arial, sans-serif;
            font-size: 11px;
            line-height: 1.5;
            font-weight: 900;
            color: #000;
            padding: 2mm !important;
          }
          .ticket {
            width: 76mm;
            margin: 0 auto;
            padding: 2mm;
            background: #fff;
          }
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 3mm;
            margin-bottom: 3mm;
          }
          .logo {
            width: 50mm;
            height: 20mm;
            object-fit: contain;
            display: block;
            margin: 0 auto 2mm;
          }
          .title {
            font-weight: 900;
            font-size: 13px;
          }
          .section {
            border-bottom: 1px dashed #ccc;
            padding-bottom: 2mm;
            margin-bottom: 2mm;
            overflow-wrap: break-word;
          }
          .ticket-row {
            display: flex;
            justify-content: space-between;
            gap: 3mm;
            align-items: flex-start;
          }
          .ticket-row span:first-child { min-width: 0; overflow-wrap: anywhere; }
          .ticket-row strong,
          .ticket-row span:last-child { text-align: right; white-space: nowrap; }
          .muted {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10px;
            font-weight: 700;
          }
          .ticket-item { margin-bottom: 2mm; }
          .total { font-size: 12px; margin-top: 1mm; }
          .footer {
            text-align: center;
            border-top: 1px dashed #000;
            padding-top: 3mm;
            margin-top: 4mm;
            font-size: 9px;
          }
          .terms {
            margin-top: 1mm;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 8.5px;
            font-weight: 700;
            line-height: 1.25;
            text-align: justify;
            overflow-wrap: break-word;
          }
          @media print {
            html, body {
              width: 80mm;
              margin: 0 !important;
              padding: 0 !important;
            }
            @page {
              margin: 0;
              size: 80mm auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(companyName)}" class="logo">
            <div class="title">TICKET DE VENTA</div>
            ${companyNit ? `<div>NIT: ${escapeHtml(companyNit)}</div>` : ''}
            <div>SEDE: ${escapeHtml(sale.user?.sede || companyAddress)}</div>
            <div>TELÉFONO: ${escapeHtml(sale.user?.branch_phone || companyPhone)}</div>
          </div>
          <div class="section">
            <div><strong>FACTURA:</strong> ${escapeHtml(sale.invoice_number)}</div>
            <div><strong>FECHA:</strong> ${escapeHtml(formatDateTime(sale.sale_date))}</div>
            <div><strong>VENDEDOR:</strong> ${escapeHtml(sale.user?.full_name || 'Usuario')}</div>
          </div>
          <div class="section">
            <div><strong>CLIENTE:</strong> ${escapeHtml(sale.client_name)}</div>
            <div><strong>DOC:</strong> ${escapeHtml(sale.client_document)}</div>
            <div><strong>TEL:</strong> ${escapeHtml(sale.client_phone)}</div>
          </div>
          <div class="section">
            <div><strong>PRODUCTOS VENDIDOS:</strong></div>
            ${productsHtml}
          </div>
          <div class="section">
            <div class="ticket-row"><span>Subtotal</span><strong>${escapeHtml(formatMoney(sale.subtotal))}</strong></div>
            ${Number(sale.discount_total) > 0 ? `<div class="ticket-row"><span>Descuento</span><strong>-${escapeHtml(formatMoney(sale.discount_total))}</strong></div>` : ''}
            <div class="ticket-row total"><span>Total pagado</span><strong>${escapeHtml(formatMoney(sale.total))}</strong></div>
            <div class="ticket-row"><span>Pago</span><strong>${escapeHtml(paymentLabels[sale.payment_method])}</strong></div>
          </div>
          <div class="section">
            <div class="ticket-row"><span>Garantía inicia</span><strong>${escapeHtml(formatDateOnly(sale.warranty_start_date))}</strong></div>
            <div class="ticket-row"><span>Garantía final</span><strong>${escapeHtml(formatDateOnly(sale.warranty_end_date))}</strong></div>
            <div style="margin-top:2mm;"><strong>TÉRMINOS DE GARANTÍA:</strong></div>
            <div class="terms">${escapeHtml(getWarrantyTerms(sale))}</div>
          </div>
          <div class="footer">CONSERVE ESTE COMPROBANTE</div>
        </div>
      </body>
    </html>
  `
}

const Ticket: React.FC<{
  sale: ManualSale
  companyName: string
  companyNit: string
  companyAddress: string
  companyPhone: string
  logoUrl: string
}> = ({ sale, companyName, companyNit, companyAddress, companyPhone, logoUrl }) => (
  <div className="manual-sale-ticket card border-0 shadow-sm">
    <div className="card-body ticket-body">
      <div className="ticket-header text-center">
        <img src={logoUrl} alt={companyName} className="ticket-logo" />
        <h2>TICKET DE VENTA</h2>
        {companyNit && <div>NIT: {companyNit}</div>}
        <div>SEDE: {sale.user?.sede || companyAddress}</div>
        <div>TELÉFONO: {sale.user?.branch_phone || companyPhone}</div>
      </div>
      <div className="ticket-separator" />
      <div><strong>FACTURA:</strong> {sale.invoice_number}</div>
      <div><strong>FECHA:</strong> {formatDateTime(sale.sale_date)}</div>
      <div><strong>VENDEDOR:</strong> {sale.user?.full_name || 'Usuario'}</div>
      <div className="ticket-separator" />
      <div><strong>CLIENTE:</strong> {sale.client_name}</div>
      <div><strong>DOC:</strong> {sale.client_document}</div>
      <div><strong>TEL:</strong> {sale.client_phone}</div>
      <div className="ticket-separator" />
      <div><strong>PRODUCTOS VENDIDOS:</strong></div>
      {(sale.items || []).map(item => (
        <div className="ticket-item" key={item.id}>
          <div className="ticket-row">
            <span>{Number(item.quantity)} x {item.product_name}</span>
            <strong>{formatMoney(item.subtotal)}</strong>
          </div>
          <div className="ticket-muted">{productTypeLabels[item.product_type]}</div>
          {item.serial_number && <div className="ticket-muted">SN: {item.serial_number}</div>}
          <div className="ticket-row ticket-muted"><span>Unitario</span><span>{formatMoney(item.unit_price)}</span></div>
          {Number(item.discount) > 0 && (
            <div className="ticket-row ticket-muted"><span>Descuento</span><span>-{formatMoney(item.discount)}</span></div>
          )}
        </div>
      ))}
      <div className="ticket-separator" />
      <div className="ticket-row"><span>Subtotal</span><strong>{formatMoney(sale.subtotal)}</strong></div>
      {Number(sale.discount_total) > 0 && <div className="ticket-row"><span>Descuento</span><strong>-{formatMoney(sale.discount_total)}</strong></div>}
      <div className="ticket-row ticket-total"><span>Total pagado</span><strong>{formatMoney(sale.total)}</strong></div>
      <div className="ticket-row"><span>Pago</span><strong>{paymentLabels[sale.payment_method]}</strong></div>
      <div className="ticket-separator" />
      <div className="ticket-row"><span>Garantía inicia</span><strong>{formatDateOnly(sale.warranty_start_date)}</strong></div>
      <div className="ticket-row"><span>Garantía final</span><strong>{formatDateOnly(sale.warranty_end_date)}</strong></div>
      <div className="ticket-observations">
        <strong>TÉRMINOS DE GARANTÍA:</strong>
        <div>{getWarrantyTerms(sale)}</div>
      </div>
      <div className="ticket-separator" />
      <div className="ticket-footer">CONSERVE ESTE COMPROBANTE</div>
    </div>
  </div>
)

const TicketModal: React.FC<{
  sale: ManualSale
  companyName: string
  companyNit: string
  companyAddress: string
  companyPhone: string
  logoUrl: string
  onClose: () => void
  onPrint: () => void
  onSavePdf: () => void
}> = ({ sale, companyName, companyNit, companyAddress, companyPhone, logoUrl, onClose, onPrint, onSavePdf }) => (
  <div className="modal show d-block manual-sale-ticket-modal" tabIndex={-1} role="dialog">
    <div className="modal-backdrop show" onClick={onClose}></div>
    <div className="modal-dialog modal-dialog-centered manual-sale-ticket-dialog" role="document">
      <div className="modal-content border-0 shadow">
        <div className="modal-header manual-sale-ticket-modal-header border-0">
          <h5 className="modal-title fw-bold mb-0 d-flex align-items-center">
            <FileText size={22} className="me-2" />
            Vista Previa - Factura {sale.invoice_number}
          </h5>
          <button type="button" className="btn-close btn-close-white" aria-label="Cerrar" onClick={onClose}></button>
        </div>
        <div className="modal-body">
          <div className="mb-3">
            <div className="btn-group w-100" role="group">
              <button type="button" className="btn btn-primary">
                <FileText className="me-1" size={16} />
                Ticket de Venta
              </button>
            </div>
          </div>

          <div className="manual-sale-ticket-preview bg-light p-3 rounded mb-3">
            <Ticket
              sale={sale}
              companyName={companyName}
              companyNit={companyNit}
              companyAddress={companyAddress}
              companyPhone={companyPhone}
              logoUrl={logoUrl}
            />
          </div>

          <div className="d-flex gap-2 justify-content-center">
            <button type="button" className="btn btn-primary" onClick={onPrint}>
              <Printer size={16} className="me-1" />
              Imprimir Ticket
            </button>
            <button type="button" className="btn btn-success" onClick={onSavePdf}>
              <Download size={16} className="me-1" />
              Guardar PDF
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              <X size={16} className="me-1" />
              Cerrar
            </button>
          </div>
        </div>
        <div className="modal-footer border-0 d-none">
          <button type="button" className="btn btn-primary" onClick={onPrint}>
            <Printer size={16} className="me-2" />
            Imprimir ticket
          </button>
        </div>
      </div>
    </div>
  </div>
)

export default ManualSalesPage
