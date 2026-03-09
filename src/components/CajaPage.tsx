import React, { useState } from 'react'
import { useServiceOrders } from '../hooks/useServiceOrders'
import { DollarSign, TrendingUp, Calendar } from 'lucide-react'
import type { ServiceOrder } from '../types'

type CajaFilter = 'today' | 'week' | 'lastweek' | 'month' | 'year' | 'custom'

const CajaPage: React.FC = () => {
  const { serviceOrders, loading } = useServiceOrders(true)
  const now = new Date()
  const [cajaFilter, setCajaFilter] = useState<CajaFilter>('today')
  const [cajaCustomMonth, setCajaCustomMonth] = useState<number>(now.getMonth())
  const [cajaCustomYear, setCajaCustomYear] = useState<number>(now.getFullYear())

  if (loading) {
    return (
      <div className="container-fluid px-3 px-md-4 py-3">
        <div className="text-center py-5">
          <div className="spinner-border text-success mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="text-muted">Cargando datos de caja...</p>
        </div>
      </div>
    )
  }

  const getDateRange = (): { start: Date; end: Date; label: string } => {
    const start = new Date()
    const end = new Date()

    if (cajaFilter === 'today') {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      return { start, end, label: 'Hoy' }
    }
    if (cajaFilter === 'week') {
      const day = now.getDay()
      const diffToMonday = day === 0 ? -6 : 1 - day
      start.setDate(now.getDate() + diffToMonday)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      return { start, end, label: 'Esta semana' }
    }
    if (cajaFilter === 'lastweek') {
      const day = now.getDay()
      const diffToMonday = day === 0 ? -6 : 1 - day
      start.setDate(now.getDate() + diffToMonday - 7)
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      const fmt = (d: Date) => d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
      return { start, end, label: `Semana pasada (${fmt(start)} – ${fmt(end)})` }
    }
    if (cajaFilter === 'month') {
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(now.getMonth() + 1, 0)
      end.setHours(23, 59, 59, 999)
      return { start, end, label: now.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }) }
    }
    if (cajaFilter === 'year') {
      start.setMonth(0, 1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(11, 31)
      end.setHours(23, 59, 59, 999)
      return { start, end, label: `Año ${now.getFullYear()}` }
    }
    // custom
    start.setFullYear(cajaCustomYear, cajaCustomMonth, 1)
    start.setHours(0, 0, 0, 0)
    end.setFullYear(cajaCustomYear, cajaCustomMonth + 1, 0)
    end.setHours(23, 59, 59, 999)
    const mesNombre = new Date(cajaCustomYear, cajaCustomMonth).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
    return { start, end, label: mesNombre }
  }

  const { start: rangeStart, end: rangeEnd, label: rangeLabel } = getDateRange()

  const filterFn = (o: ServiceOrder) => {
    const d = new Date(o.updated_at || o.created_at)
    return d >= rangeStart && d <= rangeEnd
  }

  const allDelivered = serviceOrders.filter(o => o.status === 'delivered' && filterFn(o))
  const filtered = allDelivered.filter(o => o.repair_cost != null && Number(o.repair_cost) > 0)
  const notRepaired = allDelivered.filter(o => o.repair_result === 'not_repaired').length

  const methods = ['efectivo', 'transferencia', 'tarjeta', 'otro'] as const
  const totals = methods.reduce((acc, m) => {
    acc[m] = filtered.filter(o => o.payment_method === m).reduce((s, o) => s + Number(o.repair_cost), 0)
    return acc
  }, {} as Record<string, number>)
  const grandTotal = filtered.reduce((s, o) => s + Number(o.repair_cost), 0)
  const avgTicket = filtered.length > 0 ? Math.round(grandTotal / filtered.length) : 0
  const topMethod = methods.find(m => totals[m] === Math.max(...methods.map(m2 => totals[m2])) && totals[m] > 0)
  const methodLabels: Record<string, string> = { efectivo: '💵 Efectivo', transferencia: '📱 Transferencia', tarjeta: '💳 Tarjeta', otro: '🔄 Otro' }
  const methodColors: Record<string, string> = { efectivo: 'success', transferencia: 'primary', tarjeta: 'info', otro: 'secondary' }

  const yearsAvailable = Array.from(new Set(serviceOrders.map(o => new Date(o.created_at).getFullYear()))).sort((a, b) => b - a)
  if (!yearsAvailable.includes(now.getFullYear())) yearsAvailable.unshift(now.getFullYear())
  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  const filterOptions: { value: CajaFilter; label: string }[] = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'lastweek', label: 'Semana pasada' },
    { value: 'month', label: 'Este mes' },
    { value: 'year', label: 'Este año' },
    { value: 'custom', label: 'Mes específico' },
  ]

  return (
    <div className="container-fluid px-3 px-md-4 py-3">
      {/* Encabezado de página */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
            <div className="card-body text-white p-3 p-md-4">
              <div className="row align-items-center">
                <div className="col-md-9">
                  <h1 className="h4 fw-bold mb-2">
                    <DollarSign size={24} className="me-2" />
                    Resumen de Caja
                  </h1>
                  <p className="mb-0 opacity-90">Control financiero de reparaciones cobradas</p>
                  <small className="opacity-75">Filtra por período para analizar ingresos</small>
                </div>
                <div className="col-md-3 text-end d-none d-md-block">
                  <TrendingUp size={60} className="opacity-25" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div>
                  <h6 className="mb-0 fw-semibold">Período seleccionado</h6>
                  <small className="text-muted">{rangeLabel}</small>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 'auto', minWidth: '165px' }}
                    value={cajaFilter}
                    onChange={e => setCajaFilter(e.target.value as CajaFilter)}
                  >
                    {filterOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {cajaFilter === 'custom' && (
                    <>
                      <select
                        className="form-select form-select-sm"
                        style={{ width: 'auto' }}
                        value={cajaCustomMonth}
                        onChange={e => setCajaCustomMonth(Number(e.target.value))}
                      >
                        {monthNames.map((m, i) => (
                          <option key={i} value={i}>{m}</option>
                        ))}
                      </select>
                      <select
                        className="form-select form-select-sm"
                        style={{ width: 'auto' }}
                        value={cajaCustomYear}
                        onChange={e => setCajaCustomYear(Number(e.target.value))}
                      >
                        {yearsAvailable.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center py-3">
              <div className="text-success mb-2"><DollarSign size={28} /></div>
              <h3 className="fw-bold mb-1 text-success">${grandTotal.toLocaleString('es-CL')}</h3>
              <small className="text-muted">Total recaudado</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center py-3">
              <div className="text-primary mb-2"><Calendar size={28} /></div>
              <h3 className="fw-bold mb-1 text-primary">{filtered.length}</h3>
              <small className="text-muted">Cobros realizados</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center py-3">
              <div className="text-info mb-2"><TrendingUp size={28} /></div>
              <h3 className="fw-bold mb-1 text-info">${avgTicket.toLocaleString('es-CL')}</h3>
              <small className="text-muted">Ticket promedio</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center py-3">
              <div className="text-warning mb-2"><DollarSign size={28} /></div>
              <h3 className="fw-bold mb-1 text-warning">{notRepaired} / {allDelivered.length}</h3>
              <small className="text-muted">Sin cobro / entregadas</small>
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5 text-muted">
                <DollarSign size={48} className="mb-3 opacity-25" />
                <h5 className="fw-semibold">Sin cobros en este período</h5>
                <p className="mb-0 small">{rangeLabel}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Desglose por método de pago */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-transparent border-0 py-3">
                  <h6 className="mb-0 fw-semibold">Desglose por método de pago</h6>
                </div>
                <div className="card-body pt-0">
                  <div className="row g-3">
                    {methods.map(m => {
                      const pct = grandTotal > 0 ? Math.round((totals[m] / grandTotal) * 100) : 0
                      const count = filtered.filter(o => o.payment_method === m).length
                      return (
                        <div key={m} className="col-6 col-md-3">
                          <div className={`card border-${methodColors[m]} border-opacity-25 h-100`}>
                            <div className="card-body py-3 px-3">
                              <div className="d-flex justify-content-between align-items-start mb-1">
                                <div className="fw-semibold small">{methodLabels[m]}</div>
                                {topMethod === m && (
                                  <span className="badge bg-success bg-opacity-10 text-success" style={{ fontSize: '0.65rem' }}>Top</span>
                                )}
                              </div>
                              <div className={`fw-bold fs-5 text-${methodColors[m]}`}>${totals[m].toLocaleString('es-CL')}</div>
                              <div className="d-flex justify-content-between mt-1">
                                <small className="text-muted">{count} venta{count !== 1 ? 's' : ''}</small>
                                <small className="text-muted fw-semibold">{pct}%</small>
                              </div>
                              <div className="progress mt-2" style={{ height: '5px' }}>
                                <div className={`progress-bar bg-${methodColors[m]}`} style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detalle de cobros */}
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-transparent border-0 py-3">
                  <h6 className="mb-0 fw-semibold">Detalle de cobros — {rangeLabel}</h6>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="border-0 fw-semibold ps-3">Orden</th>
                          <th className="border-0 fw-semibold">Cliente</th>
                          <th className="border-0 fw-semibold d-none d-md-table-cell">Dispositivo</th>
                          <th className="border-0 fw-semibold d-none d-sm-table-cell">Fecha</th>
                          <th className="border-0 fw-semibold">Método</th>
                          <th className="border-0 fw-semibold text-end pe-3">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered
                          .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
                          .map(o => (
                            <tr key={o.id}>
                              <td className="ps-3"><span className="text-primary fw-semibold small">#{o.order_number}</span></td>
                              <td><span className="fw-medium small">{o.customer?.full_name ?? '—'}</span></td>
                              <td className="d-none d-md-table-cell"><small className="text-muted">{o.device_brand} {o.device_model}</small></td>
                              <td className="d-none d-sm-table-cell">
                                <small className="text-muted">
                                  {new Date(o.updated_at || o.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </small>
                              </td>
                              <td>
                                <span className={`badge bg-${methodColors[o.payment_method as string] || 'secondary'} bg-opacity-10 text-${methodColors[o.payment_method as string] || 'secondary'} text-capitalize`}>
                                  {o.payment_method ?? '—'}
                                </span>
                              </td>
                              <td className="text-end pe-3">
                                <span className="fw-bold text-success">${Number(o.repair_cost).toLocaleString('es-CL')}</span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                      <tfoot className="table-light">
                        <tr>
                          <td colSpan={5} className="fw-bold text-end border-0 ps-3 d-none d-md-table-cell">Total ({filtered.length} cobros)</td>
                          <td colSpan={3} className="fw-bold text-end border-0 d-table-cell d-md-none">Total</td>
                          <td className="fw-bold text-success text-end border-0 pe-3">${grandTotal.toLocaleString('es-CL')}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default CajaPage
