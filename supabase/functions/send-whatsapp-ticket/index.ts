import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type ManualSale = {
  id: string
  invoice_number: string
  client_id: string
  user_id: string
  sale_date: string
  warranty_end_date: string | null
  subtotal: number
  discount_total: number
  total: number
  payment_method: string
  client_name: string
  client_document: string
  client_phone: string
  observations: string | null
  user?: { full_name: string | null; email: string | null }
  items?: Array<{
    product_type: string
    product_name: string
    serial_number: string | null
    quantity: number
    unit_price: number
    discount: number
    subtotal: number
  }>
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const productTypeLabels: Record<string, string> = {
  new_console: 'Consola nueva',
  used_console: 'Consola usada',
  accessory: 'Accesorio',
  other: 'Otro',
}

const formatMoney = (value: number | string | null | undefined) =>
  `$${Number(value || 0).toLocaleString('es-CO')}`

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const normalizeColombianPhone = (phone: string, countryCode: string) => {
  const digits = phone.replace(/\D/g, '')

  if (digits.length === 10 && digits.startsWith('3')) return `${countryCode}${digits}`
  if (digits.length === 12 && digits.startsWith(countryCode)) return digits
  if (digits.length === 13 && digits.startsWith(`00${countryCode}`)) return digits.slice(2)

  throw new Error('El número de WhatsApp no es válido.')
}

const escapePdfText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')

const createPdfBase64 = (sale: ManualSale, companyName: string) => {
  const lines = [
    companyName,
    `Factura: ${sale.invoice_number}`,
    `Fecha: ${new Date(sale.sale_date).toLocaleString('es-CO')}`,
    `Cliente: ${sale.client_name}`,
    `Documento: ${sale.client_document}`,
    `Celular: ${sale.client_phone}`,
    '',
    'Productos:',
    ...(sale.items || []).flatMap(item => [
      `${item.quantity} x ${item.product_name} (${productTypeLabels[item.product_type] || item.product_type})`,
      item.serial_number ? `SN: ${item.serial_number}` : '',
      `Unitario: ${formatMoney(item.unit_price)}  Subtotal: ${formatMoney(item.subtotal)}`,
      Number(item.discount) > 0 ? `Descuento: -${formatMoney(item.discount)}` : '',
    ]).filter(Boolean),
    '',
    `Subtotal: ${formatMoney(sale.subtotal)}`,
    `Descuento: ${formatMoney(sale.discount_total)}`,
    `Total: ${formatMoney(sale.total)}`,
    `Pago: ${sale.payment_method}`,
    `Garantía hasta: ${sale.warranty_end_date || 'No registrada'}`,
    `Vendedor: ${sale.user?.full_name || sale.user?.email || 'Usuario'}`,
    sale.observations ? `Observaciones: ${sale.observations}` : '',
  ].filter(Boolean)

  const content = [
    'BT',
    '/F1 10 Tf',
    '12 TL',
    '40 800 Td',
    ...lines.map((line, index) => `${index === 0 ? '' : 'T*'} (${escapePdfText(line)}) Tj`),
    'ET',
  ].join('\n')

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(pdf).length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = new TextEncoder().encode(pdf).length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  offsets.slice(1).forEach(offset => {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  const bytes = new TextEncoder().encode(pdf)
  let binary = ''
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const openWaEnabled = Deno.env.get('OPENWA_ENABLED') === 'true'
  const openWaBaseUrl = Deno.env.get('OPENWA_BASE_URL') || ''
  const openWaApiKey = Deno.env.get('OPENWA_API_KEY') || ''
  const openWaSessionId = Deno.env.get('OPENWA_SESSION_ID') || 'default'
  const countryCode = Deno.env.get('OPENWA_COUNTRY_CODE') || '57'
  const companyName = Deno.env.get('COMPANY_NAME') || 'GameBox Service'

  const authorization = req.headers.get('Authorization') || ''
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  })
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: authData, error: authError } = await userClient.auth.getUser()
  if (authError || !authData.user) return json({ error: 'Usuario no autenticado.' }, 401)

  const { manualSaleId } = await req.json().catch(() => ({ manualSaleId: null }))
  if (!manualSaleId) return json({ error: 'Venta manual requerida.' }, 400)

  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, role')
    .eq('id', authData.user.id)
    .single()

  if (!profile || !['admin', 'receptionist'].includes(profile.role)) {
    return json({ error: 'No tienes permisos para enviar tickets por WhatsApp.' }, 403)
  }

  const { data: sale, error: saleError } = await adminClient
    .from('manual_sales')
    .select('*, user:profiles!manual_sales_user_id_fkey(full_name,email), items:manual_sale_items(*)')
    .eq('id', manualSaleId)
    .single()

  if (saleError || !sale) return json({ error: 'Venta manual no encontrada.' }, 404)

  let logId: string | null = null

  try {
    if (!openWaEnabled) throw new Error('OpenWA no está habilitado.')
    if (!openWaBaseUrl) throw new Error('OPENWA_BASE_URL no está configurado.')
    if (!sale.client_phone) throw new Error('El cliente no tiene celular registrado.')

    const normalizedPhone = normalizeColombianPhone(sale.client_phone, countryCode)
    const chatId = `${normalizedPhone}@c.us`
    const message = `Hola ${sale.client_name}, gracias por su compra en GameBox. Adjuntamos su ticket de venta No. ${sale.invoice_number}. Garantía hasta ${sale.warranty_end_date || 'No registrada'}.`
    const ticketFileName = `ticket-${sale.invoice_number}.pdf`

    const { data: log, error: logError } = await adminClient
      .from('manual_sale_whatsapp_logs')
      .insert({
        manual_sale_id: sale.id,
        client_id: sale.client_id,
        user_id: authData.user.id,
        phone: normalizedPhone,
        chat_id: chatId,
        message,
        ticket_path: ticketFileName,
        status: 'pending',
      })
      .select()
      .single()

    if (logError) throw logError
    logId = log.id

    const headers = {
      'Content-Type': 'application/json',
      ...(openWaApiKey ? { Authorization: `Bearer ${openWaApiKey}` } : {}),
    }
    const signal = AbortSignal.timeout(15000)

    await fetch(`${openWaBaseUrl.replace(/\/$/, '')}/sendText`, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify({ sessionId: openWaSessionId, to: chatId, content: message }),
    }).then(async response => {
      if (!response.ok) throw new Error(`OpenWA rechazó el mensaje (${response.status}).`)
    })

    const pdfBase64 = createPdfBase64(sale as ManualSale, companyName)
    const fileResponse = await fetch(`${openWaBaseUrl.replace(/\/$/, '')}/sendFile`, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify({
        sessionId: openWaSessionId,
        to: chatId,
        filename: ticketFileName,
        mimetype: 'application/pdf',
        base64: pdfBase64,
        caption: `Ticket ${sale.invoice_number}`,
      }),
    })

    if (!fileResponse.ok) throw new Error(`OpenWA rechazó el PDF (${fileResponse.status}).`)
    const providerResponse = await fileResponse.json().catch(() => ({}))

    const { data: updatedLog } = await adminClient
      .from('manual_sale_whatsapp_logs')
      .update({
        status: 'sent',
        provider_message_id: providerResponse?.id || providerResponse?.messageId || null,
        sent_at: new Date().toISOString(),
      })
      .eq('id', logId)
      .select()
      .single()

    return json({ ok: true, log: updatedLog })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo enviar el ticket por WhatsApp.'

    if (logId) {
      await adminClient
        .from('manual_sale_whatsapp_logs')
        .update({ status: 'failed', error_message: message })
        .eq('id', logId)
    }

    return json({ error: message }, 200)
  }
})
