import axios from "axios";

// Base URL for the hosted Upstox mutual fund API.
// This service module is the ONLY place that talks to the upstream API — both
// the Express routes and the agent tools call these functions and pass params.
const API_BASE_URL = "https://upstocks-api.onrender.com";

/**
 * Search funds/instruments by keyword.
 * @param {string} query
 * @param {object} [opts]
 * @param {number} [opts.records] - upstream page size (upstream lists stocks
 *   before mutual funds, so callers that need MF results request a larger batch).
 * @returns raw upstream response body
 */
export async function searchFunds(query, { records } = {}) {
  const params = { query };
  if (records != null) params.records = records;
  const response = await axios.get(`${API_BASE_URL}/api/mutual-fund/search`, {
    params,
  });
  return response.data;
}

/**
 * Get full details for a single fund by its slug.
 * @param {string} fundSlug e.g. "parag-parikh-flexi-cap-direct-growth-100060"
 * @returns raw upstream response body
 */
export async function fetchFundDetails(fundSlug) {
  const response = await axios.get(`${API_BASE_URL}/api/mutual-fund`, {
    params: { fund: fundSlug },
  });
  return response.data;
}

/**
 * Get historical NAV data for a fund.
 * @param {string} fundId numeric fund id, e.g. "100060"
 * @param {object} [opts] { navPeriod, interval, investedAmount }
 * @returns raw upstream response body
 */
export async function fetchNavHistory(fundId, { navPeriod, interval, investedAmount } = {}) {
  const response = await axios.get(
    `${API_BASE_URL}/api/mutual-fund/${fundId}/nav-history`,
    { params: { navPeriod, interval, investedAmount } }
  );
  return response.data;
}

/**
 * Get a fund's returns vs its category average.
 * @param {string} fundId numeric fund id, e.g. "100060"
 * @param {object} [opts] { navPeriod, interval }
 * @returns raw upstream response body
 */
export async function fetchCategoryReturns(fundId, { navPeriod, interval } = {}) {
  const params = {};
  if (navPeriod != null) params.navPeriod = navPeriod;
  if (interval != null) params.interval = interval;
  const response = await axios.get(
    `${API_BASE_URL}/api/mutual-fund/${fundId}/category-returns`,
    { params }
  );
  return response.data;
}
