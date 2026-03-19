'use strict';
/**
 * snapapi — Official JavaScript SDK for the SnapAPI web intelligence API
 *
 * npm install snapapi
 * Docs: https://snapapi.tech/docs
 * Free key: https://snapapi.tech/start
 *
 * Zero runtime dependencies. Node.js 18+ required (uses built-in fetch).
 */

const BASE_URL = 'https://api.snapapi.tech';

class SnapAPIError extends Error {
  constructor(status, message) {
    super(`SnapAPI ${status}: ${message}`);
    this.name = 'SnapAPIError';
    this.status = status;
  }
}

class SnapAPI {
  /**
   * @param {string} [apiKey] - API key. Falls back to SNAPAPI_KEY env var.
   * @param {object} [options]
   * @param {string} [options.baseUrl] - Override API base URL.
   * @param {number} [options.timeout] - Request timeout in ms (default 45000).
   */
  constructor(apiKey, options = {}) {
    this._key = apiKey || (typeof process !== 'undefined' && process.env.SNAPAPI_KEY) || '';
    this._base = (options.baseUrl || BASE_URL).replace(/\/$/, '');
    this._timeout = options.timeout || 45_000;
    if (!this._key) {
      throw new SnapAPIError(0, 'No API key. Set SNAPAPI_KEY env var or pass apiKey to constructor. Free key at https://snapapi.tech/start');
    }
  }

  async _get(path, params = {}) {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]))
    ).toString();
    const url = `${this._base}${path}${qs ? '?' + qs : ''}`;
    const signal = AbortSignal.timeout(this._timeout);
    const res = await fetch(url, { headers: { 'x-api-key': this._key }, signal });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const j = await res.json(); msg = j.error || msg; } catch {}
      throw new SnapAPIError(res.status, msg);
    }
    return res;
  }

  async _post(path, body) {
    const signal = AbortSignal.timeout(this._timeout);
    const res = await fetch(`${this._base}${path}`, {
      method: 'POST',
      headers: { 'x-api-key': this._key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const j = await res.json(); msg = j.error || msg; } catch {}
      throw new SnapAPIError(res.status, msg);
    }
    return res;
  }

  /**
   * Capture a screenshot of any URL.
   * @param {string} url
   * @param {object} [opts]
   * @param {'png'|'jpeg'|'webp'} [opts.format='png']
   * @param {number} [opts.width=1280]
   * @param {number} [opts.height=800]
   * @param {boolean} [opts.full_page=false]
   * @param {boolean} [opts.dark_mode=false]
   * @param {string} [opts.device] - e.g. 'iphone14', 'pixel7', 'ipad'
   * @param {string} [opts.selector] - CSS selector to capture only that element
   * @param {number} [opts.delay] - Extra ms to wait before capture
   * @returns {Promise<Buffer>} Raw image bytes
   */
  async screenshot(url, opts = {}) {
    const res = await this._get('/v1/screenshot', { url, ...opts });
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * Extract metadata from a URL (OG tags, title, favicon, canonical, etc.)
   * @param {string} url
   * @returns {Promise<object>}
   */
  async metadata(url) {
    const res = await this._get('/v1/metadata', { url });
    return res.json();
  }

  /**
   * Full page analysis — CTAs, nav, tech stack, word count, load time.
   * @param {string} url
   * @param {object} [opts]
   * @param {boolean} [opts.screenshot=false] - Include base64 screenshot in response
   * @returns {Promise<object>}
   */
  async analyze(url, opts = {}) {
    const res = await this._get('/v1/analyze', { url, ...opts });
    return res.json();
  }

  /**
   * Convert any URL to a PDF.
   * @param {string} url
   * @param {object} [opts]
   * @param {'A4'|'A3'|'A5'|'Letter'|'Legal'|'Tabloid'} [opts.format='A4']
   * @param {boolean} [opts.landscape=false]
   * @param {number} [opts.margin_top=20]
   * @param {number} [opts.margin_bottom=20]
   * @param {number} [opts.margin_left=20]
   * @param {number} [opts.margin_right=20]
   * @param {boolean} [opts.print_background=true]
   * @param {number} [opts.scale=1]
   * @returns {Promise<Buffer>} Raw PDF bytes
   */
  async pdf(url, opts = {}) {
    const res = await this._get('/v1/pdf', { url, ...opts });
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * Render raw HTML to a pixel-perfect image.
   * @param {string} html - Full HTML string
   * @param {object} [opts]
   * @param {number} [opts.width=1200]
   * @param {number} [opts.height=630]
   * @param {'png'|'jpeg'|'webp'} [opts.format='png']
   * @returns {Promise<Buffer>} Raw image bytes
   */
  async render(html, opts = {}) {
    const res = await this._post('/v1/render', { html, width: 1200, height: 630, format: 'png', ...opts });
    return Buffer.from(await res.arrayBuffer());
  }

  /**
   * Process multiple URLs in parallel.
   * @param {string[]} urls
   * @param {'screenshot'|'metadata'|'analyze'} [endpoint='screenshot']
   * @param {object} [params] - Extra params forwarded to each URL call
   * @returns {Promise<Array>} Array of per-URL results
   */
  async batch(urls, endpoint = 'screenshot', params = {}) {
    const res = await this._post('/v1/batch', { urls, endpoint, params });
    const data = await res.json();
    return data.results ?? [];
  }
}

module.exports = SnapAPI;
module.exports.SnapAPI = SnapAPI;
module.exports.SnapAPIError = SnapAPIError;
