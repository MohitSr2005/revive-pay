import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Code,
  ChevronDown,
  ChevronUp,
  Target,
  Sparkles,
  Bot,
  Clock,
  Workflow,
} from 'lucide-react';

import {
  PredictionInputPayload,
  PredictionResponse,
} from '../types/prediction';

import {
  approveHumanReview,
  rejectHumanReview,
} from '../services/api';

interface ResultCardProps {
  result: PredictionResponse | null;
  inputData: PredictionInputPayload | null;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  inputData,
  isLoading,
  error,
  onRetry,
}) => {
  const [showJson, setShowJson] = useState(false);

  // ============================================================
  // HUMAN-IN-THE-LOOP STATE
  // ============================================================

  const [reviewDecision, setReviewDecision] = useState<
    'pending' | 'approved' | 'rejected' | null
  >(null);

  const [reviewActionStatus, setReviewActionStatus] = useState<string | null>(
    null
  );

  const [reviewWorkflowId, setReviewWorkflowId] = useState<string | null>(null);

  const [reviewError, setReviewError] = useState<string | null>(null);

  const [isReviewProcessing, setIsReviewProcessing] = useState(false);

  const [reviewActivity, setReviewActivity] = useState<
    {
      step: string;
      message: string;
      status: string;
    }[]
  >([]);

  // ============================================================
  // RESET REVIEW STATE WHEN A NEW AGENT RESULT ARRIVES
  // ============================================================

  useEffect(() => {
    setReviewDecision(
      result?.review_decision === 'approved'
        ? 'approved'
        : result?.review_decision === 'rejected'
        ? 'rejected'
        : result?.review_id
        ? 'pending'
        : null
    );

    setReviewActionStatus(null);
    setReviewWorkflowId(null);
    setReviewError(null);
    setIsReviewProcessing(false);
    setReviewActivity([]);
  }, [result?.review_id, result?.review_decision]);

  // RevivePay model decision threshold
  const THRESHOLD = 0.40;

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl backdrop-blur-md relative overflow-hidden animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/10 to-indigo-500/5" />

        <div className="relative z-10 flex flex-col items-center justify-center py-10 space-y-4">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />

          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />

            <h3 className="text-xl font-bold text-white tracking-tight">
              RevivePay Agent is analyzing...
            </h3>
          </div>

          <p className="text-sm text-slate-400 max-w-lg">
            Running XGBoost risk detection, SHAP explainability, root-cause
            analysis, intervention planning, policy validation, and bounded
            recovery execution.
          </p>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {[
              'Risk Detection',
              'SHAP Analysis',
              'Root Cause',
              'Intervention',
              'Policy Check',
            ].map((step) => (
              <span
                key={step}
                className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] text-slate-400 font-medium"
              >
                {step}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR STATE
  // ============================================================

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-500/30 bg-rose-950/20 p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-1.5">
                Agent Analysis Error
              </span>

              <h3 className="text-lg font-bold text-white">
                Recovery Analysis Failed
              </h3>

              <p className="text-sm text-rose-200/80 mt-1 max-w-xl">
                {error}
              </p>
            </div>
          </div>

          {onRetry && (
            <button
              onClick={onRetry}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 shrink-0"
            >
              Retry Analysis
            </button>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // EMPTY STATE
  // ============================================================

  if (!result) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-10 text-center backdrop-blur-sm">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400">
            <Target className="w-6 h-6 text-emerald-400" />
          </div>

          <h3 className="text-base font-semibold text-slate-300">
            Ready for Agent Analysis
          </h3>

          <p className="text-xs text-slate-500 leading-relaxed">
            Fill in the transaction details above or select one of the
            demonstration presets, then click{' '}
            <strong className="text-emerald-400">
              "Analyze Recovery Opportunity"
            </strong>{' '}
            to run the RevivePay recovery agent.
          </p>
        </div>
      </div>
    );
  }

  /*
   * IMPORTANT:
   * The LangGraph agent returns `prediction`, not the old
   * `recovery_opportunity` field.
   */
  const isOpportunity = result.prediction === 1;

  const probabilityPercent = (
    result.recovery_probability * 100
  ).toFixed(2);

  const thresholdPercent = (THRESHOLD * 100).toFixed(0);

  const riskLevel = result.risk_level;

  const isHighRisk = riskLevel === 'HIGH';
  const isMediumRisk = riskLevel === 'MEDIUM';
  const isLowRisk = riskLevel === 'LOW';

  // ============================================================
  // AGENT / HUMAN REVIEW STATUS
  // ============================================================

  const isApproved =
    result.action_allowed === true ||
    reviewDecision === 'approved';

  const isHumanReview =
    result.action_status === 'human_review';

  const isReviewPending =
    isHumanReview && reviewDecision === 'pending';

  const isBlocked =
    result.action_status === 'blocked' ||
    reviewDecision === 'rejected';

  const isMonitoring =
    result.action_status === 'monitoring';

  const isInitiated =
    result.action_status === 'initiated' ||
    reviewActionStatus === 'initiated';

  const effectiveActionStatus =
    reviewActionStatus ?? result.action_status;

  const effectiveWorkflowId =
    reviewWorkflowId ?? result.workflow_id;

  // ============================================================
  // AGENT ACTIVITY TIMELINE
  // ============================================================

  const activityLog = [
    ...(result.activity_log ?? []),
    ...reviewActivity,
  ];

  // ============================================================
  // HUMAN REVIEW APPROVE
  // ============================================================

  const handleApprove = async () => {
    if (!result.review_id || isReviewProcessing) {
      return;
    }

    setIsReviewProcessing(true);
    setReviewError(null);

    try {
      const response = await approveHumanReview(result.review_id);

      setReviewDecision('approved');
      setReviewActionStatus(response.action_status);
      setReviewWorkflowId(response.workflow_id);

      setReviewActivity([
        {
          step: 'human_approval',
          message:
            'Human reviewer approved the recovery action.',
          status: 'completed',
        },
        {
          step: 'recovery_execution',
          message:
            response.message,
          status: 'completed',
        },
      ]);
    } catch (error) {
      setReviewError(
        error instanceof Error
          ? error.message
          : 'Human approval failed.'
      );
    } finally {
      setIsReviewProcessing(false);
    }
  };

  // ============================================================
  // HUMAN REVIEW REJECT
  // ============================================================

  const handleReject = async () => {
    if (!result.review_id || isReviewProcessing) {
      return;
    }

    setIsReviewProcessing(true);
    setReviewError(null);

    try {
      const response = await rejectHumanReview(result.review_id);

      setReviewDecision('rejected');
      setReviewActionStatus(response.action_status);
      setReviewWorkflowId(response.workflow_id);

      setReviewActivity([
        {
          step: 'human_rejection',
          message:
            'Human reviewer rejected the recovery action.',
          status: 'completed',
        },
        {
          step: 'recovery_blocked',
          message:
            response.message,
          status: 'blocked',
        },
      ]);
    } catch (error) {
      setReviewError(
        error instanceof Error
          ? error.message
          : 'Human rejection failed.'
      );
    } finally {
      setIsReviewProcessing(false);
    }
  };

  // ============================================================
  // INTERVENTION LABEL
  // ============================================================

  const interventionLabel =
    result.intervention === 'payment_recovery'
      ? 'Payment Recovery'
      : result.intervention === 'checkout_recovery'
      ? 'Checkout Recovery'
      : result.intervention === 'subscription_recovery'
      ? 'Subscription Recovery'
      : 'Continuous Monitoring';

  return (
    <div
      className={`rounded-3xl border transition-all duration-300 shadow-2xl overflow-hidden backdrop-blur-md ${
        isOpportunity
          ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-950/40 via-slate-900/90 to-slate-950 shadow-glow-emerald'
          : 'border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950'
      }`}
    >

      {/* ============================================================
          HEADER — AGENT DECISION
      ============================================================ */}

      <div className="p-6 sm:p-8 border-b border-slate-800/80">

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

          {/* Main Decision */}
          <div className="flex items-start space-x-5">

            <div
              className={`p-4 rounded-2xl border shrink-0 ${
                isOpportunity
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {isOpportunity ? (
                <CheckCircle2 className="w-10 h-10" />
              ) : (
                <XCircle className="w-10 h-10" />
              )}
            </div>

            <div>

              {/* Agent Badge */}
              <div className="flex flex-wrap items-center gap-2 mb-1.5">

                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                  RevivePay Agent Decision
                </span>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${
                    isHighRisk
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : isMediumRisk
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {riskLevel} RISK
                </span>

              </div>

              {/* YES / NO */}
              <div className="flex flex-wrap items-baseline gap-3">

                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Recovery Opportunity:
                </h2>

                <span
                  className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    isOpportunity
                      ? 'text-emerald-400'
                      : 'text-slate-300'
                  }`}
                >
                  {isOpportunity ? 'YES' : 'NO'}
                </span>

              </div>

              {/* Agent Message */}
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                {result.agent_message ||
                  (isOpportunity
                    ? 'The agent detected a revenue recovery opportunity.'
                    : 'The agent determined that active recovery is not required.')}
              </p>

            </div>
          </div>

          {/* Probability */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90">

            <div>

              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Recovery Probability
              </div>

              <div className="flex items-baseline space-x-2 mt-0.5">

                <span
                  className={`text-4xl font-black tracking-tight font-mono ${
                    isOpportunity
                      ? 'text-emerald-400'
                      : 'text-slate-200'
                  }`}
                >
                  {probabilityPercent}%
                </span>

                <span className="text-xs text-slate-500">
                  ({result.recovery_probability.toFixed(4)})
                </span>

              </div>

            </div>

            <div className="text-xs text-slate-400 flex items-center space-x-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-400" />

              <span>
                Decision Threshold:{' '}
                <strong className="text-white font-mono">
                  {thresholdPercent}% (0.40)
                </strong>
              </span>
            </div>

          </div>

        </div>

        {/* Probability Meter */}
        <div className="mt-8 space-y-2">

          <div className="flex justify-between text-xs font-semibold text-slate-400">

            <span>0% (Low Probability)</span>

            <span className="text-indigo-300 flex items-center gap-1 font-mono">
              <Target className="w-3 h-3 text-indigo-400" />
              Threshold (40.0%)
            </span>

            <span>100% (High Probability)</span>

          </div>

          <div className="relative h-4 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden p-0.5">

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-indigo-400 z-20 shadow-glow-indigo"
              style={{ left: `${THRESHOLD * 100}%` }}
              title="Decision Threshold (40%)"
            />

            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isOpportunity
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-400 shadow-glow-emerald'
                  : 'bg-gradient-to-r from-slate-600 to-slate-400'
              }`}
              style={{
                width: `${Math.max(
                  2,
                  Math.min(
                    100,
                    result.recovery_probability * 100
                  )
                )}%`,
              }}
            />

          </div>

          <div className="flex justify-between text-[11px] text-slate-500">

            <span>
              Non-Recovery Zone (&lt; 40%)
            </span>

            <span className="text-emerald-400 font-medium">
              Recovery Intervention Zone (&ge; 40%)
            </span>

          </div>

        </div>

      </div>


      {/* ============================================================
          AGENT REASONING
      ============================================================ */}

      {isOpportunity && (
        <div className="p-6 sm:p-8 border-b border-slate-800/80 bg-slate-900/40">

          <div className="flex items-center gap-2 mb-5">

            <Sparkles className="w-4 h-4 text-emerald-400" />

            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Agent Reasoning & Decision
            </h4>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Root Cause */}
            <div className="p-5 rounded-2xl border border-indigo-500/20 bg-indigo-950/20">

              <div className="flex items-center gap-2 mb-3">

                <Target className="w-4 h-4 text-indigo-400" />

                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Root Cause
                </span>

              </div>

              <p className="text-sm text-slate-200 leading-relaxed">
                {result.root_cause ||
                  'The agent detected model signals associated with a recovery opportunity.'}
              </p>

              {result.root_cause_details?.length > 0 && (
                <div className="mt-4 space-y-2">

                  {result.root_cause_details.slice(0, 5).map(
                    (detail, index) => (
                      <div
                        key={`${detail}-${index}`}
                        className="flex items-start gap-2"
                      >
                        <span className="text-indigo-400 mt-0.5">
                          •
                        </span>

                        <span className="text-[11px] text-slate-400 leading-relaxed">
                          {detail}
                        </span>
                      </div>
                    )
                  )}

                </div>
              )}

            </div>


            {/* Intervention */}
            <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/20">

              <div className="flex items-center gap-2 mb-3">

                <ArrowRight className="w-4 h-4 text-emerald-400" />

                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Recommended Intervention
                </span>

              </div>

              <div className="text-lg font-black text-white">
                {interventionLabel}
              </div>

              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                {result.intervention_reason ||
                  'The agent selected an appropriate bounded recovery intervention.'}
              </p>

            </div>

          </div>


          {/* Policy / Execution Status */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Policy */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50">

              <div className="flex items-center gap-2 mb-2">

                {isApproved ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                )}

                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Policy Decision
                </span>

              </div>

              <div
                className={`text-sm font-bold ${
                  isApproved
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {reviewDecision === 'approved'
                  ? 'Human Approved'
                  : isApproved
                  ? 'Automatically Approved'
                  : isHumanReview
                  ? 'Human Review Required'
                  : 'Blocked'}
              </div>

            </div>


            {/* Action Status */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50">

              <div className="flex items-center gap-2 mb-2">

                <Clock className="w-4 h-4 text-cyan-400" />

                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Action Status
                </span>

              </div>

              <div
                className={`text-sm font-bold ${
                  isInitiated
                    ? 'text-emerald-400'
                    : isMonitoring
                    ? 'text-slate-300'
                    : isHumanReview
                    ? 'text-amber-400'
                    : isBlocked
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              >
                {effectiveActionStatus.replace('_', ' ').toUpperCase()}
              </div>

            </div>


            {/* Workflow */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50">

              <div className="flex items-center gap-2 mb-2">

                <Workflow className="w-4 h-4 text-purple-400" />

                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Recovery Workflow
                </span>

              </div>

              <div className="text-sm font-bold font-mono text-purple-300 break-all">
                {effectiveWorkflowId || 'Not created'}
              </div>

            </div>

          </div>

        </div>
      )}


      {/* ============================================================
          AGENT ACTIVITY TIMELINE
      ============================================================ */}

      {activityLog.length > 0 && (
        <div className="p-6 sm:p-8 border-b border-slate-800/80 bg-slate-950/30">

          <div className="flex items-start justify-between gap-4 mb-6">

            <div>

              <div className="flex items-center gap-2">

                <Bot className="w-4 h-4 text-emerald-400" />

                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Agent Activity Timeline
                </h4>

              </div>

              <p className="text-[11px] text-slate-500 mt-1">
                Step-by-step actions performed by the RevivePay LangGraph
                recovery agent.
              </p>

            </div>

            <div className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              {activityLog.length} Steps
            </div>

          </div>


          <div className="relative">

            {/* Vertical timeline line */}
            <div className="absolute left-[15px] top-4 bottom-4 w-px bg-slate-800" />

            <div className="space-y-5">

              {activityLog.map((activity, index) => {

                const isCompleted =
                  activity.status === 'completed';

                const isWaiting =
                  activity.status === 'waiting';

                const isBlocked =
                  activity.status === 'blocked';

                const stepLabel = activity.step
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (char) =>
                    char.toUpperCase()
                  );

                return (
                  <div
                    key={`${activity.step}-${index}`}
                    className="relative flex items-start gap-4"
                  >

                    {/* Timeline icon */}
                    <div
                      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                        isCompleted
                          ? 'border-emerald-500/40 bg-emerald-950 text-emerald-400'
                          : isWaiting
                          ? 'border-amber-500/40 bg-amber-950 text-amber-400'
                          : isBlocked
                          ? 'border-rose-500/40 bg-rose-950 text-rose-400'
                          : 'border-slate-700 bg-slate-900 text-slate-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isWaiting ? (
                        <Clock className="w-4 h-4" />
                      ) : isBlocked ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>


                    {/* Timeline content */}
                    <div className="flex-1 min-w-0">

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">

                        <div className="text-sm font-bold text-slate-200">
                          {stepLabel}
                        </div>

                        <span
                          className={`self-start sm:self-auto px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : isWaiting
                              ? 'bg-amber-500/10 text-amber-400'
                              : isBlocked
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {activity.status}
                        </span>

                      </div>

                      <div className="mt-1.5 p-3 rounded-xl border border-slate-800 bg-slate-900/50">

                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {activity.message}
                        </p>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>

          </div>

        </div>
      )}


      {/* ============================================================
          LOW RISK MONITORING
      ============================================================ */}

      {isLowRisk && (
        <div className="p-6 sm:p-8 border-b border-slate-800/80 bg-slate-950/40">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">

              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                Standard Fulfillment
              </div>

              <p className="text-[11px] text-slate-400">
                Transaction does not currently require active revenue recovery.
              </p>

            </div>


            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">

              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Agent Monitoring
              </div>

              <p className="text-[11px] text-slate-400">
                Risk probability is below the 0.40 recovery threshold.
              </p>

            </div>


            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">

              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                No Active Recovery
              </div>

              <p className="text-[11px] text-slate-400">
                No recovery workflow was created for this transaction.
              </p>

            </div>

          </div>

        </div>
      )}


      {/* ============================================================
          MEDIUM RISK / HUMAN REVIEW
      ============================================================ */}

      {isMediumRisk && (
        <div className="p-6 sm:p-8 border-b border-slate-800/80 bg-amber-950/10">

          <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-950/20">

            <div className="flex items-start gap-3">

              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />

              <div className="flex-1">

                <div className="text-sm font-bold text-amber-300">
                  {reviewDecision === 'approved'
                    ? 'Recovery Approved'
                    : reviewDecision === 'rejected'
                    ? 'Recovery Rejected'
                    : 'Human Approval Required'}
                </div>

                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {reviewDecision === 'approved'
                    ? 'Human approval received. The bounded recovery workflow has been initiated.'
                    : reviewDecision === 'rejected'
                    ? 'The human reviewer rejected the recovery action. No recovery workflow was executed.'
                    : result.agent_message ||
                      'This recovery opportunity requires additional policy review before execution.'}
                </p>

                {/* Review ID */}
                {result.review_id && (
                  <div className="mt-3 text-[11px] font-mono text-slate-500">
                    Review ID:{' '}
                    <span className="text-amber-300">
                      {result.review_id}
                    </span>
                  </div>
                )}

              </div>

            </div>


            {/* ========================================================
                PENDING HUMAN REVIEW CONTROLS
            ======================================================== */}

            {isReviewPending && (
              <div className="mt-5 pt-5 border-t border-amber-500/20">

                <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                  Human Decision Required
                </div>

                <p className="text-[11px] text-slate-400 mb-4">
                  Review the agent's recommendation before allowing the
                  recovery workflow to execute.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">

                  <button
                    onClick={handleApprove}
                    disabled={isReviewProcessing}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />

                    {isReviewProcessing
                      ? 'Processing...'
                      : 'Approve Recovery'}
                  </button>


                  <button
                    onClick={handleReject}
                    disabled={isReviewProcessing}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/20"
                  >
                    <XCircle className="w-4 h-4" />

                    {isReviewProcessing
                      ? 'Processing...'
                      : 'Reject Recovery'}
                  </button>

                </div>

              </div>
            )}


            {/* ========================================================
                APPROVED STATE
            ======================================================== */}

            {reviewDecision === 'approved' && (
              <div className="mt-5 p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20">

                <div className="flex items-center gap-2">

                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />

                  <span className="text-sm font-bold text-emerald-300">
                    Recovery Approved & Initiated
                  </span>

                </div>

                {effectiveWorkflowId && (
                  <div className="mt-2 text-[11px] text-slate-400">
                    Recovery Workflow:{' '}
                    <span className="font-mono text-purple-300">
                      {effectiveWorkflowId}
                    </span>
                  </div>
                )}

              </div>
            )}


            {/* ========================================================
                REJECTED STATE
            ======================================================== */}

            {reviewDecision === 'rejected' && (
              <div className="mt-5 p-4 rounded-xl border border-rose-500/20 bg-rose-950/20">

                <div className="flex items-center gap-2">

                  <XCircle className="w-5 h-5 text-rose-400" />

                  <span className="text-sm font-bold text-rose-300">
                    Recovery Action Blocked
                  </span>

                </div>

                <p className="text-[11px] text-slate-400 mt-2">
                  No recovery workflow was executed after human rejection.
                </p>

              </div>
            )}


            {/* ========================================================
                REVIEW ERROR
            ======================================================== */}

            {reviewError && (
              <div className="mt-4 p-3 rounded-xl border border-rose-500/20 bg-rose-950/20">

                <div className="text-[11px] font-bold text-rose-300">
                  Human Review Error
                </div>

                <p className="text-[11px] text-rose-200/70 mt-1">
                  {reviewError}
                </p>

              </div>
            )}

          </div>

        </div>
      )}


      {/* ============================================================
          RECOMMENDED INTERVENTIONS
      ============================================================ */}

      <div className="p-6 sm:p-8 bg-slate-950/40">

        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2">

          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />

          <span>
            {isOpportunity
              ? 'Agent-Selected Recovery Action'
              : 'Recommended Monitoring'}
          </span>

        </h4>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {isOpportunity ? (
            <>
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 space-y-1.5">

                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  Payment Recovery
                </div>

                <p className="text-[11px] text-slate-300">
                  RevivePay created a bounded payment recovery workflow
                  rather than performing an unrestricted financial action.
                </p>

              </div>


              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 space-y-1.5">

                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Policy Controlled
                </div>

                <p className="text-[11px] text-slate-300">
                  Automatic execution is allowed only when RevivePay policy
                  thresholds and transaction limits are satisfied.
                </p>

              </div>


              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 space-y-1.5">

                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5 text-emerald-400" />
                  Workflow Tracking
                </div>

                <p className="text-[11px] text-slate-300">
                  The generated workflow ID can be used to track the recovery
                  action through the agent workflow.
                </p>

              </div>
            </>
          ) : (
            <>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">

                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  Standard Fulfillment
                </div>

                <p className="text-[11px] text-slate-400">
                  Transaction parameters do not currently indicate an active
                  recovery opportunity.
                </p>

              </div>


              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">

                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  No Intervention Needed
                </div>

                <p className="text-[11px] text-slate-400">
                  Recovery probability is below the 0.40 intervention
                  threshold.
                </p>

              </div>


              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">

                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Continuous Monitoring
                </div>

                <p className="text-[11px] text-slate-400">
                  The transaction remains available for future risk
                  reassessment.
                </p>

              </div>
            </>
          )}

        </div>


        {/* ============================================================
            RAW JSON
        ============================================================ */}

        <div className="mt-6 pt-4 border-t border-slate-800/80">

          <button
            onClick={() => setShowJson(!showJson)}
            className="flex items-center space-x-2 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
          >

            <Code className="w-3.5 h-3.5 text-emerald-400" />

            <span>
              {showJson
                ? 'Hide Raw Agent Payload & Response'
                : 'Inspect Raw Agent Payload & Response (JSON)'}
            </span>

            {showJson ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}

          </button>


          {showJson && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] overflow-x-auto">

                <div className="text-slate-400 font-bold mb-2">
                  // Request Payload (19 features)
                </div>

                <pre className="text-emerald-300">
                  {JSON.stringify(inputData, null, 2)}
                </pre>

              </div>


              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] overflow-x-auto">

                <div className="text-slate-400 font-bold mb-2">
                  // LangGraph Agent Response
                </div>

                <pre className="text-indigo-300">
                  {JSON.stringify(result, null, 2)}
                </pre>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};