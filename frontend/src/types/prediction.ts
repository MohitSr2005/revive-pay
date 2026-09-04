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


/*
 * Complete response returned by the RevivePay LangGraph agent.
 */
export interface AgentActivity {
  step: string;
  message: string;
  status: string;
}
export interface PredictionResponse {
  recovery_probability: number;
  prediction: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  explanations: ShapExplanation[];

  root_cause: string | null;
  root_cause_details: string[];

  intervention: string | null;
  intervention_reason: string | null;

  action_allowed: boolean;
  action_status: string;

  workflow_id: string | null;
  review_id: string | null;
  review_decision: string | null;
  agent_message: string | null;
  activity_log: AgentActivity[];
  recovery_opportunity?: number;
}


/*
 * One SHAP feature explanation returned by the agent.
 */
export interface ShapExplanation {
  feature: string;
  shap_value: number;
  impact: 'positive' | 'negative';
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
