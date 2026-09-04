import React from 'react';
import { 
  CreditCard, 
  User, 
  ShoppingBag, 
  Truck, 
  Zap, 
  RotateCcw, 
  Sparkles, 
  HelpCircle,
  DollarSign,
  MapPin,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { PredictionInputPayload, PresetScenario } from '../types/prediction';
import { BRAZIL_STATES, PAYMENT_TYPES, DAYS_OF_WEEK, PRESET_SCENARIOS } from '../data/presets';

interface PredictionFormProps {
  formData: PredictionInputPayload;
  onChange: (updated: PredictionInputPayload) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onSelectPreset: (preset: PresetScenario) => void;
  onReset: () => void;
  activePresetId: string | null;
}

export const PredictionForm: React.FC<PredictionFormProps> = ({
  formData,
  onChange,
  onSubmit,
  isLoading,
  onSelectPreset,
  onReset,
  activePresetId,
}) => {

  const handleNumberChange = (field: keyof PredictionInputPayload, value: string, isOptional = false) => {
    if (value === '') {
      onChange({
        ...formData,
        [field]: isOptional ? null : 0,
      });
      return;
    }
    const parsed = parseFloat(value);
    onChange({
      ...formData,
      [field]: isNaN(parsed) ? (isOptional ? null : 0) : parsed,
    });
  };

  const handleIntChange = (field: keyof PredictionInputPayload, value: string) => {
    if (value === '') {
      onChange({
        ...formData,
        [field]: 0,
      });
      return;
    }
    const parsed = parseInt(value, 10);
    onChange({
      ...formData,
      [field]: isNaN(parsed) ? 0 : parsed,
    });
  };

  const handleTextChange = (field: keyof PredictionInputPayload, value: string) => {
    onChange({
      ...formData,
      [field]: value,
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      
      {/* Preset Scenarios Selector (Quick Demo Bar) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Quick Demonstration Presets
            </span>
          </div>
          <span className="text-xs text-slate-400">
            One-click sample scenarios to test ML recovery classification
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_SCENARIOS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`relative flex flex-col text-left p-3.5 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/50 shadow-glow-emerald'
                    : 'border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    preset.badge === 'high-opportunity'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : preset.badge === 'healthy'
                      ? 'bg-slate-700 text-slate-300 border border-slate-600'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {preset.badgeLabel}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                <div className="text-xs font-semibold text-white leading-tight">
                  {preset.title}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                  {preset.subtitle}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Form Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SECTION 1: Transaction Details */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-6 shadow-card hover:border-slate-700/80 transition-colors">
          <div className="flex items-center space-x-3 pb-4 mb-5 border-b border-slate-800/80">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">1. Transaction Details</h3>
              <p className="text-xs text-slate-400">Payment mechanism, amounts, and installment breakdown</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Payment Value */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Total Payment Value ($ / R$)
                </span>
                <span className="text-[11px] text-slate-500 font-mono">total_payment_value</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-semibold text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.total_payment_value}
                  onChange={(e) => handleNumberChange('total_payment_value', e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Payment Count */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Payment Count</span>
                <span className="text-[11px] text-slate-500 font-mono">payment_count</span>
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={formData.payment_count}
                onChange={(e) => handleIntChange('payment_count', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono"
                placeholder="1"
              />
            </div>

            {/* Payment Installments */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Installments</span>
                <span className="text-[11px] text-slate-500 font-mono">payment_installments</span>
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="36"
                required
                value={formData.payment_installments}
                onChange={(e) => handleIntChange('payment_installments', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono"
                placeholder="1"
              />
            </div>

            {/* Primary Payment Type */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Primary Payment Method</span>
                <span className="text-[11px] text-slate-500 font-mono">primary_payment_type</span>
              </label>
              <select
                value={formData.primary_payment_type}
                onChange={(e) => handleTextChange('primary_payment_type', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              >
                {PAYMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: Customer Details */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-6 shadow-card hover:border-slate-700/80 transition-colors">
          <div className="flex items-center space-x-3 pb-4 mb-5 border-b border-slate-800/80">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">2. Customer Details</h3>
              <p className="text-xs text-slate-400">Customer geographical origin and state jurisdiction</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer City */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  Customer City
                </span>
                <span className="text-[11px] text-slate-500 font-mono">customer_city</span>
              </label>
              <input
                type="text"
                required
                value={formData.customer_city}
                onChange={(e) => handleTextChange('customer_city', e.target.value.toLowerCase())}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono"
                placeholder="e.g. sao paulo, rio de janeiro"
              />
            </div>

            {/* Customer State */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Customer State</span>
                <span className="text-[11px] text-slate-500 font-mono">customer_state</span>
              </label>
              <select
                value={formData.customer_state}
                onChange={(e) => handleTextChange('customer_state', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              >
                {BRAZIL_STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.code} — {st.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Geographic Context Info Box */}
            <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 flex items-start space-x-2.5">
              <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p>
                Geographical metrics map freight logistical channels. The machine learning model uses one-hot frequency encoding to assess state-level recovery probabilities.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: Purchase & Item Details */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-6 shadow-card hover:border-slate-700/80 transition-colors lg:col-span-2">
          <div className="flex items-center space-x-3 pb-4 mb-5 border-b border-slate-800/80">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">3. Purchase Details & Timestamps</h3>
              <p className="text-xs text-slate-400">Basket size, product diversity, pricing, and temporal purchase timestamps</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            
            {/* item_count */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Item Count</span>
                <span className="text-[10px] text-slate-500 font-mono">item_count</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.item_count ?? ''}
                onChange={(e) => handleNumberChange('item_count', e.target.value, true)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-mono"
                placeholder="Auto"
              />
            </div>

            {/* total_item_price */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Total Item Price</span>
                <span className="text-[10px] text-slate-500 font-mono">total_item_price</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.total_item_price ?? ''}
                onChange={(e) => handleNumberChange('total_item_price', e.target.value, true)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-mono"
                placeholder="Auto"
              />
            </div>

            {/* total_freight_value */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Freight Value</span>
                <span className="text-[10px] text-slate-500 font-mono">total_freight_value</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.total_freight_value ?? ''}
                onChange={(e) => handleNumberChange('total_freight_value', e.target.value, true)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-mono"
                placeholder="Auto"
              />
            </div>

            {/* unique_products */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Unique Products</span>
                <span className="text-[10px] text-slate-500 font-mono">unique_products</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.unique_products ?? ''}
                onChange={(e) => handleNumberChange('unique_products', e.target.value, true)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-mono"
                placeholder="Auto"
              />
            </div>

            {/* unique_sellers */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Unique Sellers</span>
                <span className="text-[10px] text-slate-500 font-mono">unique_sellers</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.unique_sellers ?? ''}
                onChange={(e) => handleNumberChange('unique_sellers', e.target.value, true)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-mono"
                placeholder="Auto"
              />
            </div>

            {/* Temporal Features */}
            {/* purchase_year */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Year</span>
                <span className="text-[10px] text-slate-500 font-mono">purchase_year</span>
              </label>
              <input
                type="number"
                step="1"
                min="2016"
                max="2030"
                required
                value={formData.purchase_year}
                onChange={(e) => handleIntChange('purchase_year', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-mono"
              />
            </div>

            {/* purchase_month */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Month (1-12)</span>
                <span className="text-[10px] text-slate-500 font-mono">purchase_month</span>
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="12"
                required
                value={formData.purchase_month}
                onChange={(e) => handleIntChange('purchase_month', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-mono"
              />
            </div>

            {/* purchase_day */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Day (1-31)</span>
                <span className="text-[10px] text-slate-500 font-mono">purchase_day</span>
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="31"
                required
                value={formData.purchase_day}
                onChange={(e) => handleIntChange('purchase_day', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-mono"
              />
            </div>

            {/* purchase_dayofweek */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Day of Week</span>
                <span className="text-[10px] text-slate-500 font-mono">purchase_dayofweek</span>
              </label>
              <select
                value={formData.purchase_dayofweek}
                onChange={(e) => handleIntChange('purchase_dayofweek', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* purchase_hour */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Hour (0-23)</span>
                <span className="text-[10px] text-slate-500 font-mono">purchase_hour</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="23"
                required
                value={formData.purchase_hour}
                onChange={(e) => handleIntChange('purchase_hour', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-mono"
              />
            </div>

          </div>
        </div>

        {/* SECTION 4: Delivery & Timing Details */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-6 shadow-card hover:border-slate-700/80 transition-colors lg:col-span-2">
          <div className="flex items-center space-x-3 pb-4 mb-5 border-b border-slate-800/80">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">4. Delivery & Fulfillment Details</h3>
              <p className="text-xs text-slate-400">Carrier transit times, gateway approval latency, and delivery gap metrics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            
            {/* approval_delay_hours */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Approval Delay (Hours)
                </span>
                <span className="text-[11px] text-slate-500 font-mono">approval_delay_hours</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.approval_delay_hours}
                onChange={(e) => handleNumberChange('approval_delay_hours', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 font-mono"
                placeholder="0.5"
              />
              <p className="text-[11px] text-slate-400">
                Time elapsed between order placement and payment gateway approval.
              </p>
            </div>

            {/* delivery_time_days */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Delivery Time (Days)</span>
                <span className="text-[11px] text-slate-500 font-mono">delivery_time_days</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.delivery_time_days ?? ''}
                onChange={(e) => handleNumberChange('delivery_time_days', e.target.value, true)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 font-mono"
                placeholder="Empty if undelivered"
              />
              <p className="text-[11px] text-slate-400">
                Actual delivery duration (leave blank if undelivered/canceled order).
              </p>
            </div>

            {/* estimated_delivery_gap_days */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Estimated Delivery Gap (Days)</span>
                <span className="text-[11px] text-slate-500 font-mono">estimated_delivery_gap_days</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.estimated_delivery_gap_days ?? ''}
                onChange={(e) => handleNumberChange('estimated_delivery_gap_days', e.target.value, true)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 font-mono"
                placeholder="10.0"
              />
              <p className="text-[11px] text-slate-400">
                Estimated delivery date vs actual delivery date gap.
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Action Footer & Main Predict Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center space-x-2 px-5 py-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-medium transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Defaults</span>
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full sm:w-auto min-w-[280px] flex items-center justify-center space-x-3 px-8 py-4 rounded-xl font-bold text-base tracking-wide transition-all shadow-lg ${
            isLoading
              ? 'bg-emerald-600/50 text-emerald-200 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              <span>Analyzing ML Features...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 fill-current" />
              <span>Run RevivePay Recovery Agent</span>
            </>
          )}
        </button>
      </div>

    </form>
  );
};
