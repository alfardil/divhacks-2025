/**
 * API Configuration utility
 * Handles environment-based API endpoint selection
 */

const isProd = process.env.NODE_ENV === "production";

export const API_BASE_URL = isProd
  ? "https://backend-green-thunder-5490.fly.dev"
  : "http://localhost:8000";

export const API_ENDPOINTS = {
  FRONTEND_JURY: {
    EVALUATE_SELECTED_JUDGES: "/frontend-jury/evaluate-selected-judges",
    EVALUATE_WITH_JUDGE_1: "/frontend-jury/evaluate-with-judge-1",
    TEST_JUDGE_1: "/frontend-jury/test-judge-1",
  },
  GEMINI: {
    CHAT: "/gemini/chat",
    OPTIMIZE_CODE: "/gemini/optimize-code",
  },
  CHARACTER_JURY: {
    UPLOAD_FILE: "/character-jury/upload-file",
    TEST_SAMPLE: "/character-jury/test-sample",
  },
} as const;

/**
 * Helper function to build full API URLs
 */
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Helper function for making API requests with proper configuration
 */
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = buildApiUrl(endpoint);
  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  return fetch(url, { ...defaultOptions, ...options });
};
