export interface PredictionInputPayload {
  total_payment_value: number;
  payment_count: number;
  payment_installments: number;
  primary_payment_type: string;

  item_count: number | null;
  total_item_price: number | null;
  total_freight_value: number | null;
  unique_products: number | null;
  unique_sellers: number | null;

  customer_city: string;
  customer_state: string;

  purchase_year: number;
  purchase_month: number;
  purchase_day: number;
  purchase_dayofweek: number;
  purchase_hour: number;

  approval_delay_hours: number;
  delivery_time_days: number | null;
  estimated_delivery_gap_days: number | null;
}

export interface PredictionResponse {
  recovery_opportunity: number; // 0 or 1
  recovery_probability: number; // 0.0000 to 1.0000
}

export interface PredictionHistoryItem {
  id: string;
  timestamp: string;
  input: PredictionInputPayload;
  result: PredictionResponse;
  label?: string;
}

export interface PresetScenario {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: 'high-opportunity' | 'healthy' | 'at-risk';
  badgeLabel: string;
  data: PredictionInputPayload;
}
