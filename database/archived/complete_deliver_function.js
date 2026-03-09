// Versión completa de deliverServiceOrder para usar después de la migración
const deliverServiceOrder = async (orderId: string, deliveryNotes?: string): Promise<boolean> => {
  try {
    console.log('📦 Marcando orden como entregada:', orderId)
    
    const { error } = await supabase
      .from('service_orders')
      .update({
        status: 'delivered',
        delivery_notes: deliveryNotes || '',
        delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (error) throw error

    console.log('✅ Orden marcada como entregada exitosamente')
    
    // Refresh data
    await fetchServiceOrders()
    return true
  } catch (err) {
    console.error('❌ Error marcando orden como entregada:', err)
    setError(err instanceof Error ? err.message : 'Error al entregar orden')
    return false
  }
}