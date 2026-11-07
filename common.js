/*
  Base compartida para los anotadores.
  Cada juego define un objeto G y llama a U.app(G). La base se encarga de:
  jugadores, guardar, deshacer, pantalla final, "seguir jugando", historial y reglas.

  G = {
    key:     clave de localStorage de la partida en curso (ej. 'chinchon_v1')
    title:   nombre del juego
    minP, maxP, who ('Jugador' | 'Equipo'), defaults: ['Nosotros','Ellos'] (opcional)
    options: [{id, label, type:'check'|'number'|'choice', def, choices:[[valor,texto]]}] (opcional)
    rules:   html con <li> de las reglas
    newState(players, opts, prev) -> estado inicial de una partida
    render(S, api)                 -> dibuja la partida en #game
    result(S) -> {winners:[índices], text:'...'}   (cuando S.over)
    endHtml(S) -> html extra para la pantalla final (opcional)
  }
  api = { mutate(fn), undo(), canUndo(), rerender() }
*/
const U = (() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const load = (k, d = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch (e) { return d } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } };
  const drop = k => { try { localStorage.removeItem(k) } catch (e) { } };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const fmt = n => Number(n || 0).toLocaleString('es-AR');
  const clone = o => JSON.parse(JSON.stringify(o));

  /* ---------- hoja inferior ---------- */
  function openSheet(html, bind) {
    let ov = $('u_overlay');
    if (!ov) {
      ov = document.createElement('div'); ov.id = 'u_overlay'; ov.className = 'overlay hidden';
      ov.innerHTML = '<div class="sheetbox" id="u_sheet"></div>';
      ov.onclick = e => { if (e.target === ov) closeSheet() };
      document.body.appendChild(ov);
    }
    $('u_sheet').innerHTML = html;
    ov.classList.remove('hidden');
    if (bind) bind($('u_sheet'));
  }
  function closeSheet() { const ov = $('u_overlay'); if (ov) ov.classList.add('hidden') }

  /* ---------- historial ---------- */
  const hkey = G => G.key + '_historial';
  const tally = (n, games) => { const w = Array(n).fill(0); games.forEach(g => (g.winners || []).forEach(p => w[p]++)); return w };

  /* ---------- app ---------- */
  function app(G) {
    let S = load(G.key);
    let draft = (load(G.key + '_ultimos') || G.defaults || ['', '']).slice();
    let opts = load(G.key + '_opciones') || {};
    (G.options || []).forEach(o => { if (opts[o.id] === undefined) opts[o.id] = o.def });
    const root = document.querySelector('main') || document.body;
    root.insertAdjacentHTML('beforeend', `
      <div class="sub" id="u_sub"></div>
      <section id="setup" class="hidden"></section>
      <section id="game" class="hidden"></section>
      <section id="end" class="hidden"></section>`);

    function save() {
      if (S) {
        store(G.key, S);
        const games = [...(S.series || []), ...(S.over ? [G.result(S)] : [])];
        let h = load(hkey(G), []).filter(x => x.id !== S.id);
        if (games.length) h.unshift({ id: S.id, players: S.players, opts: S.opts, games, date: new Date().toISOString() });
        store(hkey(G), h.slice(0, 30));
      }
    }
    function snapshot() { const c = clone(S); delete c.undo; return c }
    const api = {
      mutate(fn) {
        const snap = snapshot();
        const r = fn(S);
        if (r === false) return;
        S.undo = (S.undo || []).concat([snap]).slice(-60);
        save(); render(); window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      canUndo: () => !!(S && S.undo && S.undo.length),
      undo() {
        if (!api.canUndo()) return;
        if (!confirm('¿Deshacer lo último que se anotó?')) return;
        const u = S.undo; const prev = u.pop(); S = Object.assign(prev, { undo: u });
        save(); render();
      },
      rerender: () => render(),
      save: () => save(),
      sheet: openSheet, close: closeSheet
    };

    function show(id) { ['setup', 'game', 'end'].forEach(x => $(x).classList.toggle('hidden', x !== id)) }

    function start(players, o, id, series, prev) {
      S = G.newState(players, o, prev);
      S.players = players; S.opts = o; S.id = id || uid(); S.series = series || []; S.undo = []; S.over = false;
      save(); render(); window.scrollTo(0, 0);
    }

    /* setup */
    function renderSetup() {
      show('setup');
      $('u_sub').textContent = 'Configurá la partida';
      const who = G.who || 'Jugador';
      const H = load(hkey(G), []);
      const optHtml = (G.options || []).map(o => {
        if (o.show && !o.show(opts)) return '';
        if (o.type === 'title') return `<div style="font-weight:700;margin:12px 0 2px;color:var(--gold)">${o.label}</div>`;
        if (o.type === 'amount') return `<div style="padding:6px 0"><div style="margin-bottom:8px">${o.label}</div><div class="chips" style="align-items:center">${o.presets.map(v => `<button class="chip${+opts[o.id] === v ? ' sel' : ''}" data-am="${o.id}" data-v="${v}">${fmt(v)}</button>`).join('')}<input type="number" inputmode="numeric" data-o="${o.id}" value="${opts[o.id]}" style="width:110px;padding:9px"></div></div>`;
        if (o.type === 'check') return `<label class="toggle"><span>${o.label}</span><input type="checkbox" data-o="${o.id}" ${opts[o.id] ? 'checked' : ''}></label>`;
        if (o.type === 'number') return `<label class="toggle"><span>${o.label}</span><input type="number" inputmode="numeric" style="width:100px" data-o="${o.id}" value="${opts[o.id]}"></label>`;
        if (o.type === 'choice') return `<div style="padding:6px 0"><div style="margin-bottom:8px">${o.label}</div><div class="chips">${o.choices.map(([v, t]) => `<button class="chip${opts[o.id] === v ? ' sel' : ''}" data-c="${o.id}" data-v="${esc(v)}">${t}</button>`).join('')}</div></div>`;
        return '';
      }).join('');
      $('setup').innerHTML = `
        <div class="card"><h2>${who === 'Equipo' ? 'Equipos' : 'Jugadores'}</h2>
          <div class="sub" style="margin-bottom:10px">De ${G.minP} a ${G.maxP}${G.whoNote ? ' · ' + G.whoNote : ''}.</div>
          <div id="u_names"></div>
          <button class="ghost small" id="u_add">+ Agregar ${who.toLowerCase()}</button>
        </div>
        ${optHtml ? `<div class="card"><h2>Opciones</h2>${optHtml}</div>` : ''}
        <button class="primary" id="u_start" style="margin-bottom:14px">Empezar partida</button>
        ${H.length ? `<div class="card"><h2>Series anteriores</h2><div class="sub" style="margin-bottom:6px">Elegí una para seguir sumando partidas con los mismos ${who === 'Equipo' ? 'equipos' : 'jugadores'}.</div>
          ${H.map((x, i) => {
            const w = tally(x.players.length, x.games); const d = new Date(x.date);
            return `<div class="hrow"><div><div class="who">${x.players.map((n, p) => `${esc(n)} ${w[p]}`).join(' · ')}</div>
              <div class="meta">${x.games.length} partida${x.games.length > 1 ? 's' : ''} · ${d.toLocaleDateString('es-AR')} ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div></div>
              <div class="btns"><button class="primary small" style="width:auto" data-h="${i}" data-a="go">Seguir</button><button class="ghost small danger" data-h="${i}" data-a="del">✕</button></div></div>`;
          }).join('')}</div>` : ''}
        <details class="card rules"><summary>📖 ¿Cómo se juega?</summary><ul>${G.rules || ''}</ul></details>`;
      const names = () => {
        const box = $('u_names'); box.innerHTML = '';
        draft.forEach((nm, i) => {
          const r = document.createElement('div'); r.className = 'namerow';
          r.innerHTML = `<div class="ord">${i + 1}</div><input type="text" maxlength="14" placeholder="${who} ${i + 1}" value="${esc(nm)}">` + (draft.length > G.minP ? '<button class="ghost small">✕</button>' : '');
          const inp = r.querySelector('input'); inp.oninput = () => draft[i] = inp.value;
          const d = r.querySelector('button'); if (d) d.onclick = () => { draft.splice(i, 1); names() };
          box.appendChild(r);
        });
        $('u_add').style.display = draft.length >= G.maxP ? 'none' : '';
      };
      names();
      $('u_add').onclick = () => { if (draft.length < G.maxP) { draft.push(''); names(); const ins = $('u_names').querySelectorAll('input'); ins[ins.length - 1].focus() } };
      $('setup').querySelectorAll('[data-o]').forEach(el => el.onchange = () => {
        opts[el.dataset.o] = el.type === 'checkbox' ? el.checked : (parseInt(el.value, 10) || 0);
      });
      $('setup').querySelectorAll('[data-c]').forEach(el => el.onclick = () => { opts[el.dataset.c] = el.dataset.v; renderSetup() });
      $('setup').querySelectorAll('[data-am]').forEach(el => el.onclick = () => { opts[el.dataset.am] = +el.dataset.v; renderSetup() });
      $('setup').querySelectorAll('input[data-o][type=number]').forEach(el => el.oninput = () => { opts[el.dataset.o] = parseInt(el.value, 10) || 0 });
      $('u_start').onclick = () => {
        while (draft.length < G.minP) draft.push('');
        const players = draft.map((n, i) => n.trim() || `${who} ${i + 1}`);
        store(G.key + '_ultimos', players); store(G.key + '_opciones', opts);
        start(players, clone(opts));
      };
      $('setup').querySelectorAll('[data-h]').forEach(b => b.onclick = () => {
        const x = H[+b.dataset.h];
        if (b.dataset.a === 'del') { if (confirm('¿Borrar esta serie del historial?')) { store(hkey(G), H.filter(y => y.id !== x.id)); renderSetup() } return }
        start(x.players, x.opts || clone(opts), x.id, x.games);
      });
    }

    /* fin */
    function renderEnd() {
      show('end');
      $('u_sub').textContent = 'Partida terminada';
      const res = G.result(S);
      const all = [...(S.series || []), res];
      const w = tally(S.players.length, all);
      const ord = S.players.map((_, i) => i).sort((a, b) => w[b] - w[a]);
      const names = res.winners.map(p => S.players[p]);
      $('end').innerHTML = `
        <div class="card win"><div style="font-size:48px">${names.length ? '🏆' : '🤝'}</div>
          <div class="sub" style="margin:0">${names.length ? (names.length > 1 ? 'Ganaron' : 'Ganó') : 'Terminó'}</div>
          <div class="big">${names.length ? names.map(esc).join(' y ') : 'Empate'}</div>
          <div class="sub" style="margin:0">${res.text || ''}</div></div>
        ${G.endHtml ? G.endHtml(S) : ''}
        <div class="card"><h2>Partidas acumuladas</h2><div class="sub" style="margin:0 0 8px">${all.length} partida${all.length > 1 ? 's' : ''}, contando esta</div>
          <div class="rank">${ord.map((p, i) => `<div class="r ${i === 0 && w[p] > 0 ? 'first' : ''}"><span class="nm">${esc(S.players[p])}</span><span><b>${w[p]}</b> ganada${w[p] !== 1 ? 's' : ''}</span></div>`).join('')}</div></div>
        <div class="footer"><button class="ghost small" id="u_undoE">↶ Deshacer</button><button class="primary small" id="u_again">Seguir jugando</button></div>
        <div class="footer"><button class="ghost small danger" id="u_exitE">Salir al menú</button></div>`;
      $('u_undoE').onclick = api.undo;
      $('u_again').onclick = () => start(S.players, S.opts, S.id, all, S);
      $('u_exitE').onclick = exit;
    }

    function exit() {
      const playing = S && !S.over && S.undo && S.undo.length;
      if (!confirm(playing ? '¿Salir al menú? La partida en curso se pierde; las terminadas quedan en el historial.' : '¿Salir al menú? La serie queda guardada en el historial.')) return;
      draft = S ? S.players.slice() : draft; S = null; drop(G.key); render();
    }

    function renderGame() {
      show('game');
      const ser = S.series || [];
      let sub = G.subtitle ? G.subtitle(S) : '';
      if (ser.length) { const w = tally(S.players.length, ser); sub = (sub ? sub + '<br>' : '') + `Partida ${ser.length + 1} · ganadas: ` + S.players.map((n, p) => `${esc(n)} <b style="color:var(--text)">${w[p]}</b>`).join(' · ') }
      $('u_sub').innerHTML = sub;
      $('game').innerHTML = '';
      G.render(S, api);
      $('game').insertAdjacentHTML('beforeend', `
        <div class="footer"><button class="ghost small" id="u_undo" ${api.canUndo() ? '' : 'disabled'}>↶ Deshacer</button><button class="ghost small danger" id="u_exit">Salir al menú</button></div>
        <details class="card rules" style="margin-top:14px"><summary>📖 ¿Cómo se juega?</summary><ul>${G.rules || ''}</ul></details>`);
      $('u_undo').onclick = api.undo; $('u_exit').onclick = exit;
    }

    function render() { if (!S) renderSetup(); else if (S.over) renderEnd(); else renderGame() }
    render();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js').catch(() => { });
  }

  /* ---------- piezas comunes ---------- */
  function rankHtml(players, scores, o = {}) {
    const ord = players.map((_, i) => i).sort((a, b) => o.asc ? scores[a] - scores[b] : scores[b] - scores[a]);
    return `<div class="rank">${ord.map((p, i) => `<div class="r ${i === 0 && !o.noLead ? 'first' : ''}"><div style="flex:1;min-width:0"><div class="nm">${i + 1}. ${esc(players[p])} ${o.tag ? o.tag(p) : ''}</div>${o.meta ? `<div class="meta">${o.meta(p)}</div>` : ''}${o.bar ? `<div class="bar"><i style="width:${Math.max(0, Math.min(100, o.bar(p)))}%"></i></div>` : ''}</div><span class="pt">${o.fmt ? o.fmt(scores[p]) : fmt(scores[p])}</span></div>`).join('')}</div>`;
  }
  function sheetTable(players, rounds, totals, o = {}) {
    let h = '<tr><th class="l">#</th>' + players.map(p => `<th>${esc(p.slice(0, 8))}</th>`).join('') + '</tr>';
    rounds.forEach((r, i) => {
      h += `<tr><td class="l">${o.label ? o.label(r, i) : i + 1}</td>` + r.pts.map((v, j) => {
        if (v === null || v === undefined) return '<td class="mut">—</td>';
        const cls = o.cls ? o.cls(v, r, j) : (v > 0 ? 'pos' : v < 0 ? 'neg' : '');
        return `<td><span class="${cls}">${o.cellFmt ? o.cellFmt(v, r, j) : (v > 0 && o.plus ? '+' : '') + fmt(v)}</span></td>`;
      }).join('') + '</tr>';
    });
    if (!rounds.length) h += `<tr><td colspan="${players.length + 1}" class="mut">Todavía no hay manos anotadas</td></tr>`;
    h += '<tr class="tot"><td class="l">Tot</td>' + totals.map(t => `<td>${fmt(t)}</td>`).join('') + '</tr>';
    return `<div class="tablewrap"><table class="sheet">${h}</table></div>`;
  }

  return { $, esc, fmt, load, store, clone, app, rankHtml, sheetTable, openSheet, closeSheet };
})();
