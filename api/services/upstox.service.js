import axios from 'axios';
import config from '../config.js';
import { parseMutualFundHTML } from '../utils/fundDataExtractor.js';

/**
 * Upstox Service - Handles all external API calls to Upstox
 */
class UpstoxService {
  /**
   * Fetch mutual fund page HTML and parse it
   * @param {string} fundUrl - The URL of the mutual fund page
   * @returns {Promise<object>} - Parsed fund data
   */
  async getMutualFundData(fundUrl) {
    const options = {
      method: 'GET',
      url: fundUrl,
      headers: config.headers.default,
    };

    const response = await axios.request(options);
    return parseMutualFundHTML(response.data);
  }

  /**
   * Fetch raw HTML for a mutual fund page
   * @param {string} fundUrl - The URL of the mutual fund page
   * @returns {Promise<string>} - Raw HTML content
   */
  async getMutualFundRawHTML(fundUrl) {
    const options = {
      method: 'GET',
      url: fundUrl,
      headers: config.headers.default,
    };

    const response = await axios.request(options);
    return response.data;
  }

  /**
   * Fetch NAV history for a fund
   * @param {string} fundId - The fund ID
   * @param {object} params - Query parameters
   * @returns {Promise<object>} - NAV history data
   */
  async getNavHistory(fundId, params = {}) {
    const {
      investedAmount = config.defaults.navHistory.investedAmount,
      navPeriod = config.defaults.navHistory.navPeriod,
      interval = config.defaults.navHistory.interval,
    } = params;

    const options = {
      method: 'GET',
      url: `${config.urls.upstox.mutualFundsApi}/v3/funds/${fundId}/navHistory`,
      params: {
        investedAmount,
        navPeriod,
        interval,
      },
      headers: config.headers.api,
    };

    const response = await axios.request(options);
    return response.data;
  }

  /**
   * Fetch category returns comparison for a fund
   * @param {string} fundId - The fund ID
   * @param {object} params - Query parameters
   * @returns {Promise<object>} - Category returns data
   */
  async getCategoryReturns(fundId, params = {}) {
    const {
      investedAmount = config.defaults.categoryReturns.investedAmount,
      navPeriod = config.defaults.categoryReturns.navPeriod,
      interval = config.defaults.categoryReturns.interval,
    } = params;

    const options = {
      method: 'GET',
      url: `${config.urls.upstox.mutualFundsApi}/v5/funds/category-returns/${fundId}`,
      params: {
        investedAmount,
        navPeriod,
        interval,
      },
      headers: config.headers.api,
    };

    const response = await axios.request(options);
    return response.data;
  }

  /**
   * Search funds by keyword
   * @param {object} params - Search parameters
   * @returns {Promise<object>} - Search results
   */
  async search(params = {}) {
    const {
      query = '',
      segments = config.defaults.search.segments,
      records = config.defaults.search.records,
      pageNumber = config.defaults.search.pageNumber,
    } = params;

    const options = {
      method: 'GET',
      url: config.urls.upstox.searchApi,
      params: {
        query,
        segments,
        records,
        pageNumber,
      },
      headers: {
        ...config.headers.api,
        accept: '*/*',
      },
    };

    const response = await axios.request(options);
    return response.data;
  }
}

// Export a singleton instance
export const upstoxService = new UpstoxService();
export default upstoxService;
