//scraperService.js

const puppeteer = require('puppeteer');

const TARGET_URLS = [

  'https://www.bioriidl.org/', 'https://www.bioriidl.org/about', 'https://www.bioriidl.org/programs',
  'https://www.bioriidl.org/startups', 'https://www.bioriidl.org/diy-biolab', 'https://www.bioriidl.org/ibsc',
  'https://riidl.somaiya.edu/', 'https://riidl.org/', 'https://riidl.org/about', 'https://riidl.org/startups',
  'https://riidl.org/research', 'https://riidl.org/innovation', 'https://riidl.org/incubation',
  'https://riidl.org/design', 'https://riidl.org/laboratory', 'https://riidl.org/booking',
  'https://riidl.org/programs/funding-program/nidhi-sss',
  'https://riidl.org/programs/funding-program/nidhi-eir',
  'https://riidl.org/programs/funding-program/nidhi-prayas',
  'https://riidl.org/programs/funding-program/Msins',
  'https://riidl.org/programs/funding-program/Sisfs',
  'https://riidl.org/programs/funding-program/samridh',
  'https://riidl.org/programs/corporate-program/omniactive/cohort-1',
  'https://riidl.org/programs/corporate-program/omniactive/cohort-2',
  'https://riidl.org/programs/corporate-program/futurance',
  'https://riidl.org/programs/corporate-program/NVI',
  'https://riidl.org/programs/corporate-program/HDFC-Parivartan',
];

let dataCache = { riidl: '', bioriidl: '' };

async function performScrapeJob() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  dataCache = { riidl: '', bioriidl: '' };
  const pages = [];
  await Promise.all(TARGET_URLS.map(async (url) => {
    const page = await browser.newPage();
    try {
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (['image', 'font', 'stylesheet'].includes(req.resourceType())) req.abort();
        else req.continue();
      });

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      const text = await page.evaluate((u) => {
        const main = document.querySelector('main') || document.body;
        return main.innerText.substring(0, 4000);
      }, url);
      const content = `\n[SOURCE: ${url}]\n${text}`;
      pages.push({ url, text });
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes('bioriidl.org')) {
        dataCache.bioriidl += content;
      } else if (lowerUrl.includes('riidl.org') || lowerUrl.includes('riidl.somaiya.edu')) {
        dataCache.riidl += content;
      }
    } catch (e) {
      console.error(`Scrape failed for ${url}: ${e.message}`);
    } finally {
      await page.close();
    }
  }));

  await browser.close();
  console.log(`[Scraper] Scraped ${pages.length} pages.`);
  return pages;
}

const getCachedWebsiteContext = () => dataCache;

module.exports = { performScrapeJob, getCachedWebsiteContext };

