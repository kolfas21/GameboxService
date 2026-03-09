export interface FeaturesEnabled {
  outsourcing: boolean
  warranty_tracking: boolean
  technician_stats: boolean
}

export interface RequiredFields {
  device_brand: boolean
  device_model: boolean
  serial_number: boolean
  problem_description: boolean
  observations: boolean
  estimated_completion: boolean
}

export interface CompanySettings {
  id: string
  company_name: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  features_enabled: FeaturesEnabled
  required_fields: RequiredFields
  created_at: string
  updated_at: string
}
