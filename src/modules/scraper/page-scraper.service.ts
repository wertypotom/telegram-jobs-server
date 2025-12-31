import { Logger } from '@utils/logger';
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * PageScraperService - Fetches and extracts text from external job pages
 */
export class PageScraperService {
  private readonly REQUEST_TIMEOUT_MS = 10000;
  private readonly USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  /**
   * Scrape job page content from an external URL
   * Returns clean text suitable for AI parsing, or null on failure
   */
  async scrapeJobPage(url: string): Promise<string | null> {
    try {
      Logger.debug('Fetching external job page', { url });

      const response = await axios.get(url, {
        timeout: this.REQUEST_TIMEOUT_MS,
        headers: {
          'User-Agent': this.USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
        },
        maxRedirects: 5,
      });

      if (response.status !== 200) {
        Logger.warn('Non-200 response from job page', {
          url,
          status: response.status,
        });
        return null;
      }

      const html = response.data;
      const text = this.extractTextFromHtml(html);

      if (!text || text.length < 50) {
        Logger.debug('Extracted text too short', { url, length: text?.length });
        return null;
      }

      Logger.debug('Successfully extracted job page content', {
        url,
        textLength: text.length,
      });

      return text;
    } catch (error: any) {
      Logger.warn('Failed to fetch job page', {
        url,
        error: error.message || error,
      });
      return null;
    }
  }

  /**
   * Extract readable text from HTML, removing scripts, styles, and navigation
   */
  private extractTextFromHtml(html: string): string {
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, noscript, iframe, nav, header, footer, aside').remove();
    $('[class*="menu"], [class*="sidebar"], [class*="cookie"]').remove();
    $('[class*="nav"], [class*="footer"], [class*="header"]').remove();

    // Try to find main content area
    const mainContent =
      $('main').text() ||
      $('article').text() ||
      $('[class*="vacancy"]').text() ||
      $('[class*="job"]').text() ||
      $('[class*="content"]').first().text() ||
      $('body').text();

    // Clean up whitespace
    const cleanText = mainContent
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    // Limit length to avoid excessive AI tokens
    const MAX_LENGTH = 5000;
    return cleanText.length > MAX_LENGTH ? cleanText.substring(0, MAX_LENGTH) : cleanText;
  }

  /**
   * Check if a URL is a Telegram link (internal, not external)
   */
  static isTelegramLink(url: string): boolean {
    return /^https?:\/\/(t\.me|telegram\.me)\//i.test(url);
  }
}
