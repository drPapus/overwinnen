const fs = require('fs');
const base = 'https://overwinnen.it.com';
const image = `${base}/src/assets/images/aim-hero-visual.png`;
const pages = {
  'problems/ankle-foot/index.html': ['/problems/ankle-foot/', 'Ankle & Foot Movement Training | AIM Method', 'Explore assessment-led movement and strength coaching designed to develop ankle and foot control, confidence and capacity for daily activity and sport.'],
  'problems/healthy-ageing/index.html': ['/problems/healthy-ageing/', 'Healthy Ageing Strength & Movement | AIM Method', 'Build strength, balance, mobility and movement confidence with individual coaching adapted to your current capacity, daily activities and long-term goals.'],
  'problems/posture/index.html': ['/problems/posture/', 'Posture & Movement Coaching | AIM Method Training', 'Explore an adaptable approach to posture through movement variety, strength and control coaching shaped around your activities, capacity and goals.'],
  'problems/sports-performance/index.html': ['/problems/sports-performance/', 'Sports Performance Training | AIM Method Coaching', 'Develop strength, power, movement quality and physical capacity with individual performance coaching aligned to your sport and competition demands.'],
  'programs/combat-sports-performance/index.html': ['/programs/combat-sports-performance/', 'Combat Sports Performance | AIM Method Coaching', 'Build strength, power, conditioning and resilience with individual physical preparation aligned to combat-sport practice, recovery and competition.'],
  'programs/strength-powerlifting/index.html': ['/programs/strength-powerlifting/', 'Strength & Powerlifting Coaching | AIM Method', 'Develop strength and powerlifting technique with individual programming, progressive loading and coaching shaped around your experience and performance goals.']
};
const esc = s => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
for (const [file, [path, title, description]] of Object.entries(pages)) {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/i, `<meta name="description" content="${esc(description)}" />`);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);
  const tags = `<meta property="og:type" content="website"><meta property="og:site_name" content="AIM Method"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${base}${path}"><meta property="og:image" content="${image}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${image}">`;
  html = html.replace(/(<link rel="canonical"[^>]*>)/i, `$1${tags}`);
  const section = path.split('/').filter(Boolean)[0];
  const name = path.split('/').filter(Boolean).pop().split('-').map(x => x[0].toUpperCase() + x.slice(1)).join(' ');
  const schema = {'@context':'https://schema.org','@graph':[{'@type':'WebPage',name:title,url:`${base}${path}`,description},{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:`${base}/`},{'@type':'ListItem',position:2,name:section[0].toUpperCase()+section.slice(1),item:`${base}/${section}/`},{'@type':'ListItem',position:3,name,item:`${base}${path}`}]}]};
  html = html.replace(/(<title>[\s\S]*?<\/title>)/i, `$1<script type="application/ld+json">${JSON.stringify(schema)}</script>`);
  fs.writeFileSync(file, html);
}
