// Configuration for Upstox API

export const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
  },

  // Default request headers
  headers: {
    default: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.7',
    },
    api: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
      'accept': 'application/json, text/plain, */*',
      'origin': 'https://upstox.com',
      'referer': 'https://upstox.com/',
    },
  },

  // API URLs
  urls: {
    upstox: {
      base: 'https://upstox.com',
      mutualFunds: 'https://upstox.com/mutual-funds',
      service: 'https://service.upstox.com',
      mutualFundsApi: 'https://service.upstox.com/mutual-funds/open',
      searchApi: 'https://service.upstox.com/search/open/v1/',
    },
  },

  // Default query parameters
  defaults: {
    navHistory: {
      investedAmount: 1000,
      navPeriod: '5Y',
      interval: 1,
    },
    categoryReturns: {
      investedAmount: 1000,
      navPeriod: '5Y',
      interval: 30,
    },
    search: {
      segments: 'ALL,US_EQ,OPTION_CHAIN',
      records: 15,
      pageNumber: 1,
    },
  },
};

export default config;
