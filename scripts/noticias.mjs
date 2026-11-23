// Robot de noticias de Ojo al Dron — corre en GitHub Actions cada 30 minutos
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const QUERIES = [
  'HATU drones', 'Haminton Smith drones',
  'drones Caucasia', 'drones Bajo Cauca', 'dron Caucasia Antioquia',
  'ataque con drones Antioquia', 'drones explosivos Colombia',
  'Aerocivil drones', 'antidrones Colombia', 'drones Córdoba Colombia'
];
const url = q => 'https://news.google.com/rss/search?q=' + encodeURIComponent(q + ' when:14d') + '&hl=es-419&gl=CO&ceid=CO:es-419';
const dec = s => s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
const tag = (x, t) => { const m = x.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return m ? dec(m[1]) : ''; };
const norm = t => t.toLowerCase().replace(/[^a-záéíóúñü0-9 ]/g, '').slice(0, 70);

const old = existsSync('noticias.json') ? JSON.parse(readFileSync('noticias.json', 'utf8')).items || [] : [];
const items = [...old];
const seen = new Set(items.map(i => norm(i.titulo)));

for (const q of QUERIES) {
  try {
    const r = await fetch(url(q), { headers: { 'User-Agent': 'Mozilla/5.0 OjoAlDron/1.0' } });
    const xml = await r.text();
    for (const it of xml.split('<item>').slice(1)) {
      let titulo = tag(it, 'title'); const fuente = tag(it, 'source') || titulo.split(' - ').pop();
      titulo = titulo.replace(/\s+-\s+[^-]+$/, '');
      const k = norm(titulo);
      if (!titulo || seen.has(k)) continue;
      // solo notas sobre drones
      if (!/dron|antidron|uas|aerocivil|hatu/i.test(titulo)) continue;
      seen.add(k);
      items.push({ titulo, enlace: tag(it, 'link'), fuente, fecha: new Date(tag(it, 'pubDate') || Date.now()).toISOString(), consulta: q });
    }
  } catch (e) { console.error('Fallo', q, e.message); }
}

items.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
const out = { actualizado: new Date().toISOString(), total: Math.min(items.length, 150), items: items.slice(0, 150) };
writeFileSync('noticias.json', JSON.stringify(out, null, 1));
console.log('Noticias:', out.total);
