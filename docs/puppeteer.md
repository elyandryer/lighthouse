# Recipes Puppeteer with Lighthouse

**Note**: https://github.com/GoogleChrome/lighthouse/issues/3837 tracks the discussion for making Lighthouse work in concert with Puppeteer.
Some things are possible today (login to a page using Puppeteer, audit it using Lighthouse) while others (A/B testing the perf of UI changes) are not.

### Custom network throttle settings using Puppeteer

By default, Lighthouse uses a mobile 3G connecton for it's network throttlings. It's possible to use Puppeter
to launch Chrome and customize these settings. 

Flow: 
1. disable the throttling settings in Lighthouse.
2. Launch Chrome using Puppeteer and tell Lighthouse to reuse Puppeteer's chrome instance.
3. Tell lighthouse to programmatically load the page.
4. Watch for the page to open and set the emulation conditions:

```js
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');;
const {URL} = require('url');

(async() => {
const url = 'https://www.chromestatus.com/features';
const networkConditions = {
  offline: false,
  latency: 800,
  downloadThroughput: Math.floor(1.6 * 1024 * 1024 / 8), // 1.6Mbps
  uploadThroughput: Math.floor(750 * 1024 / 8) // 750Kbps
};

// Use Puppeteer to launch headless Chrome.
const browser = await puppeteer.launch({headless: true});

// Wait for Lighthouse to open url, then customize network conditions.
// Note: this will re-establish these conditions when LH reloads the page. Think that's ok....
browser.on('targetchanged', async target => {
  const page = await target.page();

  if (page && page.url() === url) {
    const client = await page.target().createCDPSession();
    await client.send('Network.emulateNetworkConditions', networkConditions);
  }
});

// Lighthouse will open URL. Puppeteer observes `targetchanged` and sets up network conditions.
// Possible race condition.
const lhr = await lighthouse(url, {
  port: (new URL(browser.wsEndpoint())).port,
  output: 'json',
  logLevel: 'info',
  disableNetworkThrottling: true,
  // disableCpuThrottling: true,
  disableDeviceEmulation: true,
});

console.log(`Lighthouse score: ${lhr.score}`);

await browser.close();
})();
```

### Connecting Puppeteer to a browser instance launched by chrome-launcher.

When using Lighthouse programmatically, you'll often use chrome-launcher to launch Chrome.
Puppeteer can reconnect to this existing browser instance like so:

```js
onst chromeLauncher = require('chrome-launcher');
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const request = require('request');
const util = require('util');

(async() => {

const URL = 'https://www.chromestatus.com/features';

const opts = {
  //chromeFlags: ['--headless'],
  logLevel: 'info',
  output: 'json'
};

// Launch chrome using chrome-launcher.
const chrome = await chromeLauncher.launch(opts);
opts.port = chrome.port;

// Connect to it using puppeteer.connect().
const resp = await util.promisify(request)(`http://localhost:${opts.port}/json/version`);
const {webSocketDebuggerUrl} = JSON.parse(resp.body);
const browser = await puppeteer.connect({browserWSEndpoint: webSocketDebuggerUrl});

// Run Lighthouse.
const lhr = await lighthouse(URL, opts, null);
console.log(`Lighthouse score: ${lhr.score}`);

await browser.disconnect();
await chrome.kill();

})();
```
