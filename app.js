/* Ojo al Dron — Vibras Positivas HM */
(function () {
  'use strict';
  const TZ = 'America/Bogota';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const WM = (f, w = 1200) => 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(f) + '?width=' + w;
  const PHOTOS = ['A_drone_DJI_Mavic_2_Pro_flying.jpg', 'Mavic_2_Pro_flying_over_Utsunomiya.jpg', 'DJI_-_Drohne_Mavic_Air_2.JPG', 'Drone_picture_of_trees_and_lake.jpg', 'Río_Cauca.JPG'];
  const CAUCASIA = [7.9865, -75.1935];

  const EMAILS = [
    ['Aerocivil', 'atencionalciudadano@aerocivil.gov.co'],
    ['Alcaldía de Caucasia', 'contactenos@caucasia-antioquia.gov.co'],
    ['Personería de Caucasia', 'personeria@caucasia-antioquia.gov.co'],
    ['Gobernación de Antioquia', 'gestiondocumental@antioquia.gov.co'],
    ['Gobernación de Antioquia', 'gobernaciondeantioquia@antioquia.gov.co']
  ];

  let lang = 'es';
  try { lang = localStorage.getItem('oad_lang') || 'es'; } catch (e) {}
  const T = (es, en) => (lang === 'en' ? en : es);

  /* ---------- utilidades de fecha (hora real de Colombia) ---------- */
  const fmt = (d, o) => new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-CO', Object.assign({ timeZone: TZ }, o)).format(new Date(d));
  const dayKey = d => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(d)); // AAAA-MM-DD
  const nowLocalInput = () => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
  };
  const ago = d => {
    const m = Math.round((Date.now() - new Date(d)) / 60000);
    if (m < 60) return T(`hace ${Math.max(m, 1)} min`, `${Math.max(m, 1)} min ago`);
    const h = Math.round(m / 60);
    if (h < 24) return T(`hace ${h} h`, `${h} h ago`);
    return fmt(d, { day: 'numeric', month: 'short' });
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600); };

  /* ---------- idioma ---------- */
  function setLang(l) {
    lang = l; document.body.classList.toggle('en', l === 'en'); document.documentElement.lang = l;
    $('#lgES').classList.toggle('on', l === 'es'); $('#lgEN').classList.toggle('on', l === 'en');
    try { localStorage.setItem('oad_lang', l); } catch (e) {}
    $$('#fType .chip').forEach(c => c.textContent = l === 'en' ? c.dataset.en : c.dataset.v);
    renderAll();
  }
  $('#lgES').onclick = () => setLang('es');
  $('#lgEN').onclick = () => setLang('en');

  /* ---------- fotos reales ---------- */
  const bg = $('#heroBg');
  ['img/caucasia-puente.jpg', 'img/caucasia-rio.jpg', ...PHOTOS].forEach((f, i) => { const im = new Image(); im.onerror = () => im.remove(); im.src = f.startsWith('img/') ? f : WM(f, 1600); im.alt = ''; if (i === 0) im.className = 'show'; bg.appendChild(im); });
  let hi = 0; setInterval(() => { const ims = $$('img', bg); ims[hi].classList.remove('show'); hi = (hi + 1) % ims.length; ims[hi].classList.add('show'); }, 6000);
  $$('img[data-wm]').forEach(im => { im.onerror = () => { im.closest('.photo').style.display = 'none'; }; im.src = WM(im.dataset.wm, 1000); im.loading = 'lazy'; });

  /* ---------- pestañas ---------- */
  function go(t) {
    $$('.tab').forEach(b => b.classList.toggle('on', b.dataset.t === t));
    $$('section.pane').forEach(p => p.classList.toggle('on', p.id === 'p-' + t));
    if (t === 'mapa') setTimeout(initMap, 60);
    const tabs = $('#tabs'); window.scrollTo({ top: tabs.offsetTop - 52, behavior: 'smooth' });
    const btn = $(`.tab[data-t="${t}"]`); if (btn) btn.scrollIntoView({ inline: 'center', block: 'nearest' });
  }
  $$('.tab').forEach(b => b.onclick = () => go(b.dataset.t));
  $$('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));

  /* ---------- contadores animados ---------- */
  $$('[data-count]').forEach(el => {
    const n = +el.dataset.count, suf = el.dataset.suf || ''; let i = 0;
    const step = () => { i += Math.ceil(n / 40); if (i >= n) i = n; el.textContent = i.toLocaleString('es-CO') + suf; if (i < n) requestAnimationFrame(step); };
    setTimeout(step, 400);
  });

  /* ---------- reloj ---------- */
  const tick = () => { $('#clock').textContent = fmt(new Date(), { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); };
  tick(); setInterval(tick, 30000);

  /* =================== NOTICIAS =================== */
  let news = [];
  const QUERIES = ['HATU drones', 'drones Caucasia', 'drones Bajo Cauca', 'ataque con drones Antioquia', 'drones Colombia Aerocivil', 'antidrones Colombia'];
  const rssUrl = q => 'https://news.google.com/rss/search?q=' + encodeURIComponent(q + ' when:7d') + '&hl=es-419&gl=CO&ceid=CO:es-419';

  function normTitle(t) { return t.toLowerCase().replace(/\s+-\s+[^-]+$/, '').replace(/[^a-záéíóúñü0-9 ]/g, '').slice(0, 70); }
  function mergeNews(arr) {
    const seen = new Set(news.map(n => normTitle(n.titulo)));
    arr.forEach(n => { const k = normTitle(n.titulo); if (n.titulo && !seen.has(k)) { seen.add(k); news.push(n); } });
    news.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    news = news.slice(0, 120);
  }
  async function loadRobot() {
    try {
      const r = await fetch('noticias.json?t=' + Date.now(), { cache: 'no-store' });
      const j = await r.json();
      mergeNews(j.items || []);
      if (j.actualizado) $('#newsStamp').textContent = T('Robot: ', 'Robot: ') + fmt(j.actualizado, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (e) {}
  }
  function parseRss(xml) {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    return [...doc.querySelectorAll('item')].map(it => {
      const title = it.querySelector('title')?.textContent || '';
      const src = it.querySelector('source')?.textContent || (title.split(' - ').pop());
      return { titulo: title.replace(/\s+-\s+[^-]+$/, ''), enlace: it.querySelector('link')?.textContent || '', fuente: src, fecha: new Date(it.querySelector('pubDate')?.textContent || Date.now()).toISOString() };
    });
  }
  async function liveSearch() {
    const proxies = [u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u), u => 'https://corsproxy.io/?url=' + encodeURIComponent(u)];
    await Promise.all(QUERIES.map(async q => {
      for (const p of proxies) {
        try {
          const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 9000);
          const r = await fetch(p(rssUrl(q)), { signal: ctrl.signal }); clearTimeout(to);
          if (!r.ok) continue; const txt = await r.text();
          if (txt.includes('<item>')) { mergeNews(parseRss(txt).map(n => Object.assign(n, { consulta: q }))); return; }
        } catch (e) {}
      }
    }));
  }
  function newsCard(n, i) {
    const ph = n.imagen || WM(PHOTOS[i % PHOTOS.length], 300);
    const isNew = Date.now() - new Date(n.fecha) < 6 * 3600e3;
    return `<a class="nw" href="${esc(n.enlace)}" target="_blank" rel="noopener"><div class="ph" style="background-image:url('${esc(ph)}')"></div><div class="tx">${isNew ? `<span class="badge">${T('Nuevo', 'New')}</span>` : ''}<b>${esc(n.titulo)}</b><small>${esc(n.fuente || '')} · ${ago(n.fecha)}</small></div></a>`;
  }
  function renderNews() {
    const q = ($('#q').value || '').toLowerCase().trim();
    const list = q ? news.filter(n => (n.titulo + ' ' + n.fuente).toLowerCase().includes(q)) : news;
    $('#allNews').innerHTML = list.length ? list.map(newsCard).join('') : `<div class="empty">${T('Sin noticias por ahora. Toca Actualizar.', 'No news yet. Tap Refresh.')}</div>`;
    const today = dayKey(new Date());
    let t = news.filter(n => dayKey(n.fecha) === today);
    const lbl = t.length ? '' : `<div class="empty" style="grid-column:1/-1">${T('Hoy todavía no hay noticias nuevas. Estas son las más recientes:', 'No new stories yet today. Here are the latest:')}</div>`;
    if (!t.length) t = news.slice(0, 4);
    $('#todayNews').innerHTML = t.length ? lbl + t.slice(0, 8).map(newsCard).join('') : `<div class="empty">${T('Buscando noticias…', 'Searching news…')}</div>`;
    const hn = news.filter(n => /hatu|haminton/i.test(n.titulo + ' ' + (n.consulta || '')));
    $('#hatuNews').innerHTML = hn.length ? hn.slice(0, 6).map(newsCard).join('') : `<div class="empty">${T('Cuando salgan noticias de HATU aparecerán aquí.', 'HATU news will show up here.')}</div>`;
    const tk = news.slice(0, 12).map(n => `<span>${esc(n.titulo)} — ${esc(n.fuente || '')}</span>`).join('');
    $('#ticker').innerHTML = tk || `<span>${T('Ojo al Dron: la veeduría ciudadana de drones de Caucasia y el Bajo Cauca', 'Ojo al Dron: the citizen drone watch for Caucasia and Bajo Cauca')}</span>`;
  }
  $('#q').addEventListener('input', renderNews);

  async function refreshAll() {
    const b = $('#btnRefresh'); b.classList.add('spin');
    await loadRobot(); renderNews();
    await liveSearch(); renderNews();
    b.classList.remove('spin');
  }
  $('#btnRefresh').onclick = async () => { await refreshAll(); renderMine(); toast(T('Actualizado', 'Updated')); };

  /* =================== REPORTES =================== */
  const KEY = 'oad_reports';
  let reports = [];
  try { reports = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { reports = []; }
  const saveReports = () => { try { localStorage.setItem(KEY, JSON.stringify(reports)); return true; } catch (e) { toast(T('El celular se quedó sin espacio para fotos. Exporta y borra reportes viejos.', 'Phone storage is full. Export and delete old reports.')); return false; } };

  const level = r => {
    const t = (r.tipos || []).join(' ');
    if (/carga|base|estación/i.test(t)) return 'alto';
    if (/nocturno|espionaje|Recurrente/i.test(t)) return 'medio';
    return 'bajo';
  };
  const lvlTxt = { alto: ['Riesgo alto', 'High risk'], medio: ['Atención', 'Watch'], bajo: ['Registro', 'Log'] };

  $('#fWhen').value = nowLocalInput();
  $$('#fType .chip').forEach(c => c.onclick = () => c.classList.toggle('on'));
  let gps = null, foto = null;
  $('#btnGps').onclick = () => {
    if (!navigator.geolocation) return toast(T('Tu celular no permite ubicación', 'Location not available'));
    $('#gpsTxt').textContent = T('Buscando ubicación…', 'Getting location…');
    navigator.geolocation.getCurrentPosition(p => {
      gps = { lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6), acc: Math.round(p.coords.accuracy) };
      $('#gpsTxt').textContent = `${gps.lat}, ${gps.lng} (±${gps.acc} m)`;
    }, () => { $('#gpsTxt').textContent = T('No se pudo obtener la ubicación. Escribe el barrio.', 'Could not get location. Type the neighborhood.'); }, { enableHighAccuracy: true, timeout: 15000 });
  };
  $('#fFoto').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      const im = new Image();
      im.onload = () => {
        const s = Math.min(1, 720 / Math.max(im.width, im.height));
        const c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        foto = c.toDataURL('image/jpeg', 0.62);
        const pv = $('#preview'); pv.src = foto; pv.style.display = 'block';
      };
      im.src = rd.result;
    };
    rd.readAsDataURL(f);
  };
  $('#btnSave').onclick = () => {
    const tipos = $$('#fType .chip.on').map(c => c.dataset.v);
    const barrio = $('#fBarrio').value.trim();
    if (!tipos.length) return toast(T('Marca qué viste', 'Pick what you saw'));
    if (!barrio && !gps) return toast(T('Pon el barrio o usa tu ubicación', 'Add neighborhood or location'));
    const when = $('#fWhen').value ? new Date($('#fWhen').value + ':00-05:00').toISOString() : new Date().toISOString();
    const r = { id: Date.now().toString(36), cuando: when, tipos, barrio, altura: $('#fAlt').value, duracion: $('#fDur').value, luces: $('#fLuz').value, direccion: $('#fDir').value.trim(), remoteId: $('#fRid').value.trim(), desc: $('#fDesc').value.trim(), gps, foto };
    reports.unshift(r);
    if (!saveReports()) { r.foto = null; saveReports(); }
    // limpiar
    $$('#fType .chip').forEach(c => c.classList.remove('on'));
    ['#fDir', '#fRid', '#fDesc'].forEach(s => $(s).value = '');
    $('#fFoto').value = ''; $('#preview').style.display = 'none'; foto = null; gps = null; $('#gpsTxt').textContent = '';
    $('#fWhen').value = nowLocalInput();
    if (level(r) === 'alto') toast(T('Guardado. Si hay riesgo, llama al 123.', 'Saved. If there is danger, call 123.'));
    else toast(T('Avistamiento guardado', 'Sighting saved'));
    renderAll(); go('mapa');
  };

  function repText(r) {
    return `OJO AL DRON — Avistamiento\nFecha: ${fmt(r.cuando, { dateStyle: 'medium', timeStyle: 'short' })} (hora Colombia)\nQué: ${(r.tipos || []).join(', ')}\nBarrio: ${r.barrio || '-'}\nAltura: ${r.altura}\nDuración: ${r.duracion}\nLuces: ${r.luces}\nDirección: ${r.direccion || '-'}\nRemote ID: ${r.remoteId || '-'}\nDescripción: ${r.desc || '-'}${r.gps ? `\nMapa: https://maps.google.com/?q=${r.gps.lat},${r.gps.lng}` : ''}`;
  }
  function renderReports() {
    $('#kMine').textContent = reports.length;
    $('#repList').innerHTML = reports.length ? reports.map(r => {
      const lv = level(r);
      return `<div class="rep">${r.foto ? `<img src="${r.foto}" alt="">` : `<div class="ph0">SIN FOTO</div>`}<div style="flex:1"><span class="lv ${lv}">${T(...lvlTxt[lv])}</span><b>${esc((r.tipos || []).join(' · '))}</b><small>${fmt(r.cuando, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${esc(r.barrio || (r.gps ? r.gps.lat + ', ' + r.gps.lng : ''))}${r.vecino ? ' · ' + T('de un vecino', 'from a neighbor') : ''}</small>${r.desc ? `<div style="font-size:13.5px;margin-top:4px">${esc(r.desc)}</div>` : ''}<div class="acts"><button class="mini" data-wa="${r.id}">WhatsApp</button><button class="mini" data-del="${r.id}">${T('Borrar', 'Delete')}</button></div></div></div>`;
    }).join('') : `<div class="empty">${T('Aún no hay avistamientos. Cuando veas un dron, repórtalo en la pestaña Reportar.', 'No sightings yet. When you see a drone, log it under Report.')}</div>`;
    $$('[data-wa]').forEach(b => b.onclick = () => { const r = reports.find(x => x.id === b.dataset.wa); window.open('https://wa.me/?text=' + encodeURIComponent(repText(r) + '\n\nReportado con Ojo al Dron: ' + location.origin + location.pathname), '_blank'); });
    $$('[data-del]').forEach(b => b.onclick = () => { if (confirmDel(b)) { reports = reports.filter(x => x.id !== b.dataset.del); saveReports(); renderAll(); } });
    drawMarkers();
  }
  function confirmDel(b) { if (b.dataset.sure) return true; b.dataset.sure = 1; b.textContent = T('¿Seguro? Toca otra vez', 'Sure? Tap again'); setTimeout(() => { delete b.dataset.sure; b.textContent = T('Borrar', 'Delete'); }, 3000); return false; }

  function renderMine() {
    const today = dayKey(new Date());
    const t = reports.filter(r => dayKey(r.cuando) === today);
    const wk = reports.filter(r => Date.now() - new Date(r.cuando) < 7 * 864e5);
    $('#todayMine').innerHTML = `<h3 style="color:#fff">${T('Tu veeduría hoy', 'Your watch today')}</h3><p>${T(`Hoy registraste <b style="color:var(--lime)">${t.length}</b> avistamiento(s). En los últimos 7 días: <b style="color:var(--lime)">${wk.length}</b>.`, `Today you logged <b style="color:var(--lime)">${t.length}</b> sighting(s). Last 7 days: <b style="color:var(--lime)">${wk.length}</b>.`)}</p><div class="cta" style="margin-top:12px"><button class="btn lime" data-go2="reportar">${T('Reportar ahora', 'Report now')}</button><a class="btn red" href="tel:123">${T('Emergencia 123', 'Emergency 123')}</a></div>`;
    $$('[data-go2]').forEach(b => b.onclick = () => go(b.dataset.go2));
  }

  /* ---------- mapa ---------- */
  let map, layer;
  function initMap() {
    if (!window.L) return;
    if (!map) {
      map = L.map('map').setView(CAUCASIA, 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
      layer = L.layerGroup().addTo(map);
    }
    map.invalidateSize(); drawMarkers();
  }
  function drawMarkers() {
    if (!map) return; layer.clearLayers();
    const pts = [];
    reports.filter(r => r.gps).forEach(r => {
      const lv = level(r); const col = lv === 'alto' ? '#ff4d4d' : lv === 'medio' ? '#ffb020' : '#3aa76d';
      L.circleMarker([r.gps.lat, r.gps.lng], { radius: 11, color: '#0b1d2e', weight: 2, fillColor: col, fillOpacity: .9 })
        .bindPopup(`<b>${esc((r.tipos || []).join(', '))}</b><br>${fmt(r.cuando, { dateStyle: 'medium', timeStyle: 'short' })}<br>${esc(r.barrio || '')}${r.foto ? `<br><img src="${r.foto}" style="width:160px;border-radius:8px;margin-top:6px">` : ''}`).addTo(layer);
      pts.push([r.gps.lat, r.gps.lng]);
    });
    if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 16 });
  }

  /* ---------- exportar / importar ---------- */
  function download(name, data, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
  $('#btnCsv').onclick = () => {
    if (!reports.length) return toast(T('No hay reportes', 'No reports'));
    const head = ['Fecha (hora Colombia)', 'Tipo', 'Barrio', 'Latitud', 'Longitud', 'Altura', 'Duración', 'Luces', 'Dirección', 'Remote ID', 'Descripción', 'Nivel'];
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const rows = reports.map(r => [fmt(r.cuando, { dateStyle: 'short', timeStyle: 'short' }), (r.tipos || []).join(' / '), r.barrio, r.gps?.lat, r.gps?.lng, r.altura, r.duracion, r.luces, r.direccion, r.remoteId, r.desc, level(r)].map(q).join(','));
    download('ojo-al-dron-consolidado-' + dayKey(new Date()) + '.csv', '﻿' + head.map(q).join(',') + '\n' + rows.join('\n'), 'text/csv');
    // también el archivo para compartir con vecinos
    download('ojo-al-dron-reportes-' + dayKey(new Date()) + '.json', JSON.stringify(reports.map(r => Object.assign({}, r, { foto: null }))), 'application/json');
    toast(T('Consolidado descargado (CSV y archivo para vecinos)', 'Record downloaded (CSV and file for neighbors)'));
  };
  $('#fImport').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(t => {
      try {
        const arr = JSON.parse(t); const ids = new Set(reports.map(r => r.id)); let n = 0;
        arr.forEach(r => { if (r && r.id && !ids.has(r.id)) { r.vecino = true; reports.push(r); n++; } });
        reports.sort((a, b) => new Date(b.cuando) - new Date(a.cuando)); saveReports(); renderAll();
        toast(T(`${n} reporte(s) importado(s)`, `${n} report(s) imported`));
      } catch (err) { toast(T('Archivo no válido', 'Invalid file')); }
    });
    e.target.value = '';
  };
  function summary() {
    const by = {}; reports.forEach(r => (r.tipos || []).forEach(t => by[t] = (by[t] || 0) + 1));
    const barrios = [...new Set(reports.map(r => r.barrio).filter(Boolean))];
    return `OJO AL DRON — Consolidado de la veeduría\nCorte: ${fmt(new Date(), { dateStyle: 'long', timeStyle: 'short' })} (hora Colombia)\nTotal de avistamientos: ${reports.length}\nBarrios: ${barrios.join(', ') || '-'}\n` + Object.entries(by).map(([k, v]) => `• ${k}: ${v}`).join('\n') + '\n\nÚltimos casos:\n' + reports.slice(0, 10).map(r => `- ${fmt(r.cuando, { dateStyle: 'short', timeStyle: 'short' })} · ${(r.tipos || []).join(', ')} · ${r.barrio || ''}${r.gps ? ` · https://maps.google.com/?q=${r.gps.lat},${r.gps.lng}` : ''}`).join('\n');
  }
  $('#btnResumen').onclick = () => { if (!reports.length) return toast(T('No hay reportes', 'No reports')); window.open('https://wa.me/?text=' + encodeURIComponent(summary()), '_blank'); };

  /* =================== DERECHO DE PETICIÓN =================== */
  const pf = ['pNom', 'pCc', 'pMail', 'pTel', 'pBarrio'];
  try { const s = JSON.parse(localStorage.getItem('oad_pet') || '{}'); pf.forEach(k => { if (s[k]) $('#' + k).value = s[k]; }); } catch (e) {}
  $('#destList').innerHTML = EMAILS.map(([n, m]) => `<span>${esc(n)} · ${esc(m)}</span>`).join('') + '<span>Policía Nacional (web)</span><span>Defensoría del Pueblo (web)</span>';

  function petition() {
    const v = k => $('#' + k).value.trim();
    const nom = v('pNom') || '[NOMBRE COMPLETO]', cc = v('pCc') || '[CÉDULA]', mail = v('pMail') || '[CORREO]', tel = v('pTel') || '[CELULAR]', barrio = v('pBarrio') || '[BARRIO]';
    const fecha = new Intl.DateTimeFormat('es-CO', { timeZone: TZ, dateStyle: 'long' }).format(new Date());
    const anexo = $('#pAnexo').checked && reports.length ? `\n\nANEXO — CONSOLIDADO CIUDADANO DE AVISTAMIENTOS\n${summary()}` : '';
    return `Caucasia, Antioquia, ${fecha}

Señores
AERONÁUTICA CIVIL DE COLOMBIA (AEROCIVIL)
ALCALDÍA MUNICIPAL DE CAUCASIA — Secretaría de Gobierno y Seguridad
PERSONERÍA MUNICIPAL DE CAUCASIA
GOBERNACIÓN DE ANTIOQUIA — Secretaría de Seguridad y Justicia
POLICÍA NACIONAL — Departamento de Policía Antioquia, Estación Caucasia
DEFENSORÍA DEL PUEBLO — Regional Antioquia

Asunto: Derecho de petición (art. 23 de la Constitución Política y Ley 1755 de 2015) — Control y respuesta frente al uso de drones en Caucasia y el Bajo Cauca

Yo, ${nom}, identificado(a) con cédula de ciudadanía n.º ${cc}, residente en el barrio ${barrio} de Caucasia, en ejercicio del derecho fundamental de petición y como integrante de la veeduría ciudadana "Ojo al Dron", respetuosamente solicito:

HECHOS
1. En lo corrido de 2026 Colombia registra cientos de ataques con drones cargados de explosivos, incluidos hechos en el Bajo Cauca antioqueño, según reportes de la Fundación Ideas para la Paz, la Defensoría del Pueblo y la Fuerza Pública divulgados por la prensa nacional.
2. En barrios de Caucasia los vecinos observamos drones sobrevolando viviendas, en horas de la noche y cerca de lugares sensibles, sin saber quién los opera ni si están registrados.
3. El RAC 100 de la Aerocivil exige registrar todo dron de 200 gramos o más y prohíbe operaciones que afecten la seguridad y la privacidad de las personas.

PETICIONES
1. A la Aerocivil: informar cuántos drones están registrados con domicilio u operación en Caucasia y el Bajo Cauca; qué autorizaciones de vuelo vigentes existen en el casco urbano; y cuál es el canal para reportar operaciones irregulares.
2. A la Alcaldía de Caucasia: informar si existe un protocolo municipal frente a drones sospechosos, qué medidas se han tomado en el Consejo de Seguridad y qué acciones de prevención y control tiene previstas en barrios.
3. A la Policía Nacional: informar cuántas denuncias o reportes por drones se han recibido en Caucasia en 2026, qué capacidad de detección o respuesta antidrones existe en el municipio y a qué línea o canal deben reportar los ciudadanos.
4. A la Gobernación de Antioquia: informar si alguno de los sistemas antidrones adquiridos para el departamento cubre el Bajo Cauca y Caucasia, y con qué cobertura.
5. A la Personería y a la Defensoría del Pueblo: acompañar a la comunidad, recibir este consolidado ciudadano y vigilar que las entidades respondan de fondo.
6. A todas las entidades: indicar cómo pueden los ciudadanos entregar de forma segura la evidencia que recojan (fotos, videos, datos de identificación remota).

FUNDAMENTOS
Artículos 2, 23 y 270 de la Constitución Política; Ley 1755 de 2015; Ley 850 de 2003 (veedurías ciudadanas); Ley 1801 de 2016; RAC 100 de la Aerocivil (Resolución 01983 de 2023); Ley 1581 de 2012.

Solicito respuesta de fondo dentro de los quince (15) días hábiles siguientes. Si alguna petición no es de su competencia, les pido trasladarla a la entidad competente e informarme (art. 21, Ley 1755 de 2015).

NOTIFICACIONES
Correo: ${mail}
Celular: ${tel}

Atentamente,

${nom}
C. C. ${cc}
Veeduría ciudadana Ojo al Dron — Caucasia${anexo}`;
  }
  function renderPet() {
    $('#petTxt').textContent = petition();
    try { const s = {}; pf.forEach(k => s[k] = $('#' + k).value); localStorage.setItem('oad_pet', JSON.stringify(s)); } catch (e) {}
  }
  [...pf.map(k => '#' + k), '#pAnexo'].forEach(s => $(s).addEventListener('input', renderPet));
  $('#pAnexo').addEventListener('change', renderPet);
  const petReady = () => { if (!$('#pNom').value.trim() || !$('#pCc').value.trim() || !$('#pMail').value.trim()) { toast(T('Llena nombre, cédula y correo', 'Fill in name, ID and email')); return false; } return true; };
  $('#btnMail').onclick = () => {
    if (!petReady()) return;
    const to = [...new Set(EMAILS.map(e => e[1]))].join(',');
    const subj = 'Derecho de petición — Control y respuesta frente al uso de drones en Caucasia';
    let body = petition(); if (body.length > 1800) body = body.slice(0, 1800) + '\n\n[Texto completo copiado: pégalo aquí]';
    navigator.clipboard && navigator.clipboard.writeText(petition()).catch(() => {});
    location.href = `mailto:${to}?cc=${encodeURIComponent($('#pMail').value.trim())}&subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
  };
  $('#btnCopy').onclick = () => { navigator.clipboard.writeText(petition()).then(() => toast(T('Texto copiado', 'Text copied'))).catch(() => toast(T('No se pudo copiar', 'Copy failed'))); };
  $('#btnWaPet').onclick = () => window.open('https://wa.me/?text=' + encodeURIComponent('Únete a la veeduría ciudadana de drones y envía tu derecho de petición desde Ojo al Dron: ' + location.origin + location.pathname), '_blank');

  /* =================== ARRANQUE =================== */
  function renderAll() { renderNews(); renderReports(); renderMine(); renderPet(); }
  setLang(lang);
  refreshAll();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { refreshAll(); renderMine(); } });

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
