import { PredictionInputPayload, PredictionResponse } from '../types/prediction';

export interface ShapExplanation {
  feature: string;
  shap_value: number;
  impact: 'positive' | 'negative';
}
const DEFAULT_API_URL = 'http://127.0.0.1:8000';

export interface ApiStatus {
  online: boolean;
  message: string;
  latencyMs?: number;
  lastChecked?: Date;
}

export class ApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Checks if the FastAPI backend server is reachable and active.
 */
export async function checkBackendHealth(baseUrl = DEFAULT_API_URL): Promise<ApiStatus> {
  const startTime = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${baseUrl}/`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);

    if (response.ok) {
      const data = await response.json();
      return {
        online: true,
        message: data.message || 'API Connected',
        latencyMs,
        lastChecked: new Date(),
      };
    } else {
      return {
        online: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
        latencyMs,
        lastChecked: new Date(),
      };
    }
  } catch (err: unknown) {
    const error = err as Error;
    return {
      online: false,
      message: error.name === 'AbortError' ? 'Connection timed out' : 'Backend offline or unreachable',
      lastChecked: new Date(),
    };
  }
}

/**
 * Sends a transaction data payload to FastAPI /predict endpoint.
 */
export async function predictRecoveryOpportunity(
  payload: PredictionInputPayload,
  baseUrl = DEFAULT_API_URL
): Promise<PredictionResponse> {
  const endpoint = `${baseUrl}/predict`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody = '';
      try {
        const errorJson = await response.json();
        errorBody = JSON.stringify(errorJson);
      } catch {
        errorBody = await response.text();
      }
      throw new ApiError(
        `Prediction request failed with status ${response.status} (${response.statusText}): ${errorBody}`,
        response.status,
        errorBody
      );
    }

    const data: PredictionResponse = await response.json();

    // Sanity check response fields
    if (
      typeof data.recovery_opportunity === 'undefined' ||
      typeof data.recovery_probability === 'undefined'
    ) {
      throw new ApiError('Unexpected response structure received from API', 200, data);
    }

    return data;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    const error = err as Error;
    if (error.name === 'AbortError') {
      throw new ApiError('Prediction request timed out after 10 seconds. Check if backend is busy.', 408);
    }
    throw new ApiError(
      `Unable to connect to RevivePay API at ${baseUrl}. Ensure FastAPI is running on port 8000. Error: ${error.message}`
    );
  }
}
/**
 * Sends a transaction data payload to FastAPI /explain endpoint
 * and returns SHAP feature explanations.
 */
export async function explainRecoveryOpportunity(
  payload: PredictionInputPayload,
  baseUrl = DEFAULT_API_URL
): Promise<ShapExplanation[]> {
  const endpoint = `${baseUrl}/explain`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody = '';
      try {
        const errorJson = await response.json();
        errorBody = JSON.stringify(errorJson);
      } catch {
        errorBody = await response.text();
      }

      throw new ApiError(
        `Explainability request failed with status ${response.status} (${response.statusText}): ${errorBody}`,
        response.status,
        errorBody
      );
    }

    const data: { explanations: ShapExplanation[] } = await response.json();

    if (!Array.isArray(data.explanations)) {
      throw new ApiError(
        'Unexpected explainability response structure received from API',
        200,
        data
      );
    }

    return data.explanations;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }

    const error = err as Error;

    if (error.name === 'AbortError') {
      throw new ApiError(
        'Explainability request timed out after 10 seconds.'
      );
    }

    throw new ApiError(
      `Unable to connect to RevivePay explainability API at ${baseUrl}. Error: ${error.message}`
    );
  }
}
