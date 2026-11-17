export type TripStatus = 'chua' | 'dat' | 'tra'
export type CostCategory = 'Cố định' | 'Vé tham quan' | 'Ăn uống' | 'Đi lại' | 'Phát sinh'

export interface Trip {
  id: string
  slug: string
  name: string
  start_date: string
  end_date: string
  members: number
  budget_vnd: number
  rate: number
  cash_sgd: number
  created_at: string
}

export interface Cost {
  id: string
  trip_id: string
  cat: CostCategory
  label: string
  planned: number
  actual: number
  status: TripStatus
  note: string
  order_num: number
  updated_at: string
}

export interface Receipt {
  id: string
  trip_id: string
  cost_id: string | null
  image_url: string | null
  raw_text: string | null
  parsed_json: {
    place?: string
    total_sgd?: number
    date?: string
    items?: { name: string; qty: number; price_sgd: number }[]
    matched_cost_id?: string | null
  } | null
  confirmed: boolean
  created_at: string
}

// Summary tính toán phía client
export interface TripSummary {
  budget: number
  planned: number
  spent: number
  committed: number   // actual nếu có, planned nếu chưa chi
  left: number        // budget - committed
  cashVnd: number     // cash_sgd * rate
  cardLeft: number    // budget - spent - cashVnd
  rate: number
  cashSgd: number
}
