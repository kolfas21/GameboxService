import React from 'react'
import { RefreshCw, Zap } from 'lucide-react'

interface AutoRefreshIndicatorProps {
  isRefreshing?: boolean
  realtime?: boolean
  className?: string
}

const AutoRefreshIndicator: React.FC<AutoRefreshIndicatorProps> = ({ 
  isRefreshing = false, 
  realtime = false,
  className = "" 
}) => {
  return (
    <div className={`inline-flex items-center space-x-2 text-sm text-gray-600 ${className}`}>
      {realtime ? (
        <>
          <Zap className={`h-4 w-4 text-green-500 ${isRefreshing ? 'animate-pulse' : ''}`} />
          <span className="text-green-600 font-medium">Tiempo real</span>
        </>
      ) : (
        <>
          <RefreshCw className={`h-4 w-4 text-blue-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Actualización automática</span>
        </>
      )}
    </div>
  )
}

export default AutoRefreshIndicator