const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const base = 'https://overwinnen.it.com';
const failures = [];
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  if (entry.name === '.git') return [];
  const file = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(file) : [file];
});
const htmlFiles = walk(root).filter(file => file.endsWith('.html'));
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);

if (!sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) failures.push('sitemap.xml: missing valid XML declaration');
if (urls.length !== 25) failures.push(`sitemap.xml: expected 25 URLs, found ${urls.length}`);
if (new Set(urls).size !== urls.length) failures.push('sitemap.xml: duplicate URLs');
if (urls.some(url => !url.startsWith(`${base}/`) || !url.endsWith('/') || /index\.html|bieden\.html/.test(url))) failures.push('sitemap.xml: noncanonical URL found');

const titles = new Map();
const descriptions = new Map();
for (const file of htmlFiles) {
  const rel = path.relative(root, file);
  const html = fs.readFileSync(file, 'utf8');
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
  const count = regex => [...withoutComments.matchAll(regex)].length;
  if (!/<html\s+lang="en">/i.test(html)) failures.push(`${rel}: document language is not en`);
  if (/meta\s+name="keywords"/i.test(html)) failures.push(`${rel}: keywords tag found`);
  if (/Tilburg|Word Sterk, Atletisch en Zelfverzekerd/i.test(html)) failures.push(`${rel}: obsolete SEO copy found`);
  if (count(/<h1\b/gi) !== 1) failures.push(`${rel}: expected one H1, found ${count(/<h1\b/gi)}`);
  if (/<h[1-6][^>]*>\s*<\/h[1-6]>/i.test(withoutComments)) failures.push(`${rel}: empty heading found`);
  if (rel === 'bieden.html' || rel === 'elements.html') continue;
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1];
  if (!title) failures.push(`${rel}: title missing`); else if (titles.has(title)) failures.push(`${rel}: duplicate title with ${titles.get(title)}`); else titles.set(title, rel);
  if (!description) failures.push(`${rel}: description missing`); else if (descriptions.has(description)) failures.push(`${rel}: duplicate description with ${descriptions.get(description)}`); else descriptions.set(description, rel);
  if (count(/<link\s+rel="canonical"/gi) !== 1) failures.push(`${rel}: expected one canonical`);
  for (const field of ['og:type', 'og:site_name', 'og:title', 'og:description', 'og:url']) if (!html.includes(`property="${field}"`)) failures.push(`${rel}: ${field} missing`);
  for (const field of ['twitter:card', 'twitter:title', 'twitter:description']) if (!html.includes(`name="${field}"`)) failures.push(`${rel}: ${field} missing`);
  for (const match of html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); } catch { failures.push(`${rel}: invalid JSON-LD`); }
  }
  for (const match of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/gi)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|tel:)/i.test(href)) continue;
    const [hrefPath, fragment] = href.split('#');
    let target = hrefPath
      ? (hrefPath.startsWith('/') ? path.join(root, hrefPath) : path.resolve(path.dirname(file), hrefPath))
      : file;
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) { failures.push(`${rel}: broken link ${href}`); continue; }
    if (fragment && target.endsWith('.html')) {
      const targetHtml = fs.readFileSync(target, 'utf8');
      if (!new RegExp(`\\bid=["']${fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(targetHtml)) failures.push(`${rel}: missing fragment target ${href}`);
    }
  }
}

for (const url of urls) {
  const rel = url === `${base}/` ? 'index.html' : `${url.slice(base.length + 1)}index.html`;
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) { failures.push(`${url}: sitemap target missing`); continue; }
  const html = fs.readFileSync(file, 'utf8');
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
  if (canonical !== url) failures.push(`${rel}: canonical ${canonical || 'missing'} does not match sitemap ${url}`);
  if (/noindex/i.test(html.match(/<meta\s+name="robots"[^>]*>/i)?.[0] || '')) failures.push(`${rel}: sitemap page is noindex`);
}

const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8').trim();
if (robots !== `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml`) failures.push('robots.txt: unexpected content');
const redirects = fs.readFileSync(path.join(root, '_redirects'), 'utf8').trim().split('\n').map(line => line.trim().split(/\s+/));
for (const [source, destination] of redirects) if (source === destination || redirects.some(([other]) => other === destination)) failures.push(`_redirects: possible loop at ${source}`);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`SEO validation passed: ${htmlFiles.length} HTML files audited, ${urls.length} canonical sitemap URLs verified.`);
