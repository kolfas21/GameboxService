import React, { useState } from 'react'
import { FileText, Printer, Download, X, Tag } from 'lucide-react'
import type { ServiceOrder, Customer } from '../types'
import logoGamebox from '../assets/logo-gamebox.png'
import { useImageToBase64 } from '../hooks'
import { useCompanySettings } from '../hooks'
import { formatDateForPrint, getStatusDisplayName } from '../utils'
import { useAuth } from '../contexts/AuthContext'

interface ComandaPreviewProps {
  order: ServiceOrder
  customer: Customer
  onClose: () => void
}

const ComandaPreview: React.FC<ComandaPreviewProps> = ({ order, customer, onClose }) => {
  const [viewType, setViewType] = useState<'comanda' | 'sticker'>('comanda')
  const { user } = useAuth()
  const { settings } = useCompanySettings()
  
  // Usar logo de configuración si está disponible, sino usar logo por defecto
  const displayLogo = settings?.logo_url || logoGamebox
  const companyName = settings?.company_name || 'GameBox Service'
  
  // Obtener sede y teléfono del usuario que recibió la orden o del usuario actual
  const receivedByUser = order.received_by || user
  const branchName = receivedByUser?.sede || 'Parque Caldas'
  const branchPhone = receivedByUser?.branch_phone || '3116638302'
  
  const { base64: logoBase64 } = useImageToBase64(displayLogo)
  
  // Para las vistas previas, agregar timestamp para evitar cache
  const logoForPreview = displayLogo.includes('supabase') 
    ? `${displayLogo.split('?')[0]}?t=${Date.now()}` 
    : displayLogo

  const handlePrint = () => {
    const title = viewType === 'comanda' ? 'Comanda' : 'Sticker'
    const printWindow = window.open('', '_blank', 'width=600,height=800')
    
    if (printWindow) {
      if (viewType === 'sticker') {
        // Template HTML para sticker optimizado 7cm x 5cm
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title} - Orden #${order.order_number}</title>
              <meta charset="utf-8">
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                  html, body {
                    font-family: 'Arial', sans-serif;
                    margin: 0 !important;
                    padding: 0 !important;
                    background: white;
                    width: 7cm;
                    height: 5cm;
                    overflow: hidden;
                  }
                .sticker-container {
                  width: 7cm;
                  height: 5cm;
                  border: 2px solid #000;
                  padding: 2mm;
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  box-sizing: border-box;
                  position: relative;
                    margin: 0;
                  }
                .logo {
                  width: 25mm;
                  height: 12mm;
                  margin: 0 auto 1.5mm auto;
                  display: block;
                  object-fit: contain;
                }
                .info {
                  flex-grow: 1;
                  font-size: 10px;
                  line-height: 1.3;
                  color: #000;
                }
                .info-line {
                  margin-bottom: 0.8mm;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }
                .info-line strong {
                  font-weight: bold;
                  color: #000;
                }
                .problem-section {
                  margin-top: 1.5mm;
                  padding-top: 1.5mm;
                  border-top: 1px solid #999;
                  font-size: 9.5px;
                  line-height: 1.2;
                }
                .problem-text {
                  margin-top: 0.5mm;
                  display: -webkit-box;
                  -webkit-line-clamp: 4;
                  -webkit-box-orient: vertical;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: normal;
                  max-height: 12mm;
                }
                  @media print {
                    html, body {
                      margin: 0 !important;
                      padding: 0 !important;
                      width: 7cm;
                      height: 5cm;
                      overflow: hidden;
                    }
                    @page {
                      margin: 0 !important;
                      size: 7cm 5cm;
                    }
                    .sticker-container {
                      width: 7cm;
                      height: 5cm;
                      margin: 0;
                    }
                  }
              </style>
            </head>
            <body>
              <div class="sticker-container">
                <img src="${logoBase64}" alt="GameBox Logo" class="logo">
                <div class="info">
                  <div class="info-line"><strong>ORDEN:</strong> ${order.order_number}</div>
                  <div class="info-line"><strong>CLIENTE:</strong> ${customer.full_name.slice(0, 20)}</div>
                  <div class="info-line"><strong>TEL:</strong> ${(customer.phone || 'N/A').slice(0, 15)}</div>
                  <div class="info-line"><strong>SERIE:</strong> ${(order.serial_number || 'N/A').slice(0, 18)}</div>
                  <div class="problem-section">
                    <div><strong>PROBLEMA:</strong></div>
                    <div class="problem-text">${order.problem_description.slice(0, 120)}${order.problem_description.length > 120 ? '...' : ''}</div>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `)
      } else {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title} - Orden #${order.order_number}</title>
              <meta charset="utf-8">
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                body { 
                  font-family: 'Arial Black', 'Arial Bold', sans-serif; 
                  font-size: 12px; 
                  width: 80mm;
                  margin: 0;
                  padding: 2mm;
                  line-height: 1.4;
                  background: white;
                  font-weight: 900;
                }
                .header {
                  text-align: center;
                  margin-bottom: 3mm;
                  border-bottom: 1px dashed #000;
                  padding-bottom: 3mm;
                }
                .logo {
                  width: 50mm;
                  height: 20mm;
                  object-fit: contain;
                  margin-bottom: 2mm;
                }
                .title {
                  font-weight: bold;
                  font-size: 13px;
                  margin-bottom: 2mm;
                }
                .content {
                  font-size: 11px;
                  line-height: 1.5;
                  word-wrap: break-word;
                  overflow-wrap: break-word;
                }
                .section {
                  margin-bottom: 3mm;
                  border-bottom: 1px dashed #ccc;
                  padding-bottom: 2mm;
                }
                .section > div {
                  word-wrap: break-word;
                  overflow-wrap: break-word;
                  max-width: 76mm;
                }
                .label {
                  font-weight: bold;
                }
                .footer {
                  text-align: center;
                  margin-top: 5mm;
                  font-size: 8px;
                  border-top: 1px dashed #000;
                  padding-top: 3mm;
                }
                @media print {
                  body { 
                    width: 80mm;
                    margin: 0;
                    padding: 2mm;
                  }
                  @page {
                    margin: 0;
                    size: 80mm auto;
                  }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <img src="${logoBase64}" alt="GameBox Logo" class="logo">
                <div class="title">COMANDA DE SERVICIO</div>
              </div>
              
              <div class="content">
                <div class="section">
                  <div><span class="label">ORDEN:</span> ${order.order_number}</div>
                  <div><span class="label">FECHA:</span> ${formatDateForPrint(order.created_at)}</div>
                  <div><span class="label">SEDE:</span> ${branchName}</div>
                  <div><span class="label">TELÉFONO:</span> ${branchPhone}</div>
                  ${(order.received_by?.full_name || user?.full_name) ? `<div><span class="label">RECIBIDO POR:</span> ${order.received_by?.full_name || user?.full_name || order.received_by?.email?.split('@')[0] || user?.email?.split('@')[0] || 'Recepcionista'}</div>` : ''}
                </div>
                
                <div class="section">
                  <div><span class="label">CLIENTE:</span> ${customer.full_name}</div>
                  ${customer.phone ? `<div><span class="label">TEL:</span> ${customer.phone}</div>` : ''}
                </div>
                
                <div class="section">
                  <div class="label">DISPOSITIVO INGRESADO:</div>
                  <div><span class="label">TIPO:</span> ${order.device_type}</div>
                  <div><span class="label">MARCA:</span> ${order.device_brand}</div>
                  <div><span class="label">MODELO:</span> ${order.device_model}</div>
                  <div><span class="label">SERIE:</span> ${order.serial_number || 'N/A'}</div>
                </div>
                
                <div class="section">
                  <div class="label">PROBLEMA:</div>
                  <div>${order.problem_description}</div>
                  ${order.observations ? `<div class="label">OBSERVACIONES:</div><div>${order.observations}</div>` : ''}
                </div>
                
                <div class="section">
                  <div><span class="label">ESTADO:</span> ${getStatusDisplayName(order.status)}</div>
                  ${order.completed_by ? `<div><span class="label">FINALIZADO POR:</span> ${order.completed_by.full_name || order.completed_by.email?.split('@')[0] || 'Técnico'}</div>` : ''}
                  ${order.completion_notes ? `<div class="label" style="margin-top: 2mm; font-weight: bold;">TRABAJO REALIZADO:</div><div style="white-space: pre-wrap;">${order.completion_notes}</div>` : ''}
                </div>
              </div>
              
              <div class="footer">
                <div class="label">CONSERVE ESTE COMPROBANTE</div>
              </div>
            </body>
          </html>
        `)
      }
      
      printWindow.document.close()
      
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 1000)
    }
  }

  const handleDownloadPDF = () => {
    const title = viewType === 'comanda' ? 'Comanda' : 'Sticker'
    const printWindow = window.open('', '_blank', 'width=600,height=800')
    
    if (printWindow) {
      if (viewType === 'sticker') {
        // Template optimizado para sticker 7cm x 5cm
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title} - Orden #${order.order_number}</title>
              <meta charset="utf-8">
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                body { 
                  font-family: 'Arial', sans-serif; 
                  margin: 0;
                  padding: 0;
                  background: white;
                }
                .instructions {
                  background: #e3f2fd;
                  padding: 15px;
                  margin-bottom: 20px;
                  border-radius: 5px;
                  font-family: Arial, sans-serif;
                  font-size: 14px;
                }
                .sticker-container {
                  width: 7cm;
                  height: 5cm;
                  border: 2px solid #000;
                  padding: 2mm;
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  box-sizing: border-box;
                  margin: 0 auto;
                }
                .logo {
                  width: 25mm;
                  height: 12mm;
                  margin: 0 auto 1.5mm auto;
                  display: block;
                  object-fit: contain;
                }
                .info {
                  flex-grow: 1;
                  font-size: 10px;
                  line-height: 1.3;
                  color: #000;
                }
                .info-line {
                  margin-bottom: 0.8mm;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }
                .info-line strong {
                  font-weight: bold;
                  color: #000;
                }
                .problem-section {
                  margin-top: 1.5mm;
                  padding-top: 1.5mm;
                  border-top: 1px solid #999;
                  font-size: 9.5px;
                  line-height: 1.2;
                }
                .problem-text {
                  margin-top: 0.5mm;
                  display: -webkit-box;
                  -webkit-line-clamp: 4;
                  -webkit-box-orient: vertical;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: normal;
                  max-height: 12mm;
                }
                @media print {
                  .instructions {
                    display: none;
                  }
                  body { 
                    margin: 0;
                    padding: 0;
                  }
                  @page {
                    margin: 0;
                    size: 7cm 5cm;
                  }
                  .sticker-container {
                    width: 7cm;
                    height: 5cm;
                  }
                }
              </style>
            </head>
            <body>
              <div class="instructions">
                <strong>📄 Para guardar como PDF:</strong><br>
                1. Presiona <strong>Ctrl+P</strong> (o Cmd+P en Mac)<br>
                2. En "Destino" selecciona <strong>"Guardar como PDF"</strong><br>
                3. Haz clic en <strong>"Guardar"</strong><br>
                <strong>📏 Tamaño de impresión:</strong> 7cm × 5cm
              </div>
              <div class="sticker-container">
                <img src="${logoBase64}" alt="GameBox Logo" class="logo">
                <div class="info">
                  <div class="info-line"><strong>ORDEN:</strong> ${order.order_number}</div>
                  <div class="info-line"><strong>CLIENTE:</strong> ${customer.full_name.slice(0, 20)}</div>
                  <div class="info-line"><strong>TEL:</strong> ${(customer.phone || 'N/A').slice(0, 15)}</div>
                  <div class="info-line"><strong>SERIE:</strong> ${(order.serial_number || 'N/A').slice(0, 18)}</div>
                  <div class="problem-section">
                    <div><strong>PROBLEMA:</strong></div>
                    <div class="problem-text">${order.problem_description.slice(0, 120)}${order.problem_description.length > 120 ? '...' : ''}</div>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `)
      } else {
        // Template para comanda en tirilla (80mm) - PDF
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title} - Orden #${order.order_number}</title>
              <meta charset="utf-8">
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                body { 
                  font-family: 'Arial Black', 'Arial Bold', sans-serif; 
                  font-size: 12px; 
                  width: 80mm;
                  margin: 0;
                  padding: 2mm;
                  line-height: 1.4;
                  background: white;
                  font-weight: 900;
                }
                .instructions {
                  background: #e3f2fd;
                  padding: 10px;
                  margin-bottom: 15px;
                  border-radius: 5px;
                  font-family: Arial, sans-serif;
                  font-size: 12px;
                  width: auto;
                }
                .header {
                  text-align: center;
                  margin-bottom: 3mm;
                  border-bottom: 1px dashed #000;
                  padding-bottom: 3mm;
                }
                .logo {
                  width: 50mm;
                  height: 20mm;
                  object-fit: contain;
                  margin-bottom: 2mm;
                }
                .title {
                  font-weight: bold;
                  font-size: 13px;
                  margin-bottom: 2mm;
                }
                .content {
                  font-size: 11px;
                  line-height: 1.5;
                  word-wrap: break-word;
                  overflow-wrap: break-word;
                }
                .section {
                  margin-bottom: 3mm;
                  border-bottom: 1px dashed #ccc;
                  padding-bottom: 2mm;
                }
                .section > div {
                  word-wrap: break-word;
                  overflow-wrap: break-word;
                  max-width: 76mm;
                }
                .label {
                  font-weight: bold;
                }
                .footer {
                  text-align: center;
                  margin-top: 5mm;
                  font-size: 8px;
                  border-top: 1px dashed #000;
                  padding-top: 3mm;
                }
                @media print {
                  .instructions {
                    display: none;
                  }
                  body { 
                    width: 80mm;
                    margin: 0;
                    padding: 2mm;
                  }
                  @page {
                    margin: 0;
                    size: 80mm auto;
                  }
                }
              </style>
            </head>
            <body>
              <div class="instructions">
                <strong>📄 Para guardar como PDF:</strong><br>
                1. Presiona <strong>Ctrl+P</strong> (o Cmd+P en Mac)<br>
                2. En "Destino" selecciona <strong>"Guardar como PDF"</strong><br>
                3. Haz clic en <strong>"Guardar"</strong><br>
                <strong>📏 Formato:</strong> Tirilla 80mm
              </div>
              
              <div class="header">
                <img src="${logoBase64}" alt="GameBox Logo" class="logo">
                <div class="title">COMANDA DE SERVICIO</div>
              </div>
              
              <div class="content">
                <div class="section">
                  <div><span class="label">ORDEN:</span> ${order.order_number}</div>
                  <div><span class="label">FECHA:</span> ${formatDateForPrint(order.created_at)}</div>
                  <div><span class="label">SEDE:</span> ${branchName}</div>
                  <div><span class="label">TELÉFONO:</span> ${branchPhone}</div>
                  ${(order.received_by?.full_name || user?.full_name) ? `<div><span class="label">RECIBIDO POR:</span> ${order.received_by?.full_name || user?.full_name || order.received_by?.email?.split('@')[0] || user?.email?.split('@')[0] || 'Recepcionista'}</div>` : ''}
                </div>
                
                <div class="section">
                  <div><span class="label">CLIENTE:</span> ${customer.full_name}</div>
                  ${customer.phone ? `<div><span class="label">TEL:</span> ${customer.phone}</div>` : ''}
                </div>
                
                <div class="section">
                  <div class="label">DISPOSITIVO INGRESADO:</div>
                  <div><span class="label">TIPO:</span> ${order.device_type}</div>
                  <div><span class="label">MARCA:</span> ${order.device_brand}</div>
                  <div><span class="label">MODELO:</span> ${order.device_model}</div>
                  <div><span class="label">SERIE:</span> ${order.serial_number || 'N/A'}</div>
                </div>
                
                <div class="section">
                  <div class="label">PROBLEMA:</div>
                  <div>${order.problem_description}</div>
                  ${order.observations ? `<div class="label">OBSERVACIONES:</div><div>${order.observations}</div>` : ''}
                </div>
                
                <div class="section">
                  <div><span class="label">ESTADO:</span> ${getStatusDisplayName(order.status)}</div>
                  ${order.completed_by ? `<div><span class="label">FINALIZADO POR:</span> ${order.completed_by.full_name || order.completed_by.email?.split('@')[0] || 'Técnico'}</div>` : ''}
                  ${order.completion_notes ? `<div class="label" style="margin-top: 2mm; font-weight: bold;">TRABAJO REALIZADO:</div><div style="white-space: pre-wrap;">${order.completion_notes}</div>` : ''}
                </div>
              </div>
              
              <div class="footer">
                <div class="label">CONSERVE ESTE COMPROBANTE</div>
              </div>
            </body>
          </html>
        `)
      }
      
      printWindow.document.close()
      
      setTimeout(() => {
        printWindow.print()
      }, 1000)
    }
  }

  return (
    <>
      {/* Modal Backdrop */}
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-info text-white">
              <h5 className="modal-title d-flex align-items-center">
                <FileText size={20} className="me-2" />
                Vista Previa - Orden #{order.order_number}
              </h5>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={onClose}
              ></button>
            </div>
            
            <div className="modal-body">
              {/* Selector de tipo de vista */}
              <div className="mb-3">
                <div className="btn-group w-100" role="group">
                  <button
                    type="button"
                    className={`btn ${viewType === 'comanda' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setViewType('comanda')}
                  >
                    <FileText className="me-1" size={16} />
                    Comanda Completa
                  </button>
                  <button
                    type="button"
                    className={`btn ${viewType === 'sticker' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setViewType('sticker')}
                  >
                    <Tag className="me-1" size={16} />
                    Sticker de Consola
                  </button>
                </div>
              </div>

              {/* Preview Area */}
              {viewType === 'sticker' ? (
                // Vista previa con imagen para sticker optimizado 7x5cm
                <div className="bg-light p-3 rounded mb-3 text-center" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <div className="border rounded p-2 d-inline-block bg-white" style={{ 
                    width: '280px', 
                    height: '200px', 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    fontFamily: 'Arial Black, Arial Bold, sans-serif',
                    fontWeight: 900
                  }}>
                    {/* Logo optimizado */}
                    <img src={logoForPreview} alt={companyName} style={{ 
                      width: '100px', 
                      height: '48px', 
                      margin: '0 auto 5px auto',
                      display: 'block',
                      objectFit: 'contain'
                    }} />
                    
                    <div style={{ 
                      fontSize: '13px', 
                      textAlign: 'left', 
                      flexGrow: 1,
                      lineHeight: '1.3'
                    }}>
                      <div style={{ marginBottom: '2px' }}><strong>ORDEN:</strong> {order.order_number}</div>
                      <div style={{ marginBottom: '2px' }}><strong>CLIENTE:</strong> {customer.full_name.slice(0, 20)}</div>
                      <div style={{ marginBottom: '2px' }}><strong>TEL:</strong> {(customer.phone || 'N/A').slice(0, 15)}</div>
                      <div style={{ marginBottom: '2px' }}><strong>SERIE:</strong> {(order.serial_number || 'N/A').slice(0, 18)}</div>
                      <div style={{ fontSize: '12px', marginTop: '4px', borderTop: '1px solid #ddd', paddingTop: '4px' }}>
                        <strong>PROBLEMA:</strong><br />
                        <div style={{ marginTop: '2px', lineHeight: '1.2' }}>
                          {order.problem_description.slice(0, 120)}{order.problem_description.length > 120 ? '...' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-muted" style={{ fontSize: '12px' }}>
                    📏 <strong>Tamaño de impresión:</strong> 7cm × 5cm
                  </div>
                </div>
              ) : (
                // Vista previa para comanda en formato tirilla
                <div className="bg-light p-3 rounded mb-3" style={{ 
                  maxHeight: '400px', 
                  overflowY: 'auto' 
                }}>
                  <div className="mx-auto border rounded p-3 bg-white" style={{ 
                    width: '280px', // Simula 80mm
                    fontFamily: 'Arial Black, Arial Bold, sans-serif',
                    fontSize: '12px',
                    fontWeight: 900
                  }}>
                    {/* Header con logo */}
                    <div className="text-center mb-3 pb-2" style={{ borderBottom: '1px dashed #000' }}>
                      <img src={logoForPreview} alt={companyName} style={{ 
                        width: '180px', 
                        height: '72px',
                        marginBottom: '8px',
                        objectFit: 'contain'
                      }} />
                      <div style={{ fontWeight: 'bold', fontSize: '13px' }}>COMANDA DE SERVICIO</div>
                    </div>
                    
                    {/* Contenido organizado en secciones */}
                    <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
                      <div className="mb-2 pb-2" style={{ borderBottom: '1px dashed #ccc' }}>
                        <div><strong>ORDEN:</strong> {order.order_number}</div>
                        <div><strong>FECHA:</strong> {formatDateForPrint(order.created_at)}</div>
                        <div><strong>SEDE:</strong> {branchName}</div>
                        <div><strong>TELÉFONO:</strong> {branchPhone}</div>
                        {(order.received_by?.full_name || user?.full_name) && <div><strong>RECIBIDO POR:</strong> {order.received_by?.full_name || user?.full_name || order.received_by?.email?.split('@')[0] || user?.email?.split('@')[0] || 'Recepcionista'}</div>}
                      </div>
                      
                      <div className="mb-2 pb-2" style={{ borderBottom: '1px dashed #ccc' }}>
                        <div><strong>CLIENTE:</strong> {customer.full_name}</div>
                        {customer.phone && <div><strong>TEL:</strong> {customer.phone}</div>}
                      </div>
                      
                      <div className="mb-2 pb-2" style={{ borderBottom: '1px dashed #ccc' }}>
                        <div style={{ fontWeight: 'bold' }}>DISPOSITIVO INGRESADO:</div>
                        <div><strong>TIPO:</strong> {order.device_type}</div>
                        <div><strong>MARCA:</strong> {order.device_brand}</div>
                        <div><strong>MODELO:</strong> {order.device_model}</div>
                        <div><strong>SERIE:</strong> {order.serial_number || 'N/A'}</div>
                      </div>
                      
                      <div className="mb-2 pb-2" style={{ borderBottom: '1px dashed #ccc' }}>
                        <div style={{ fontWeight: 'bold' }}>PROBLEMA:</div>
                        <div>{order.problem_description}</div>
                        {order.observations && (
                          <>
                            <div style={{ fontWeight: 'bold', marginTop: '5px' }}>OBSERVACIONES:</div>
                            <div>{order.observations}</div>
                          </>
                        )}
                      </div>
                      
                      <div className="mb-2 pb-2" style={{ borderBottom: '1px dashed #ccc' }}>
                        <div><strong>ESTADO:</strong> {getStatusDisplayName(order.status)}</div>
                        {order.completed_by && (
                          <div><strong>FINALIZADO POR:</strong> {order.completed_by.full_name || order.completed_by.email?.split('@')[0] || 'Técnico'}</div>
                        )}
                        {order.completion_notes && (
                          <>
                            <div style={{ fontWeight: 'bold', marginTop: '5px' }}>TRABAJO REALIZADO:</div>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{order.completion_notes}</div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="text-center mt-3 pt-2" style={{ 
                      borderTop: '1px dashed #000',
                      fontSize: '9px',
                      fontWeight: 'bold'
                    }}>
                      CONSERVE ESTE COMPROBANTE
                    </div>
                  </div>
                  
                  <div className="mt-2 text-muted text-center" style={{ fontSize: '12px' }}>
                    📏 <strong>Formato de impresión:</strong> Tirilla 80mm
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="d-flex gap-2 justify-content-center">
                <button
                  className="btn btn-primary"
                  onClick={handlePrint}
                >
                  <Printer size={16} className="me-1" />
                  Imprimir {viewType === 'comanda' ? 'Comanda' : 'Sticker'}
                </button>
                
                <button
                  className="btn btn-success"
                  onClick={handleDownloadPDF}
                >
                  <Download size={16} className="me-1" />
                  Guardar PDF
                </button>
                
                <button
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  <X size={16} className="me-1" />
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ComandaPreview
