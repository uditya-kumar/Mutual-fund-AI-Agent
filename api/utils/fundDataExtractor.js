import * as cheerio from 'cheerio';

/**
 * Parses the Upstox mutual fund HTML page and extracts all relevant data
 * @param {string} html - The HTML content to parse
 * @returns {object} - Extracted mutual fund data as JSON
 */
export function parseMutualFundHTML(html) {
  const $ = cheerio.load(html);
  
  // Extract the __NEXT_DATA__ JSON which contains all the fund data
  const nextDataScript = $('#__NEXT_DATA__').html();
  
  if (!nextDataScript) {
    throw new Error('Could not find __NEXT_DATA__ in HTML');
  }
  
  const nextData = JSON.parse(nextDataScript);
  const pageProps = nextData.props.pageProps;
  
  // Extract and structure the data
  const fundData = {
    // Basic fund information
    fundBasics: {
      schemeId: pageProps.upstoxSchemeId,
      schemeName: pageProps.fundBasics.schemeName,
      displayName: pageProps.fundBasics.displaySchemeName,
      legalName: pageProps.fundBasics.schemeLegalName,
      isin: pageProps.fundBasics.isin,
      launchDate: pageProps.fundBasics.launchDate,
      allotmentDate: pageProps.fundBasics.allotmentDate,
      schemeType: pageProps.fundBasics.schemeType,
      fundType: pageProps.fundBasics.fundType,
      fundAssetType: pageProps.fundBasics.fundAssetType,
      displayAssetClass: pageProps.fundBasics.displayAssetClass,
      schemePlan: pageProps.fundBasics.schemePlan,
      investmentPlan: pageProps.fundBasics.invstPlan,
      isOpenEnded: pageProps.fundBasics.isOpenEnded,
      isActive: pageProps.fundBasics.active,
      isETF: pageProps.fundBasics.etf,
      isNFO: pageProps.fundBasics.isNfo,
      nfoStartDate: pageProps.fundBasics.nfoStartDate,
      nfoEndDate: pageProps.fundBasics.nfoEndDate,
      isPurchaseAvailable: pageProps.fundBasics.isPurchaseAvailable,
      maturityDate: pageProps.fundBasics.maturityDate,
      performanceStartDate: pageProps.fundBasics.performanceStartDate,
      amcId: pageProps.fundBasics.amcId,
      amcName: pageProps.fundBasics.amcName,
      distributionFrequency: pageProps.fundBasics.distributionFrequency,
    },
    
    // NAV and pricing
    navInfo: {
      nav: pageProps.fundBasics.nav,
      navDate: pageProps.fundBasics.navDate,
      navChange: pageProps.fundBasics.navChange,
      sellNavDate: pageProps.fundBasics.sellNavDate,
      dividend: pageProps.fundBasics.dividend,
      dividendDate: pageProps.fundBasics.dividendDate,
    },
    
    // Returns
    returns: {
      oneYear: pageProps.fundBasics.oneYearReturn,
      threeYear: pageProps.fundBasics.threeYearReturn,
      fiveYear: pageProps.fundBasics.fiveYearReturn,
      cagr: pageProps.fundBasics.cagr,
    },
    
    // Fund metrics
    metrics: {
      aum: pageProps.fundBasics.aum,
      expenseRatio: pageProps.fundBasics.expratio,
      alpha3Yr: pageProps.fundBasics.alpha3Yr,
      sharpeRatio3Yr: pageProps.fundBasics.sharpeRatio3Yr,
      risk: pageProps.fundBasics.risk,
      benchmarks: pageProps.fundBasics.benchMark,
      ytm: pageProps.fundBasics.ytm,
      creditQuality: pageProps.fundBasics.creditQuality,
      ytmVsCategory: pageProps.fundRatingsInitialData?.fundRatings?.ytmVsCategory,
    },
    
    // Investment details
    investmentDetails: {
      minInvestment: pageProps.fundBasics.minInvst,
      additionalMinInvestment: pageProps.fundBasics.addMinInvst,
      lockInPeriod: pageProps.fundBasics.lockInPeriod,
      purchaseAllowed: pageProps.fundBasics.purchaseAllowed,
      redemptionAllowed: pageProps.fundBasics.redemptionAllowed,
      redemptionQtyMultiplier: pageProps.fundBasics.redemptionQtyMultiplier,
      sipAllowed: pageProps.fundBasics.sipFlag === 'Y',
      settlementType: pageProps.fundBasics.settlementType,
    },
    
    // SIP details
    sipDetails: pageProps.fundBasics.sipObject?.map(sip => ({
      frequency: sip.frequency,
      minInvestment: sip.minInvst,
      maxInvestment: sip.maxInvst,
      multiplierAmount: sip.sipMultiplierAmount,
      minInstallments: sip.minInstallments,
      maxInstallments: sip.maxInstallments,
    })) || [],
    
    // Exit load
    exitLoad: pageProps.fundBasics.exitLoad?.map(load => ({
      description: load.description,
      rate: load.rate,
      unit: load.unit,
      startingBreakpoint: load.startingBreakpoint,
      endingBreakpoint: load.endingBreakpoint,
      maxExitLoad: load.maxExitLoad,
    })) || [],
    
    // Tax information
    taxInfo: pageProps.fundBasics.tax || [],
    
    // Fund managers
    fundManagers: pageProps.fundBasics.fundManagers?.map(manager => ({
      name: manager.name,
      experienceYears: manager.experienceInYears,
      totalAum: manager.totalAum,
    })) || [],
    
    // AMC (Asset Management Company) details
    amcDetails: {
      name: pageProps.amcData.name,
      displayName: pageProps.fundHouseDetailsInitialData?.displayName,
      description: pageProps.amcData.description,
      rank: pageProps.fundHouseDetailsInitialData?.rank,
      totalAum: pageProps.fundHouseDetailsInitialData?.totalAum,
      inceptionDate: pageProps.fundHouseDetailsInitialData?.inceptionDate,
    },
    
    // Fund ratings
    ratings: {
      morningstarRating: pageProps.fundRatingsInitialData?.fundRatings?.mstar,
      isTopRated: pageProps.fundRatingsInitialData?.fundRatings?.topRated,
      riskVsCategory: pageProps.fundRatingsInitialData?.fundRatings?.riskVsCategory,
      returnVsCategory: pageProps.fundRatingsInitialData?.fundRatings?.returnVsCategory,
      aumRating: pageProps.fundRatingsInitialData?.fundRatings?.aum,
      expenseRatioRating: pageProps.fundRatingsInitialData?.fundRatings?.expRatio,
      creditRating: pageProps.fundRatingsInitialData?.fundRatings?.creditRating,
    },
    
    // Fund allocation/distribution
    allocation: {
      assetAllocation: pageProps.fundDistributionInitialData?.allocations?.map(alloc => ({
        name: alloc.name,
        percentage: alloc.value,
        portfolioDate: alloc.portfolioDate,
      })) || [],
      marketCapAllocation: pageProps.fundDistributionInitialData?.marketCapital?.map(cap => ({
        name: cap.name,
        percentage: cap.value,
        portfolioDate: cap.portfolioDate,
      })) || [],
    },
    
    // Holdings
    holdings: {
      topHoldings: pageProps.fundAllocationInitialData?.holdings?.slice(0, 20).map(holding => ({
        name: holding.holdingName,
        percentage: holding.holdingPercentage,
        isin: holding.isin,
        type: holding.type,
      })) || [],
      sectorHoldings: pageProps.fundAllocationInitialData?.sectHoldings?.map(sector => ({
        sector: sector.sectName,
        percentage: sector.percent,
      })) || [],
      creditRatings: pageProps.fundAllocationInitialData?.creditRatings?.map(rating => ({
        rating: rating.rating,
        percent: rating.percent,
      })) || [],
    },
    
    // Fund types/variants
    fundTypes: pageProps.fundBasics.fundTypes?.map(type => ({
      schemeId: type.upstoxSchemeId,
      type: type.type,
      distributionFrequency: type.distributionFrequency,
      isin: type.isin,
    })) || [],
  };
  
  return fundData;
}

export default parseMutualFundHTML;
