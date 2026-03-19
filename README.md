# snapapi

Official JavaScript SDK for the [SnapAPI](https://snapapi.tech) web intelligence API.

```bash
npm install snapapi
```

Zero dependencies. Node.js 18+ required.

## Quick Start

```js
const SnapAPI = require('snapapi');
const client = new SnapAPI(); // reads SNAPAPI_KEY env var

// Screenshot
const png = await client.screenshot('https://github.com');
require('fs').writeFileSync('screenshot.png', png);

// Metadata
const meta = await client.metadata('https://github.com');
console.log(meta.og_title, meta.og_image);

// Page analysis
const page = await client.analyze('https://stripe.com');
console.log(page.page_type, page.primary_cta, page.technologies);

// URL → PDF
const pdf = await client.pdf('https://github.com', { format: 'A4' });
require('fs').writeFileSync('page.pdf', pdf);

// HTML → image (OG cards, email previews)
const img = await client.render('<h1 style="padding:60px;font-size:48px">Hello</h1>', { width: 1200, height: 630 });
require('fs').writeFileSync('card.png', img);

// Batch — multiple URLs in parallel
const results = await client.batch(['https://stripe.com', 'https://vercel.com'], 'metadata');
results.forEach(r => console.log(r.url, r.og_title));
```

## Get a Free API Key

100 calls/month · No credit card · Active in 30 seconds

→ **[snapapi.tech/start](https://snapapi.tech/start)**

## API

### `new SnapAPI(apiKey?, options?)`

| Param | Type | Default |
|---|---|---|
| `apiKey` | `string` | `process.env.SNAPAPI_KEY` |
| `options.baseUrl` | `string` | `https://api.snapapi.tech` |
| `options.timeout` | `number` | `45000` |

### Methods

| Method | Returns | Description |
|---|---|---|
| `screenshot(url, opts?)` | `Buffer` | PNG/JPEG/WebP image |
| `metadata(url)` | `object` | OG tags, title, favicon, canonical |
| `analyze(url, opts?)` | `object` | CTAs, nav, tech stack, word count |
| `pdf(url, opts?)` | `Buffer` | PDF binary |
| `render(html, opts?)` | `Buffer` | HTML → image |
| `batch(urls, endpoint?, params?)` | `Array` | Parallel multi-URL processing |

Full parameter reference: [snapapi.tech/docs](https://snapapi.tech/docs)

## License

MIT
