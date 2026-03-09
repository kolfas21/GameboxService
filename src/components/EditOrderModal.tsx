import React, { useState } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'
import type { ServiceOrder } from '../types'

interface EditOrderModalProps {
  order: ServiceOrder
  onClose: () => void
  onSave: (orderId: string, updates: Partial<ServiceOrder>) => Promise<boolean>
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    device_type: order.device_type,
    device_brand: order.device_brand,
    device_model: order.device_model,
    serial_number: order.serial_number || '',
    problem_description: order.problem_description,
    observations: order.observations || '',
    status: order.status,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const updates = {
        ...formData,
        updated_at: new Date().toISOString()
      }

      const success = await onSave(order.id, updates)
      if (success) {
        onClose()
      } else {
        setError('Error al actualizar la orden')
      }
    } catch (err) {
      setError('Error inesperado al actualizar la orden')
      console.error('Error updating order:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              Editar Orden #{order.order_number}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger d-flex align-items-center">
                  <AlertCircle size={16} className="me-2" />
                  {error}
                </div>
              )}

              {/* Información del cliente (solo lectura) */}
              <div className="mb-4">
                <h6 className="text-muted mb-3">Información del Cliente</h6>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Cliente</label>
                      <input
                        type="text"
                        className="form-control"
                        value={order.customer?.full_name || 'N/A'}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Cédula</label>
                      <input
                        type="text"
                        className="form-control"
                        value={order.customer?.cedula || 'N/A'}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del dispositivo */}
              <div className="mb-4">
                <h6 className="text-muted mb-3">Información del Dispositivo</h6>
                <div className="row">
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="device_type" className="form-label">Tipo de Dispositivo *</label>
                      <select
                        id="device_type"
                        name="device_type"
                        className="form-select"
                        value={formData.device_type}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Selecciona el tipo</option>
                        <option value="Consola">Consola</option>
                        <option value="Control">Control</option>
                        <option value="Accesorio">Accesorio</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="device_brand" className="form-label">Marca *</label>
                      <select
                        id="device_brand"
                        name="device_brand"
                        className="form-select"
                        value={formData.device_brand}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Selecciona la marca</option>
                        <option value="PlayStation">PlayStation</option>
                        <option value="Xbox">Xbox</option>
                        <option value="Nintendo">Nintendo</option>
                        <option value="PC">PC</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="device_model" className="form-label">Modelo *</label>
                      <input
                        type="text"
                        id="device_model"
                        name="device_model"
                        className="form-control"
                        value={formData.device_model}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="serial_number" className="form-label">Número de Serie</label>
                      <input
                        type="text"
                        id="serial_number"
                        name="serial_number"
                        className="form-control"
                        value={formData.serial_number}
                        onChange={handleChange}
                        placeholder="Número de serie del dispositivo"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Estado */}
              <div className="mb-4">
                <h6 className="text-muted mb-3">Estado de la Orden</h6>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="status" className="form-label">Estado *</label>
                      <select
                        id="status"
                        name="status"
                        className="form-select"
                        value={formData.status}
                        onChange={handleChange}
                        required
                      >
                        <option value="pending">Pendiente</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="completed">Completada</option>
                        <option value="delivered">Entregada</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descripción del problema */}
              <div className="mb-4">
                <h6 className="text-muted mb-3">Información del Problema</h6>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="problem_description" className="form-label">Descripción del Problema *</label>
                    <textarea
                      id="problem_description"
                      name="problem_description"
                      className="form-control"
                      rows={4}
                      placeholder="Describe el problema reportado..."
                      value={formData.problem_description}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label htmlFor="observations" className="form-label">Observaciones</label>
                    <textarea
                      id="observations"
                      name="observations"
                      className="form-control"
                      rows={4}
                      placeholder="Observaciones adicionales..."
                      value={formData.observations}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                <X size={16} className="me-1" />
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={16} className="me-1" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditOrderModal