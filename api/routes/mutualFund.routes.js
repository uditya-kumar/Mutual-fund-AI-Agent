import { Router } from 'express';
import { upstoxService } from '../services/upstox.service.js';
import config from '../config.js';
const router = Router();

// Base URL for Upstox mutual funds
const UPSTOX_MF_BASE = config.urls.upstox.mutualFunds;

/**
 * Build full Upstox URL from fund slug
 * @param {string} fundSlug - e.g., 'icici-prudential-liquid-fund-direct-plan-growth-110905'
 * @returns {string} - Full Upstox URL
 */
export function buildFundUrl(fundSlug) {
  // Remove trailing slash if present
  const slug = fundSlug.replace(/\/$/, '');
  return `${UPSTOX_MF_BASE}/${slug}/`;
}

/**
 * GET /api/mutual-fund
 * Fetch and parse mutual fund data as JSON
 * Requires: ?fund=<fund-slug> (e.g., parag-parikh-flexi-cap-direct-growth-100060)
 */
router.get('/', async (req, res) => {
  try {
    const { fund } = req.query;
    if (!fund) {
      return res.status(400).json({ 
        error: 'Missing required query param: fund',
        example: '/api/mutual-fund?fund=parag-parikh-flexi-cap-direct-growth-100060'
      });
    }
    const fundUrl = buildFundUrl(fund);
    const fundData = await upstoxService.getMutualFundData(fundUrl);
    res.json(fundData);
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch mutual fund data', 
      message: error.message 
    });
  }
});

/**
 * GET /api/mutual-fund/raw
 * Get raw HTML (for debugging)
 * Requires: ?fund=<fund-slug>
 */
router.get('/raw', async (req, res) => {
  try {
    const { fund } = req.query;
    if (!fund) {
      return res.status(400).json({ 
        error: 'Missing required query param: fund',
        example: '/api/mutual-fund/raw?fund=parag-parikh-flexi-cap-direct-growth-100060'
      });
    }
    const fundUrl = buildFundUrl(fund);
    const html = await upstoxService.getMutualFundRawHTML(fundUrl);
    res.send(html);
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch mutual fund data', 
      message: error.message 
    });
  }
});

/**
 * GET /api/mutual-fund/:fundId/nav-history
 * Fetch NAV history for a given fund
 */
router.get('/:fundId/nav-history', async (req, res) => {
  try {
    const { fundId } = req.params;
    const { investedAmount, navPeriod, interval } = req.query;

    const data = await upstoxService.getNavHistory(fundId, {
      investedAmount,
      navPeriod,
      interval,
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching NAV history:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch NAV history', 
      message: error.message 
    });
  }
});

/**
 * GET /api/mutual-fund/:fundId/category-returns
 * Fetch category returns comparison for a given fund
 */
router.get('/:fundId/category-returns', async (req, res) => {
  try {
    const { fundId } = req.params;
    const { investedAmount, navPeriod, interval } = req.query;

    const data = await upstoxService.getCategoryReturns(fundId, {
      investedAmount,
      navPeriod,
      interval,
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching category returns:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch category returns', 
      message: error.message 
    });
  }
});

/**
 * GET /api/search
 * Search funds by keyword
 */
router.get('/search', async (req, res) => {
  try {
    const { query, segments, records, pageNumber } = req.query;

    const data = await upstoxService.search({
      query,
      segments,
      records,
      pageNumber,
    });
    res.json(data);
  } catch (error) {
    console.error('Error searching:', error.message);
    res.status(500).json({ 
      error: 'Failed to search', 
      message: error.message 
    });
  }
});

export default router;
