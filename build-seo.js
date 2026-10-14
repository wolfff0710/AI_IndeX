// Generates /alternatives/*.html, sitemap.xml, robots.txt from the T array in index.html. Run: node build-seo.js
const fs=require("fs"),h=fs.readFileSync("index.html","utf8");
const T=new Function("return "+h.match(/const T=(\[\s*\n[\s\S]*?\n\]);/)[1])();
const B=(process.env.SITE_URL||"https://"+(process.env.VERCEL_PROJECT_PRODUCTION_URL||"example.com")).replace(/\/$/,"");
const sl=n=>n.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),avg=t=>(t[4]+t[5]+t[6]+t[7])/4,e=s=>s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
fs.mkdirSync("alternatives",{recursive:true});const urls=[B+"/"];
T.forEach((t,i)=>{const L=T.filter((x,j)=>j!=i&&x[1]==t[1]).sort((a,b)=>avg(b)-avg(a)).slice(0,8);if(!L.length)return;
const u=`${B}/alternatives/${sl(t[0])}.html`,ds=`Top ${L.length} alternatives to ${t[0]}: ${L.slice(0,4).map(x=>x[0]).join(", ")}. Scored on quality, ease, value and features.`,
ld={"@context":"https://schema.org","@type":"ItemList",name:`Alternatives to ${t[0]}`,itemListElement:L.map((x,k)=>({"@type":"ListItem",position:k+1,name:x[0],url:x[3]}))};
fs.writeFileSync(`alternatives/${sl(t[0])}.html`,`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Best ${e(t[0])} alternatives (2026) | AIndex</title><meta name="description" content="${e(ds)}"><link rel="canonical" href="${u}"><style>body{font:16px/1.6 system-ui,sans-serif;background:#050506;color:#eef2f3;max-width:760px;margin:auto;padding:24px}a{color:#22d3ee}h1{letter-spacing:-1px}li{margin:14px 0}small{color:#8a9499}</style><script type="application/ld+json">${JSON.stringify(ld)}</script></head><body><p><a href="/">← AIndex</a></p><h1>Best alternatives to ${e(t[0])}</h1><p>${e(t[0])}: ${e(t[2])}</p><ol>${L.map(x=>`<li><b><a href="${x[3]}" rel="noopener">${e(x[0])}</a></b> <small>score ${avg(x).toFixed(1)}/10</small><br>${e(x[2])}</li>`).join("")}</ol><p><a href="/#/alt/${sl(t[0])}">Compare interactively on AIndex →</a></p></body></html>`);urls.push(u)});
fs.writeFileSync("sitemap.xml",`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u=>`<url><loc>${u}</loc></url>`).join("")}</urlset>`);
fs.writeFileSync("robots.txt",`User-agent: *\nAllow: /\nSitemap: ${B}/sitemap.xml\n`);
console.log(urls.length-1+" alternatives pages written");
