/**
 * Kontramarka.ua Web Scraper
 * Scrapes upcoming events from Kontramarka.ua
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedEvent {
  id: string;
  title: string;
  artistName: string;
  date: string;
  venue: string;
  city: string;
  ticketUrl: string;
  imageUrl?: string;
  price?: string;
  source: 'kontramarka';
}

async function scrapeKontramarka(city?: string): Promise<ScrapedEvent[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );

    // Kontramarka.ua has concert section
    const url = 'https://kontramarka.ua/ua/afisha/concerts';
    console.log('Navigating to:', url);

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('.event, .poster, [class*="event"]', { timeout: 10000 });

    const events = await page.evaluate(() => {
      const eventElements = document.querySelectorAll(
        '.event, .poster, .event-card, article[class*="event"]'
      );

      return Array.from(eventElements)
        .slice(0, 50)
        .map((element, index) => {
          try {
            const titleElement = element.querySelector('h2, h3, .title, [class*="title"]');
            const title = titleElement?.textContent?.trim() || 'Unknown Event';

            const dateElement = element.querySelector('.date, time, [class*="date"]');
            const dateText = dateElement?.textContent?.trim() || '';

            const venueElement = element.querySelector('.venue, [class*="venue"]');
            const venue = venueElement?.textContent?.trim() || 'Unknown Venue';

            const linkElement = element.querySelector('a');
            const ticketUrl = linkElement?.getAttribute('href') || '';
            const fullUrl = ticketUrl.startsWith('http')
              ? ticketUrl
              : `https://kontramarka.ua${ticketUrl}`;

            const imageElement = element.querySelector('img');
            const imageUrl = imageElement?.getAttribute('src') || imageElement?.getAttribute('data-src') || '';

            const priceElement = element.querySelector('.price, [class*="price"]');
            const price = priceElement?.textContent?.trim() || '';

            const id = ticketUrl.split('/').pop() || `kontramarka-${index}`;

            return {
              id,
              title,
              artistName: title,
              date: dateText,
              venue,
              city: 'Kyiv', // Default, can be extracted if visible
              ticketUrl: fullUrl,
              imageUrl: imageUrl.startsWith('http') ? imageUrl : `https://kontramarka.ua${imageUrl}`,
              price,
              source: 'kontramarka' as const,
            };
          } catch (err) {
            return null;
          }
        })
        .filter(Boolean) as ScrapedEvent[];
    });

    console.log(`Scraped ${events.length} events from Kontramarka.ua`);
    return events;
  } catch (error) {
    console.error('Error scraping Kontramarka:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city } = await req.json().catch(() => ({ city: null }));

    const events = await scrapeKontramarka(city);

    return new Response(
      JSON.stringify({
        success: true,
        events,
        count: events.length,
        source: 'kontramarka',
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape Kontramarka';

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
