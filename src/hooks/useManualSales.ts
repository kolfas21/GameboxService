import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type {
  CreateManualSaleInput,
  ManualSale,
  ManualSaleItem,
  ManualSaleItemInput,
  ManualSalePaymentMethod,
} from '../domain/entities/ManualSale'
import type { Customer } from '../types'

const saleSelect = `
  *,
  client:customers(*),
  user:profiles!manual_sales_user_id_fkey(*),
  cancelled_by_user:profiles!manual_sales_cancelled_by_fkey(*),
  items:manual_sale_items(*),
  whatsapp_logs:manual_sale_whatsapp_logs(*)
`

const validPaymentMethods: ManualSalePaymentMethod[] = ['efectivo', 'transferencia', 'tarjeta', 'mixto', 'otro']

const toMoney = (value: unknown) => {
  const numberValue = Number(value ?? 0)
  return Number.isFinite(numberValue) ? Math.max(0, numberValue) : 0
}

const normalizeText = (value?: string | null) => value?.trim() || ''

const calculateItemSubtotal = (item: ManualSaleItemInput) => {
  const gross = toMoney(item.quantity) * toMoney(item.unit_price)
  const discount = toMoney(item.discount)
  return Math.max(0, gross - discount)
}

export const useManualSales = (autoLoad = true) => {
  const { user } = useAuth()
  const [sales, setSales] = useState<ManualSale[]>([])
  const [loading, setLoading] = useState(autoLoad)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canCreate = user?.role === 'admin' || user?.role === 'receptionist'
  const canCancel = user?.role === 'admin'

  const fetchSales = useCallback(async () => {
    if (!user) {
      setSales([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const { data, error: salesError } = await supabase
        .from('manual_sales')
        .select(saleSelect)
        .order('created_at', { ascending: false })

      if (salesError) throw salesError
      setSales((data || []) as ManualSale[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error cargando ventas manuales'
      setError(message)
      console.error('Error fetching manual sales:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  const findCustomer = useCallback(async (cedula: string, phone: string): Promise<Customer | null> => {
    const filters = [normalizeText(cedula) && `cedula.eq.${normalizeText(cedula)}`, normalizeText(phone) && `phone.eq.${normalizeText(phone)}`]
      .filter(Boolean)
      .join(',')

    if (!filters) return null

    const { data, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .or(filters)
      .limit(1)
      .maybeSingle()

    if (customerError) throw customerError
    return data as Customer | null
  }, [])

  const ensureCustomer = useCallback(async (input: CreateManualSaleInput['client']): Promise<Customer> => {
    if (input.id) {
      const { data, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', input.id)
        .single()

      if (customerError) throw customerError
      return data as Customer
    }

    const existing = await findCustomer(input.cedula, input.phone)
    if (existing) return existing

    const { data, error: createError } = await supabase
      .from('customers')
      .insert({
        cedula: normalizeText(input.cedula),
        full_name: normalizeText(input.full_name),
        phone: normalizeText(input.phone),
        email: normalizeText(input.email) || null,
      })
      .select()
      .single()

    if (createError) throw createError
    return data as Customer
  }, [findCustomer])

  const validateSale = useCallback((input: CreateManualSaleInput) => {
    if (!canCreate) throw new Error('No tienes permisos para crear ventas manuales.')
    if (!normalizeText(input.client.full_name)) throw new Error('El cliente debe tener nombre completo.')
    if (!normalizeText(input.client.cedula)) throw new Error('El cliente debe tener documento.')
    if (!normalizeText(input.client.phone)) throw new Error('El cliente debe tener celular.')
    if (!validPaymentMethods.includes(input.payment_method)) throw new Error('Método de pago inválido.')
    if (!input.items.length) throw new Error('La venta debe tener mínimo un producto.')

    input.items.forEach((item, index) => {
      const position = index + 1
      const quantity = Number(item.quantity)
      const unitPrice = Number(item.unit_price)
      const discount = Number(item.discount || 0)
      const gross = quantity * unitPrice

      if (!normalizeText(item.product_name)) throw new Error(`El producto ${position} debe tener nombre o referencia.`)
      if (!quantity || quantity <= 0) throw new Error(`La cantidad del producto ${position} debe ser mayor a cero.`)
      if (unitPrice < 0) throw new Error(`El valor unitario del producto ${position} no puede ser negativo.`)
      if (discount < 0) throw new Error(`El descuento del producto ${position} no puede ser negativo.`)
      if (discount > gross) throw new Error(`El descuento del producto ${position} no puede superar el subtotal.`)
    })
  }, [canCreate])

  const getSaleById = useCallback(async (id: string): Promise<ManualSale | null> => {
    const { data, error: saleError } = await supabase
      .from('manual_sales')
      .select(saleSelect)
      .eq('id', id)
      .maybeSingle()

    if (saleError) throw saleError
    return data as ManualSale | null
  }, [])

  const createSale = useCallback(async (input: CreateManualSaleInput): Promise<ManualSale> => {
    if (!user) throw new Error('Debes iniciar sesión para crear ventas.')
    validateSale(input)

    try {
      setSaving(true)
      setError(null)

      const customer = await ensureCustomer(input.client)
      const subtotal = input.items.reduce((sum, item) => sum + toMoney(item.quantity) * toMoney(item.unit_price), 0)
      const discountTotal = input.items.reduce((sum, item) => sum + toMoney(item.discount), 0)
      const total = input.items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0)

      if (total < 0) throw new Error('El total final no puede ser negativo.')

      const warrantyStartDate = input.warranty_start_date || new Date().toISOString().slice(0, 10)
      let warrantyEndDate = input.warranty_end_date || null

      if (!warrantyEndDate && input.warranty_days && input.warranty_days > 0) {
        const end = new Date(`${warrantyStartDate}T00:00:00`)
        end.setDate(end.getDate() + Number(input.warranty_days))
        warrantyEndDate = end.toISOString().slice(0, 10)
      }

      if (warrantyEndDate && warrantyEndDate < warrantyStartDate) {
        throw new Error('La fecha final de garantía no puede ser anterior a la fecha de venta.')
      }

      const { data: sale, error: saleError } = await supabase
        .from('manual_sales')
        .insert({
          client_id: customer.id,
          user_id: user.id,
          sale_date: new Date().toISOString(),
          warranty_type: normalizeText(input.warranty_type) || 'Tienda',
          warranty_start_date: warrantyStartDate,
          warranty_end_date: warrantyEndDate,
          warranty_days: input.warranty_days || null,
          subtotal,
          discount_total: discountTotal,
          total,
          payment_method: input.payment_method,
          payment_detail: normalizeText(input.payment_detail) || null,
          observations: normalizeText(input.observations) || null,
          client_name: customer.full_name,
          client_document: customer.cedula,
          client_phone: customer.phone || normalizeText(input.client.phone),
          client_email: customer.email || normalizeText(input.client.email) || null,
          client_address: normalizeText(input.client.address) || null,
        })
        .select()
        .single()

      if (saleError) throw saleError

      const itemsPayload = input.items.map(item => ({
        manual_sale_id: sale.id,
        product_type: item.product_type,
        product_name: normalizeText(item.product_name),
        description: normalizeText(item.description) || null,
        serial_number: normalizeText(item.serial_number) || null,
        quantity: toMoney(item.quantity),
        unit_price: toMoney(item.unit_price),
        discount: toMoney(item.discount),
        subtotal: calculateItemSubtotal(item),
        warranty_end_date: item.warranty_end_date || warrantyEndDate,
      }))

      const { error: itemsError } = await supabase
        .from('manual_sale_items')
        .insert(itemsPayload)

      if (itemsError) throw itemsError

      const created = await getSaleById(sale.id)
      if (!created) throw new Error('No se pudo cargar la venta registrada.')
      setSales(prev => [created, ...prev])
      return created
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error registrando venta manual'
      setError(message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [ensureCustomer, user, getSaleById, validateSale])


  const cancelSale = useCallback(async (saleId: string, reason: string) => {
    if (!user || !canCancel) throw new Error('Solo un administrador puede anular ventas.')
    if (!normalizeText(reason)) throw new Error('Debes escribir el motivo de anulación.')

    const { error: cancelError } = await supabase
      .from('manual_sales')
      .update({
        status: 'cancelled',
        cancelled_by: user.id,
        cancelled_at: new Date().toISOString(),
        cancel_reason: normalizeText(reason),
      })
      .eq('id', saleId)

    if (cancelError) throw cancelError
    await fetchSales()
  }, [canCancel, fetchSales, user])

  const sendWhatsappTicket = useCallback(async (saleId: string) => {
    if (!user || !canCreate) {
      throw new Error('No tienes permisos para enviar tickets por WhatsApp.')
    }

    const { data, error: sendError } = await supabase.functions.invoke('send-whatsapp-ticket', {
      body: { manualSaleId: saleId },
    })

    if (sendError) {
      throw new Error(sendError.message || 'No se pudo enviar el ticket por WhatsApp.')
    }

    if (data?.error) {
      throw new Error(data.error)
    }

    await fetchSales()
    return data
  }, [canCreate, fetchSales, user])

  const totals = useMemo(() => {
    const activeSales = sales.filter(sale => sale.status !== 'cancelled')
    const today = new Date().toDateString()
    const todaySales = activeSales.filter(sale => new Date(sale.sale_date || sale.created_at).toDateString() === today)
    return {
      activeCount: activeSales.length,
      todayCount: todaySales.length,
      todayTotal: todaySales.reduce((sum, sale) => sum + Number(sale.total || 0), 0),
      totalSold: activeSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0),
    }
  }, [sales])

  useEffect(() => {
    if (autoLoad) {
      fetchSales()
    }
  }, [autoLoad, fetchSales])

  return {
    sales,
    loading,
    saving,
    error,
    canCreate,
    canCancel,
    totals,
    fetchSales,
    createSale,
    getSaleById,
    cancelSale,
    sendWhatsappTicket,
  }
}

export type { ManualSale, ManualSaleItem }
