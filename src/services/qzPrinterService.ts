import * as qz from 'qz-tray'
import { supabaseConfig } from '../config/supabase'

export type PrinterType = 'ticket' | 'sticker'

export interface TicketItemPrintData {
  name: string
  quantity?: number
  unitPrice?: number
  discount?: number
  subtotal?: number
  serialNumber?: string
  type?: string
}

export interface TicketPrintData {
  invoiceNumber?: string
  date?: string | Date
  sellerName?: string
  clientName?: string
  clientDocument?: string
  clientPhone?: string
  paymentMethod?: string
  subtotal?: number
  discount?: number
  total?: number
  warrantyStartDate?: string | Date
  warrantyEndDate?: string | Date
  warrantyTerms?: string
  items?: TicketItemPrintData[]
}

export interface StickerPrintData {
  productName: string
  code?: string
  serialNumber?: string
  warranty?: string
  purchaseDate?: string | Date
  warrantyEndDate?: string | Date
  price?: number
}

export interface ServiceComandaPrintData {
  orderNumber: string
  createdAt?: string | Date
  branchName?: string
  branchPhone?: string
  receivedBy?: string
  clientName: string
  clientPhone?: string | null
  deviceType?: string
  deviceBrand?: string
  deviceModel?: string
  serialNumber?: string | null
  problemDescription?: string
  observations?: string | null
  status?: string
  completedBy?: string
  completionNotes?: string | null
}

const PRINTER_KEYS: Record<PrinterType, string> = {
  ticket: 'gamebox_ticket_printer',
  sticker: 'gamebox_sticker_printer'
}

const ESC = '\x1B'
const GS = '\x1D'
const QZ_SECURITY_ENDPOINT = `${supabaseConfig.url}/functions/v1/qz-security`

let securityConfigured = false

const formatMoney = (value?: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

const formatDateTime = (value?: string | Date) => {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatDate = (value?: string | Date) => {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

const normalizeError = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Error desconocido al comunicarse con QZ Tray.'
}

const center = (text: string) => `${ESC}a\x01${text}\n`
const left = (text: string) => `${ESC}a\x00${text}\n`
const separator = () => left('--------------------------------')
const cut = () => `${GS}V\x00`

const buildLine = (label: string, value?: string | number) => {
  const cleanValue = value === undefined || value === null ? '' : String(value)
  return left(`${label}: ${cleanValue}`)
}

const getQzSecurityHeaders = () => ({
  Authorization: `Bearer ${supabaseConfig.anonKey}`,
  apikey: supabaseConfig.anonKey,
  'Content-Type': 'application/json'
})

export const setupQzSecurity = () => {
  if (securityConfigured) return

  qz.security.setCertificatePromise((resolve, reject) => {
    fetch(`${QZ_SECURITY_ENDPOINT}/certificate`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${supabaseConfig.anonKey}`,
        apikey: supabaseConfig.anonKey
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('No se encontró el certificado de QZ Tray.')
        }
        return response.text()
      })
      .then((certificate) => {
        if (!certificate.trim()) {
          throw new Error('No se encontró el certificado de QZ Tray.')
        }
        resolve(certificate)
      })
      .catch(reject)
  })

  qz.security.setSignatureAlgorithm('SHA512')
  qz.security.setSignaturePromise((toSign: string) => {
    return (resolve, reject) => {
      fetch(`${QZ_SECURITY_ENDPOINT}/sign`, {
        method: 'POST',
        headers: getQzSecurityHeaders(),
        body: JSON.stringify({ request: toSign })
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('No se pudo firmar la solicitud de impresión. Revisa la configuración QZ_PRIVATE_KEY en Supabase.')
          }
          return response.json()
        })
        .then((data) => {
          if (!data?.signature) {
            throw new Error('El backend no devolvió la firma de QZ Tray.')
          }
          resolve(data.signature)
        })
        .catch(reject)
    }
  })

  securityConfigured = true
}

export const connectQzTray = async () => {
  try {
    setupQzSecurity()
    if (qz.websocket.isActive()) return true
    await qz.websocket.connect()
    return true
  } catch (error) {
    throw new Error(
      `QZ Tray no está abierto. Ábrelo en el computador de producción e intenta nuevamente. Detalle: ${normalizeError(error)}`
    )
  }
}

export const isQzConnected = () => qz.websocket.isActive()

export const getPrinters = async () => {
  await connectQzTray()

  try {
    const printers = await qz.printers.find()
    return Array.isArray(printers) ? printers : [printers]
  } catch (error) {
    throw new Error(`No fue posible obtener las impresoras instaladas. Detalle: ${normalizeError(error)}`)
  }
}

export const savePrinter = (type: PrinterType, printerName: string) => {
  if (!printerName.trim()) {
    throw new Error('Selecciona una impresora antes de guardar.')
  }

  localStorage.setItem(PRINTER_KEYS[type], printerName)
}

export const getSavedPrinter = (type: PrinterType) => localStorage.getItem(PRINTER_KEYS[type]) || ''

const ensureConfiguredPrinter = async (type: PrinterType) => {
  const printerName = getSavedPrinter(type)

  if (!printerName) {
    throw new Error(type === 'ticket'
      ? 'No hay impresora de tickets configurada para este computador.'
      : 'No hay impresora de stickers configurada para este computador.')
  }

  await connectQzTray()

  return printerName
}

const printRaw = async (printerName: string, data: string[]) => {
  try {
    const config = qz.configs.create(printerName, {
      encoding: 'UTF-8',
      jobName: 'GameBox Service'
    })

    await qz.print(config as any, data)
  } catch (error) {
    throw new Error(`No fue posible imprimir en "${printerName}". Detalle: ${normalizeError(error)}`)
  }
}

const printHtml = async (printerName: string, html: string, jobName: string) => {
  try {
    const config = qz.configs.create(printerName, {
      jobName,
      units: 'mm',
      margins: 0,
      size: {
        width: 80
      }
    })

    await qz.print(config as any, [{
      type: 'pixel',
      format: 'html',
      flavor: 'plain',
      data: html
    }])
  } catch (error) {
    throw new Error(`No fue posible imprimir en "${printerName}". Detalle: ${normalizeError(error)}`)
  }
}

export const printTicketHtml = async (html: string) => {
  const printerName = await ensureConfiguredPrinter('ticket')
  await printHtml(printerName, html, 'GameBox Ticket')
}

export const printStickerHtml = async (html: string) => {
  const printerName = await ensureConfiguredPrinter('sticker')
  await printHtml(printerName, html, 'GameBox Sticker')
}

export const printTestTicket = async () => {
  const printerName = await ensureConfiguredPrinter('ticket')
  const now = formatDateTime()

  await printRaw(printerName, [
    `${ESC}@`,
    center('GAMEBOX'),
    center('PRUEBA DE IMPRESION'),
    separator(),
    buildLine('Tipo', 'Ticket'),
    buildLine('Fecha', now),
    buildLine('Impresora', printerName),
    separator(),
    center('Configuracion correcta'),
    '\n\n',
    cut()
  ])
}

export const printTestSticker = async () => {
  const printerName = await ensureConfiguredPrinter('sticker')

  await printRaw(printerName, [
    `${ESC}@`,
    center('GAMEBOX'),
    center('PRUEBA STICKER'),
    separator(),
    buildLine('Producto', 'Consola prueba'),
    buildLine('Garantia', '3 meses'),
    buildLine('Fecha', formatDate()),
    separator(),
    center('Sticker configurado'),
    '\n\n',
    cut()
  ])
}

export const printTicket = async (ticketData: TicketPrintData) => {
  const printerName = await ensureConfiguredPrinter('ticket')
  const items = ticketData.items || []

  const data: string[] = [
    `${ESC}@`,
    center('GAMEBOX'),
    center('TICKET DE VENTA'),
    separator(),
    buildLine('Factura', ticketData.invoiceNumber || 'Sin numero'),
    buildLine('Fecha', formatDateTime(ticketData.date)),
    buildLine('Vendedor', ticketData.sellerName || 'Usuario'),
    separator()
  ]

  if (ticketData.clientName || ticketData.clientDocument || ticketData.clientPhone) {
    data.push(
      buildLine('Cliente', ticketData.clientName || ''),
      buildLine('Doc', ticketData.clientDocument || ''),
      buildLine('Tel', ticketData.clientPhone || ''),
      separator()
    )
  }

  data.push(left('PRODUCTOS VENDIDOS:'))
  items.forEach((item) => {
    const quantity = item.quantity || 1
    data.push(left(`${quantity} x ${item.name} ${formatMoney(item.subtotal || item.unitPrice || 0)}`))
    if (item.type) data.push(left(item.type))
    if (item.serialNumber) data.push(left(`SN: ${item.serialNumber}`))
    if (item.unitPrice !== undefined) data.push(left(`Unitario ${formatMoney(item.unitPrice)}`))
  })

  data.push(
    separator(),
    left(`Subtotal ${formatMoney(ticketData.subtotal ?? ticketData.total)}`)
  )

  if ((ticketData.discount || 0) > 0) {
    data.push(left(`Descuento ${formatMoney(ticketData.discount)}`))
  }

  data.push(
    left(`Total pagado ${formatMoney(ticketData.total)}`),
    buildLine('Pago', ticketData.paymentMethod || ''),
    separator()
  )

  if (ticketData.warrantyStartDate || ticketData.warrantyEndDate) {
    data.push(
      buildLine('Garantia inicia', formatDate(ticketData.warrantyStartDate)),
      buildLine('Garantia final', formatDate(ticketData.warrantyEndDate)),
      separator()
    )
  }

  if (ticketData.warrantyTerms) {
    data.push(left('TERMINOS DE GARANTIA:'))
    data.push(left(ticketData.warrantyTerms))
    data.push(separator())
  }

  data.push(center('CONSERVE ESTE COMPROBANTE'), '\n\n', cut())

  await printRaw(printerName, data)
}

export const printSticker = async (stickerData: StickerPrintData) => {
  const printerName = await ensureConfiguredPrinter('sticker')

  await printRaw(printerName, [
    `${ESC}@`,
    center('GAMEBOX'),
    center('STICKER DE GARANTIA'),
    separator(),
    buildLine('Producto', stickerData.productName),
    buildLine('Codigo', stickerData.code || ''),
    buildLine('SN', stickerData.serialNumber || ''),
    buildLine('Garantia', stickerData.warranty || ''),
    buildLine('Compra', formatDate(stickerData.purchaseDate)),
    buildLine('Vence', formatDate(stickerData.warrantyEndDate)),
    stickerData.price !== undefined ? buildLine('Valor', formatMoney(stickerData.price)) : '',
    separator(),
    '\n\n',
    cut()
  ].filter(Boolean))
}

export const printServiceComanda = async (comandaData: ServiceComandaPrintData) => {
  const printerName = await ensureConfiguredPrinter('ticket')

  const data: string[] = [
    `${ESC}@`,
    center('GAMEBOX'),
    center('COMANDA DE SERVICIO'),
    separator(),
    buildLine('Orden', comandaData.orderNumber),
    buildLine('Fecha', formatDateTime(comandaData.createdAt)),
    buildLine('Sede', comandaData.branchName || ''),
    buildLine('Telefono', comandaData.branchPhone || ''),
    comandaData.receivedBy ? buildLine('Recibido por', comandaData.receivedBy) : '',
    separator(),
    buildLine('Cliente', comandaData.clientName),
    buildLine('Tel', comandaData.clientPhone || ''),
    separator(),
    left('DISPOSITIVO INGRESADO:'),
    buildLine('Tipo', comandaData.deviceType || ''),
    buildLine('Marca', comandaData.deviceBrand || ''),
    buildLine('Modelo', comandaData.deviceModel || ''),
    buildLine('Serie', comandaData.serialNumber || 'N/A'),
    separator(),
    left('PROBLEMA:'),
    left(comandaData.problemDescription || ''),
    comandaData.observations ? left(`OBS: ${comandaData.observations}`) : '',
    separator(),
    comandaData.status ? buildLine('Estado', comandaData.status) : '',
    comandaData.completedBy ? buildLine('Finalizado por', comandaData.completedBy) : '',
    comandaData.completionNotes ? left(`Trabajo realizado: ${comandaData.completionNotes}`) : '',
    separator(),
    center('CONSERVE ESTE COMPROBANTE'),
    '\n\n',
    cut()
  ].filter(Boolean)

  await printRaw(printerName, data)
}

export const printServiceSticker = async (comandaData: ServiceComandaPrintData) => {
  const printerName = await ensureConfiguredPrinter('sticker')

  await printRaw(printerName, [
    `${ESC}@`,
    center('GAMEBOX'),
    center('STICKER DE SERVICIO'),
    separator(),
    buildLine('Orden', comandaData.orderNumber),
    buildLine('Cliente', comandaData.clientName),
    buildLine('Tel', comandaData.clientPhone || ''),
    buildLine('Serie', comandaData.serialNumber || 'N/A'),
    separator(),
    left('PROBLEMA:'),
    left((comandaData.problemDescription || '').slice(0, 180)),
    '\n\n',
    cut()
  ])
}

export const qzPrinterService = {
  connectQzTray,
  setupQzSecurity,
  isQzConnected,
  getPrinters,
  savePrinter,
  getSavedPrinter,
  printTestTicket,
  printTestSticker,
  printTicketHtml,
  printStickerHtml,
  printTicket,
  printSticker,
  printServiceComanda,
  printServiceSticker
}
