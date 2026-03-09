import React from 'react'

interface StatusBadgeProps {
  status: 'pending' | 'in_progress' | 'completed' | 'delivered'
}

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusConfig = {
    pending: {
      label: 'Pendiente',
      classes: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    in_progress: {
      label: 'En Progreso',
      classes: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    completed: {
      label: 'Completada',
      classes: 'bg-green-100 text-green-800 border-green-200'
    },
    delivered: {
      label: 'Entregada',
      classes: 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const config = statusConfig[status]

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}>
      {config.label}
    </span>
  )
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const priorityConfig = {
    low: {
      label: 'Baja',
      classes: 'bg-gray-100 text-gray-800 border-gray-200'
    },
    medium: {
      label: 'Media',
      classes: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    high: {
      label: 'Alta',
      classes: 'bg-red-100 text-red-800 border-red-200'
    }
  }

  const config = priorityConfig[priority]

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes}`}>
      {config.label}
    </span>
  )
}

export default StatusBadge
