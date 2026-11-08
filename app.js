(function () {
  'use strict';
  const D = globalThis.GENETICS, G = globalThis.GeneticsEngine;
  const main = document.getElementById('main');
  let state = G.fresh(), storageOK = true, current = {}, buffers = {}, feedback = {}, steps = {};
  const palettes = {};
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  try { state = G.hydrate(JSON.parse(localStorage.getItem(G.KEY))); } catch { storageOK = false; }
  function save() {
    try { localStorage.setItem(G.KEY, JSON.stringify(state)); } catch { storageOK = false; }
    document.getElementById('storage-warning').textContent = storageOK ? '' : 'No se pudo usar el almacenamiento local. Podés seguir en esta sesión, pero los cambios podrían perderse al cerrar. Usá “Descargar respaldo” en Mi historial.';
  }
  save();
  function toast(text) { const el = document.getElementById('toast'); el.textContent = text; el.classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('visible'), 3500); }
  function date(value) { return new Date(value).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' }); }
  const lock = '<span aria-hidden="true">🔒</span><span class="sr-only">Bloqueada</span>';
  function dna() {
    let strands = '';
    for (let i = 0; i < 9; i++) { const y = 20 + i * 24, x = 150 + Math.sin(i * .68) * 68, other = 300 - x; strands += `<line x1="${x}" y1="${y}" x2="${other}" y2="${y}" stroke="#99ac64" stroke-width="9" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="10" fill="#245c4b"/><circle cx="${other}" cy="${y}" r="10" fill="#dc7449"/>`; }
    return `<svg viewBox="0 0 300 235" role="img" aria-label="Ilustración de una doble hélice de ADN">${strands}</svg>`;
  }
  const allele = (a, light = false) => `<span class="allele${light ? ' light' : ''}">${esc(a)}</span>`;
  function chromosomes(labels) { return `<figure><svg viewBox="0 0 540 215" role="img" aria-label="Dos cromosomas homólogos con los alelos ${esc(labels.join(' y '))} en el mismo locus"><text x="150" y="25" text-anchor="middle" font-size="16" fill="#526962">Origen materno</text><text x="390" y="25" text-anchor="middle" font-size="16" fill="#526962">Origen paterno</text><path d="M150 55 C130 85 170 125 150 175" stroke="#245c4b" stroke-width="25" fill="none" stroke-linecap="round"/><path d="M390 55 C370 85 410 125 390 175" stroke="#245c4b" stroke-width="25" fill="none" stroke-linecap="round"/><path d="M160 111 L380 111" stroke="#97ac71" stroke-width="2" stroke-dasharray="5 5"/><rect x="141" y="99" width="27" height="23" rx="3" fill="#dc7449"/><rect x="381" y="99" width="27" height="23" rx="3" fill="#dc7449"/><text x="110" y="118" font-size="27" font-weight="bold" fill="#173d36">${esc(labels[0])}</text><text x="425" y="118" font-size="27" font-weight="bold" fill="#173d36">${esc(labels[1])}</text><text x="270" y="202" text-anchor="middle" font-size="16" fill="#526962">Mismo locus · mismo gen · dos copias</text></svg></figure>`; }
  const pairs = () => `<div class="pairs">${[['BB', 'Homocigota'], ['bb', 'Homocigota'], ['Bb', 'Heterocigota']].map(([a, b]) => `<div class="gene-pair"><strong>${a}</strong><small>${b}</small></div>`).join('')}</div>`;
  function visual(type, labels) {
    if (type === 'chromosomes') return `<figure><div class="flow"><div class="gene-pair"><strong>ADN</strong><small>Material con instrucciones</small></div><span class="arrow" aria-hidden="true">→</span><div class="gene-pair"><strong>Gen</strong><small>Una parte de ese material</small></div><span class="arrow" aria-hidden="true">→</span><div class="gene-pair"><strong>A / a</strong><small>Dos versiones: alelos</small></div></div><figcaption>El ADN se organiza en cromosomas. Abajo seguimos la dirección del mismo gen en un par.</figcaption></figure>${chromosomes(labels || ['A', 'a'])}`;
    if (type === 'pairs') return pairs();
    if (type === 'dominance' || type === 'phenotype') return `<figure><div class="pairs">${['AA', 'Aa', 'aa'].map((a, i) => `<div class="gene-pair"><strong>${a}</strong><span class="seed${i === 2 ? ' green' : ''}" aria-hidden="true"></span><small>${i === 2 ? 'Verde' : 'Amarilla'}</small></div>`).join('')}</div><figcaption>${type === 'phenotype' ? 'AA y Aa: genotipos diferentes, mismo fenotipo.' : 'Aa conserva a aunque el fenotipo sea amarillo.'}</figcaption></figure>`;
    if (type === 'gametes') return `<figure><div class="flow"><div class="gene-pair"><strong>Aa</strong><small>Dos alelos en el progenitor</small></div><span class="arrow" aria-hidden="true">→</span><div class="gene-pair">${allele('A')}<small>Un tipo de gameto · 50 %</small></div><span aria-hidden="true">o</span><div class="gene-pair">${allele('a', true)}<small>Otro tipo de gameto · 50 %</small></div></div><figcaption>Cada gameto lleva A o a: no Aa. Son dos tipos posibles, no solo dos gametos.</figcaption><div class="flow" style="margin-top:1rem"><div class="gene-pair"><strong>1 de 4</strong><small>1/4 = 25 %</small></div><div class="gene-pair"><strong>2 de 4</strong><small>2/4 = 50 %</small></div><div class="gene-pair"><strong>4 de 4</strong><small>4/4 = 100 %</small></div></div></figure>`;
    if (type === 'uniformity') return `<div class="flow"><div class="gene-pair"><strong>AA × aa</strong><small>Parentales</small></div><span class="arrow" aria-hidden="true">→</span><div class="gene-pair"><strong>100 % Aa</strong><small>Primera generación filial</small></div></div>`;
    if (type === 'segregation') return `<figure><div class="pairs">${[['AA', '25 %'], ['Aa', '50 %'], ['aa', '25 %']].map(([a, b]) => `<div class="gene-pair"><strong>${a}</strong><small>${b}</small></div>`).join('')}</div><figcaption>AA + Aa = 75 % dominante · aa = 25 % recesivo.</figcaption></figure>`;
    if (type === 'inference') return `<figure><div class="flow"><div class="gene-pair"><strong>T?</strong><small>Alto · aporta t</small></div><span class="arrow" aria-hidden="true">↘</span><div class="gene-pair"><strong>tt</strong><small>Descendiente bajo</small></div><span class="arrow" aria-hidden="true">↙</span><div class="gene-pair"><strong>T?</strong><small>Alto · aporta t</small></div></div><figcaption>Cada t proviene de un progenitor: ambos deben ser Tt.</figcaption></figure>`;
    if (type === 'abo') return `<figure><div class="pairs">${[['A', true, false], ['B', false, true], ['AB', true, true], ['O', false, false]].map(([group, a, b]) => `<div class="gene-pair"><svg viewBox="0 0 120 100" style="width:110px;height:90px" role="img" aria-label="Glóbulo rojo de grupo ${group}: ${a && b ? 'marcas A y B' : a ? 'marca A' : b ? 'marca B' : 'sin marcas A ni B'}"><circle cx="60" cy="50" r="32" fill="#edd0c5" stroke="#a64c40" stroke-width="3"/>${a ? '<path d="M52 12 L68 12 L60 0 Z M52 88 L68 88 L60 100 Z" fill="#245c4b"/><text x="60" y="55" text-anchor="middle" font-size="19" fill="#173d36">A</text>' : ''}${b ? `<rect x="18" y="43" width="14" height="14" fill="#7754a0"/><rect x="88" y="43" width="14" height="14" fill="#7754a0"/><text x="60" y="${a ? '77' : '55'}" text-anchor="middle" font-size="19" fill="#173d36">B</text>` : ''}${!a && !b ? '<text x="60" y="55" text-anchor="middle" font-size="19" fill="#173d36">O</text>' : ''}</svg><strong>${group}</strong></div>`).join('')}</div><figcaption>Esquema: triángulos = marca A; cuadrados = marca B. Las formas son símbolos, no su aspecto real. AB muestra ambas; O no muestra ninguna de esas dos.</figcaption></figure><table class="abo-table"><caption class="sr-only">Grupos y genotipos ABO del modelo habitual</caption><thead><tr><th>Grupo</th><th>Genotipos</th><th>Marcas (antígenos)</th></tr></thead><tbody>${[['A', 'IᴬIᴬ o Iᴬi', 'A'], ['B', 'IᴮIᴮ o Iᴮi', 'B'], ['AB', 'IᴬIᴮ', 'A y B'], ['O', 'ii', 'Ninguna de esas dos']].map(([a, b, c]) => `<tr><th>${a}</th><td>${b}</td><td>${c}</td></tr>`).join('')}</tbody></table>`;
    if (type === 'abo-cross') return `<div class="flow"><div class="gene-pair"><strong>Iᴬi × Iᴮi</strong><small>Cada uno puede aportar i</small></div><span class="arrow" aria-hidden="true">→</span><div class="gene-pair"><strong>ii</strong><small>Un hijo O recibió i de ambos</small></div></div>`;
    if (type === 'cf') return `<figure><div class="pairs">${[['NN', 'Sin esa variante', 'Dos copias funcionales'], ['Nf', 'Portador sin fibrosis quística', 'Una funcional + una causal'], ['ff', 'Con fibrosis quística', 'Dos copias con variantes causales']].map(([a, b, c]) => `<div class="gene-pair">${a.split('').map(letter => allele(letter, letter === 'f')).join('')}<strong>${a}</strong><small>${c}</small><span class="arrow" aria-hidden="true">↓</span><small>${b}</small></div>`).join('')}</div><figcaption>Son dos copias del mismo gen. Tener una variante causal y poder transmitirla no equivale a tener fibrosis quística.</figcaption></figure>`;
    if (type === 'rh') return `<figure><div class="pairs">${[['DD', 'RhD positivo'], ['Dd', 'RhD positivo'], ['dd', 'RhD negativo']].map(([a, b]) => `<div class="gene-pair"><svg viewBox="0 0 110 95" style="width:100px;height:85px" role="img" aria-label="${a}: ${a === 'dd' ? 'sin marca D' : 'con marca D'}"><circle cx="55" cy="48" r="30" fill="#edd0c5" stroke="#a64c40" stroke-width="3"/>${a !== 'dd' ? '<path d="M55 8 L64 18 L55 28 L46 18 Z M55 68 L64 78 L55 88 L46 78 Z" fill="#245c4b"/><text x="55" y="55" text-anchor="middle" font-size="22" fill="#173d36">D</text>' : '<text x="55" y="52" text-anchor="middle" font-size="14" fill="#173d36">Sin D</text>'}</svg><strong>${a}</strong><small>${b}</small></div>`).join('')}</div><figcaption>Los rombos representan la marca D, no su forma real. DD y Dd la expresan; dd no. La letra d no representa otra marca.</figcaption></figure>`;
    return '';
  }
  function solvedGrid(top, left, stage = 3, answer) {
    return `<table class="punnett"><caption class="sr-only">Cuadro de Punnett: cada casilla combina fila y columna</caption><thead><tr><th class="corner">Gametos<br>↓ × →</th>${[0, 1].map(i => `<th scope="col">${stage >= 1 ? esc(top[i]) : '—'}</th>`).join('')}</tr></thead><tbody>${[0, 1].map(r => `<tr><th scope="row">${stage >= 1 ? esc(left[r]) : '—'}</th>${[0, 1].map(c => `<td class="${stage < 2 ? 'empty' : ''}">${stage >= 2 ? esc(answer ? answer[r * 2 + c] : DCombine(top[c], left[r])) : '·'}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  function DCombine(a, b) { if (a === 'i' && b !== 'i') return b + a; if (b === 'i' && a !== 'i') return a + b; return [a, b].sort().join(''); }
  function mapPage() {
    const done = G.count(state), next = D.lessons.find(l => !G.complete(state, l.id));
    return `<section class="hero"><div><p class="eyebrow">TU LABORATORIO DE APRENDIZAJE</p><h1>La genética,<br>paso a paso.</h1><p class="intro">Un recorrido para leer, comprender y aplicar. Cada idea abre la puerta a la siguiente.</p><p class="small muted">12 microclases · 24 preguntas de práctica · Un simulacro final</p></div><div class="hero-art">${dna()}<span class="float-label">Las respuestas se construyen.</span></div></section><section class="progress-summary" aria-label="Tu progreso"><div><strong>${done} de 12 microclases completadas</strong><div class="progressbar" role="progressbar" aria-label="Clases completadas" aria-valuemin="0" aria-valuemax="12" aria-valuenow="${done}"><span style="width:${done / 12 * 100}%"></span></div><span class="small muted">${done === 12 ? 'Recorrido completo. El simulacro ya está disponible.' : 'Resolvé las dos preguntas de cada clase para avanzar. Podés reintentar sin penalización.'}</span></div><a class="button" href="${next ? `#clase/${next.id}` : '#simulacro'}">${done === 12 ? 'Ir al simulacro' : done === 0 && !state.attempts.length ? 'Empezar a aprender' : 'Continuar mi recorrido'} <span aria-hidden="true">→</span></a></section><div class="section-title"><div><p class="eyebrow">EL RECORRIDO</p><h2>Una idea a la vez</h2></div><span class="small muted">A tu ritmo</span></div><div class="path-grid">${D.lessons.map(l => {
      const open = G.unlocked(state, l.id), complete = G.complete(state, l.id), tag = open ? 'a' : 'article';
      return `<${tag} ${open ? `href="#clase/${l.id}"` : ''} class="lesson-card ${complete ? 'completed' : open ? 'current' : 'locked'}" ${!open ? 'aria-label="Clase ' + l.id + ' bloqueada. Completá las anteriores."' : ''}><div class="card-top"><span class="number">${String(l.id).padStart(2, '0')}</span><span class="badge${l.complementary ? ' extra' : ''}">${l.complementary ? 'Complementario' : 'Base PDF'}</span></div><h3>${l.title}</h3><p>${l.subtitle}</p><div class="card-status"><span>${complete ? '✓ Completada · Repasar' : open ? 'Disponible · Entrar →' : `${lock} Completá la clase ${l.id - 1}`}</span><span class="dots" aria-label="${[1, 2].filter(n => state.mastered[`l${l.id}q${n}`]).length} de 2 preguntas resueltas"><i class="${state.mastered[`l${l.id}q1`] ? 'done' : ''}"></i><i class="${state.mastered[`l${l.id}q2`] ? 'done' : ''}"></i></span></div></${tag}>`;
    }).join('')}</div><section class="exam-card"><div><p class="eyebrow" style="color:#dced96">EL DESAFÍO FINAL</p><h2>Tu simulacro de genética</h2><p>13 preguntas nuevas. Sin pistas durante el intento; al entregar, nota y revisión explicada.</p></div>${G.ready(state) ? '<a href="#simulacro" class="button">Abrir simulacro →</a>' : `<span class="badge">${lock} ${12 - done} clases por completar</span>`}</section><p class="small muted" style="margin-top:1rem">Tu progreso se guarda en este navegador y dispositivo. Podés descargar un respaldo en <a href="#historial">Mi historial</a>.</p>`;
  }
  function sidebar(id) { return `<aside class="lesson-sidebar" aria-label="Navegación de clases"><p><strong>Tu recorrido</strong><br>${G.count(state)}/12 completadas</p><div class="sidebar-links"><a href="#explicacion" data-scroll="explicacion">01 · Comprender</a><a href="#ejemplo" data-scroll="ejemplo">02 · Ver un ejemplo</a><a href="#practica" data-scroll="practica">03 · Aplicar</a></div><div class="side-progress">${D.lessons.map(l => G.unlocked(state, l.id) ? `<a href="#clase/${l.id}" class="${G.complete(state, l.id) ? 'done' : ''} ${l.id === id ? 'selected' : ''}" ${l.id === id ? 'aria-current="page"' : ''} aria-label="Clase ${l.id}: ${esc(l.title)}${G.complete(state, l.id) ? ', completada' : ''}">${l.id}</a>` : `<span class="locked" aria-label="Clase ${l.id} bloqueada">${l.id}</span>`).join('')}</div></aside>`; }
  function example(l) {
    const s = steps[l.id] || 1, ex = l.example;
    return `<section class="panel" id="ejemplo"><span class="step-label">02 · EJEMPLO RESUELTO</span><h2>${ex.title}</h2><p class="small muted">Recorré cada paso antes de pasar a la práctica.</p><div class="concept-visual">${ex.type === 'punnett' ? solvedGrid(ex.top, ex.left, s - 1) : visual(ex.type, ex.labels)}</div><ol class="example-steps">${ex.steps.map((text, i) => `<li class="${i >= s ? 'step-hidden' : ''}">${text}</li>`).join('')}</ol>${s >= 3 ? `<div class="example-result">${ex.result}</div>` : ''}<div class="example-controls"><span class="small muted">Paso ${s} de 3</span>${s < 3 ? `<button class="secondary" data-action="step" data-lesson="${l.id}">Ver paso ${s + 1} →</button>` : `<button class="text" data-action="restart-example" data-lesson="${l.id}">Volver al primer paso</button>`}</div></section>`;
  }
  function options(q, answer, disabled = false, suffix = '') {
    const isMulti = q.kind === 'multi';
    return `<div class="options">${q.options.map((opt, i) => `<label class="option"><input type="${isMulti ? 'checkbox' : 'radio'}" name="${q.id}${suffix}" value="${i}" data-answer="${q.id}" ${q.kind === 'grid' ? 'data-conclusion="true"' : ''} ${disabled ? 'disabled' : ''} ${(isMulti ? (answer || []).includes(i) : answer === i) ? 'checked' : ''}><span>${esc(opt)}</span></label>`).join('')}</div>`;
  }
  function gridWidget(q, answer, disabled = false) {
    const a = answer || { top: ['', ''], left: ['', ''], cells: ['', '', '', ''], conclusion: null };
    const chosen = palettes[q.id] || '';
    function slot(group, index, label) {
      const value = a[group]?.[index] || '';
      return `<button type="button" class="slot ${value ? 'filled' : ''}" data-slot="${q.id}" data-group="${group}" data-index="${index}" ${disabled ? 'disabled' : ''} aria-label="${label}: ${esc(value || 'vacío')}. Elegí una ficha y activá esta casilla.">${esc(value || '+')}</button>`;
    }
    return `<div class="interactive-grid" data-grid="${q.id}"><p class="grid-instructions">Elegí una ficha y tocá su lugar en el cuadro. También podés arrastrarla. Usá <strong>alelos</strong> en los bordes y <strong>combinaciones</strong> en el centro. Para cambiar una casilla, elegí otra ficha y volvé a tocarla.</p><div class="palette" aria-label="Fichas de alelos"><span class="palette-label">Alelos para los gametos</span>${q.alleles.map(a => token(q, a, chosen, disabled, 'allele')).join('')}</div><div class="palette" aria-label="Fichas de combinaciones"><span class="palette-label">Combinaciones para la descendencia</span>${q.genotypes.map(a => token(q, a, chosen, disabled, 'genotype')).join('')}<button type="button" class="token" data-token="" data-q="${q.id}" data-type="erase" aria-pressed="${chosen === '__erase'}" ${disabled ? 'disabled' : ''}>Borrar casilla</button></div><p class="grid-status" id="status-${q.id}" aria-live="polite">${chosen ? chosen === '__erase' ? 'Borrador seleccionado. Tocá una casilla.' : `Ficha seleccionada: ${esc(chosen)}. Tocá una casilla para colocarla.` : 'Primero elegí una ficha.'}</p><table class="punnett"><caption class="sr-only">Cuadro interactivo de ${q.id}. Progenitor de arriba en columnas; progenitor izquierdo en filas.</caption><thead><tr><th class="corner">Gametos<br>↓ × →</th>${[0, 1].map(i => `<th scope="col">${slot('top', i, `Gameto de arriba ${i + 1}`)}</th>`).join('')}</tr></thead><tbody>${[0, 1].map(r => `<tr><th scope="row">${slot('left', r, `Gameto izquierdo ${r + 1}`)}</th>${[0, 1].map(c => `<td>${slot('cells', r * 2 + c, `Combinación fila ${r + 1}, columna ${c + 1}`)}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="grid-conclusion"><p><strong>Ahora interpretá el cuadro:</strong></p>${options(q, a.conclusion, disabled, '-conclusion')}</div></div>`;
  }
  function token(q, text, chosen, disabled, type) { return `<button type="button" class="token" data-token="${esc(text)}" data-q="${q.id}" data-type="${type}" draggable="${!disabled}" aria-pressed="${chosen === text}" ${disabled ? 'disabled' : ''}>${esc(text)}</button>`; }
  function answerFor(q) { return current.page === 'exam' ? state.draft?.answers[q.id] : buffers[q.id]; }
  function feedbackHTML(q, result) {
    if (!result) return '';
    const guidance = !result.correct && !result.missing && q.reviewSteps ? `<p><strong>Cómo revisar este cruce:</strong></p><ol>${q.reviewSteps.map(step => `<li>${esc(step)}</li>`).join('')}</ol>` : '';
    return `<div class="feedback ${result.correct ? 'success' : 'error'}" role="status">${result.correct ? `<strong>✓ Bien razonado.</strong><p>${q.explanation}</p>` : `<strong>${result.missing ? 'Todavía falta completar.' : 'Revisemos este intento.'}</strong><ul>${result.errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul>${guidance}<p class="small">${result.missing ? 'No se registró un intento.' : 'No hay penalización. Revisá el concepto, cambiá lo necesario y volvé a comprobar.'}</p>`}</div>`;
  }
  function questionHTML(q, n, exam = false) {
    const mastered = !exam && state.mastered[q.id], result = feedback[q.id];
    let answer = answerFor(q);
    if (mastered && answer === undefined) { const last = state.attempts.slice().reverse().find(a => a.id === q.id && a.correct); answer = last?.answer; }
    return `<section class="panel question" id="question-${q.id}" data-question="${q.id}"><div class="question-number">${exam ? `Simulacro · Pregunta ${n} de 13` : `Pregunta ${n} de 2 · ${n === 1 ? 'Comprensión' : 'Aplicación'}`}${mastered ? ' <span class="solved-tag">✓ Resuelta</span>' : ''}</div><fieldset ${mastered ? 'disabled' : ''}><legend>${esc(q.title)}</legend>${q.kind === 'multi' ? '<p class="instruction">Seleccioná todas las opciones correctas.</p>' : ''}${q.kind === 'grid' ? gridWidget(q, answer, mastered) : options(q, answer, mastered)}</fieldset>${exam ? '<p class="small muted" style="margin-top:1rem;margin-bottom:0">La respuesta se guarda al elegirla. La corrección se muestra al entregar las 13 preguntas.</p>' : mastered ? `<div class="feedback success"><strong>✓ Concepto aplicado</strong><p>${q.explanation}</p></div>` : `${feedbackHTML(q, result)}<div class="question-actions"><button class="primary" data-action="check" data-q="${q.id}">${result && !result.correct && !result.missing ? 'Volver a comprobar' : 'Comprobar respuesta'}</button><button class="secondary" data-scroll="explicacion">Revisar la explicación</button></div>`}</section>`;
  }
  function lessonPage(id) {
    const l = D.lessons.find(l => l.id === id);
    if (!l || !G.unlocked(state, id)) return lockedPage('Esta microclase todavía está bloqueada', 'Completá las dos preguntas de cada clase anterior para abrirla.');
    return `<div class="breadcrumbs"><a href="#mapa">← Recorrido</a><span> / Microclase ${id} de 12</span></div><div class="lesson-layout">${sidebar(id)}<article><header class="lesson-header"><span class="badge ${l.complementary ? 'extra' : ''}">${l.source}</span><h1>${l.title}</h1><p class="subtitle">${l.subtitle}</p></header><section class="panel" id="explicacion"><span class="step-label">01 · COMPRENDER</span><h2>La idea que te llevás</h2>${l.paragraphs.map(p => `<p>${p}</p>`).join('')}<div class="concept-visual">${visual(l.visual, l.labels)}</div><div class="takeaway">${l.takeaway}</div></section>${example(l)}<div id="practica"><p class="eyebrow">03 · TU TURNO DE APLICAR</p><p class="small muted">Dos preguntas. Reintentos sin penalización. Ambas correctas abren la siguiente clase.</p>${l.questions.map((q, i) => questionHTML(q, i + 1)).join('')}</div>${G.complete(state, id) ? `<section class="lesson-complete"><div><h2>✓ Microclase completada</h2><p>Podés volver a consultar todo cuando quieras.</p></div><a class="button" href="${id === 12 ? '#simulacro' : `#clase/${id + 1}`}">${id === 12 ? 'Abrir simulacro' : 'Ir a la siguiente clase'} →</a></section>` : '<p class="small muted">La siguiente clase se desbloquea al resolver correctamente las dos preguntas.</p>'}<div class="actions">${id > 1 ? `<a class="button secondary" href="#clase/${id - 1}">← Clase anterior</a>` : ''}<a class="button secondary" href="#mapa">Ver mapa de progreso</a></div></article></div>`;
  }
  function lockedPage(title, text) { return `<section class="panel empty-state"><p style="font-size:2rem" aria-hidden="true">🔒</p><h1 style="font-size:2rem">${title}</h1><p>${text}</p><a class="button" href="#mapa">Volver al recorrido</a></section>`; }
  function examStart() {
    if (!G.ready(state)) return lockedPage('El simulacro se abre al completar el recorrido', `Todavía faltan ${12 - G.count(state)} microclases. Tu progreso ya está guardado.`);
    return `<div class="exam-workspace"><p class="eyebrow">INTEGRAR LO APRENDIDO</p><h1>Tu simulacro final</h1><p>13 preguntas nuevas, con contenidos y dificultad similares a la evaluación anterior.</p><section class="panel"><h2>Cómo funciona</h2><ul><li>Podés recorrer las preguntas y cambiar tus respuestas antes de entregar.</li><li>No hay cronómetro, pistas ni correcciones durante el intento.</li><li>Los cuadros de Punnett también se completan: gametos, combinaciones y conclusión.</li><li>Al entregar recibís una nota sobre 10, el detalle de tus respuestas y una orientación para repasar.</li></ul><p>Las 13 preguntas tienen el mismo valor. La nota describe este intento y no modifica las clases completadas.</p>${state.draft ? '<p class="source-note">Tenés un simulacro en curso guardado en este navegador. Podés continuarlo desde donde lo dejaste.</p>' : ''}<button class="primary" data-action="start-exam">${state.draft ? 'Continuar simulacro' : 'Comenzar simulacro'} →</button></section>${state.exams.length ? `<p><a href="#resultado/${state.exams.length - 1}">Ver el resultado del último intento</a></p>` : ''}<a href="#mapa">← Volver al mapa</a></div>`;
  }
  function examPage(index) {
    if (!G.ready(state)) return lockedPage('Simulacro bloqueado', 'Completá primero las 12 microclases.');
    if (!state.draft) return examStart();
    index = Math.min(12, Math.max(0, index)); state.draft.index = index; save();
    const answered = D.exam.filter(q => G.present(q, state.draft.answers[q.id])).length;
    return `<div class="exam-workspace"><header class="exam-header"><div><p class="eyebrow">SIMULACRO EN CURSO</p><h1>Aplicá lo que aprendiste.</h1></div><button class="secondary" data-action="pause-exam">Guardar y salir</button></header><p class="exam-notice">Sin pistas ni correcciones anticipadas. ${answered} de 13 respuestas completas. Podés revisarlas antes de entregar.</p><nav class="exam-nav" aria-label="Preguntas del simulacro">${D.exam.map((q, i) => `<a href="#examen/${i + 1}" class="${i === index ? 'active' : ''} ${G.present(q, state.draft.answers[q.id]) ? 'answered' : ''}" ${i === index ? 'aria-current="step"' : ''} aria-label="Pregunta ${i + 1}${G.present(q, state.draft.answers[q.id]) ? ', contestada' : ', pendiente'}">${i + 1}</a>`).join('')}</nav>${questionHTML(D.exam[index], index + 1, true)}<div class="exam-bottom">${index > 0 ? `<a class="button secondary" href="#examen/${index}">← Anterior</a>` : '<span></span>'}${index < 12 ? `<a class="button" href="#examen/${index + 2}">Siguiente →</a>` : '<button class="primary" data-action="submit-exam">Entregar las 13 respuestas</button>'}</div><div id="exam-submit-feedback" role="status"></div></div>`;
  }
  function answerText(q, answer) {
    if (answer === undefined || answer === null) return 'Sin respuesta';
    if (q.kind === 'grid') return `<p class="review-grid-label">Gametos y combinaciones que colocaste</p>${solvedGrid(answer.top, answer.left, 3, answer.cells)}<p>Conclusión elegida: <strong>${esc(q.options[answer.conclusion] || 'Sin elegir')}</strong></p>`;
    return esc(q.kind === 'multi' ? (answer.length ? answer.map(i => q.options[i]).join(' · ') : 'Ninguna seleccionada') : q.options[answer]);
  }
  function solution(q) {
    if (q.kind === 'grid') return `${solvedGrid(q.top, q.left)}<p><strong>${esc(q.options[q.correct])}</strong></p>`;
    return `<p><strong>${esc(q.kind === 'multi' ? q.correct.map(i => q.options[i]).join(' · ') : q.options[q.correct])}</strong></p>`;
  }
  function resultPage(index) {
    const exam = state.exams[index];
    if (!exam) return `<section class="panel"><h1>Ese resultado no está disponible</h1><a href="#historial">Ir al historial</a></section>`;
    const gaps = [...new Set(exam.results.map((r, i) => r.correct ? null : D.exam[i].lesson).filter(Boolean))];
    return `<div class="breadcrumbs"><a href="#historial">← Historial</a><span>/ Revisión del simulacro</span></div><header class="review-head"><div class="grade"><strong>${exam.grade.toLocaleString('es-AR')}</strong><small>sobre 10</small></div><div><p class="eyebrow">UN RESULTADO PARA SEGUIR APRENDIENDO</p><h1 style="font-size:2.7rem">Tu revisión, paso a paso.</h1><p>${exam.correct} de 13 respuestas correctas · ${esc(date(exam.at))}</p><p class="small muted">Cada pregunta vale 1/13 de la nota. No hay descuento adicional por errores.</p></div></header><section class="panel" style="margin-top:1.5rem"><h2>Qué muestra este intento</h2>${gaps.length ? `<p>Resolviste ${exam.correct} situaciones correctamente. Estas clases te ayudan a revisar los conceptos de las respuestas pendientes:</p><div class="diagnostic">${gaps.map(id => `<a href="#clase/${id}"><strong>Clase ${id} · ${D.lessons[id - 1].title}</strong><br><span class="small">${diagnosticText(id)} → Repasar</span></a>`).join('')}</div>` : '<p>Aplicaste correctamente los conceptos en las 13 situaciones. Podés volver a las clases y a esta revisión cuando quieras.</p>'}<p class="small muted">La devolución se refiere a las respuestas de este intento y orienta el repaso.</p></section><section class="panel"><h2>Revisión de las 13 preguntas</h2><p class="small muted">Abrí cada pregunta para comparar tu respuesta con el razonamiento completo.</p>${D.exam.map((q, i) => { const r = exam.results[i]; return `<details class="review-item" ${r.correct ? '' : 'open'}><summary>${r.correct ? '✓ Correcta' : '↺ Para revisar'} · ${i + 1}. ${esc(q.title)}</summary><div class="review-body"><div class="review-answer"><strong>Tu respuesta</strong>${q.kind === 'grid' ? answerText(q, r.answer) : `<p>${answerText(q, r.answer)}</p>`}</div>${!r.correct ? feedbackHTML(q, { correct: false, errors: r.errors || [q.explanation] }) : ''}<p style="margin-top:1rem"><strong>Respuesta correcta y explicación</strong></p>${solution(q)}<p>${q.explanation}</p><a href="#clase/${q.lesson}">Revisar la clase ${q.lesson}</a></div></details>`; }).join('')}</section><div class="actions"><a class="button" href="#simulacro">Volver al simulacro</a><a class="button secondary" href="#mapa">Ir al recorrido</a></div>`;
  }
  function diagnosticText(id) { return ({ 2: 'Comparar alelos iguales y diferentes.', 3: 'Relacionar dominancia con genotipo y fenotipo.', 4: 'Separar la información genética de su expresión.', 6: 'Distinguir genotipo y fenotipo de F₁.', 7: 'Separar proporciones genotípicas, fenotípicas y probabilidad por evento.', 8: 'Seguir el aporte de cada progenitor para deducir alelos.', 10: 'Traducir grupos ABO a genotipos antes de combinarlos.', 11: 'Diferenciar portadores, afectados y genotipos que no pueden deducirse.', 12: 'Deducir Dd a partir de los antecedentes y calcular RhD negativo.' })[id] || 'Volver a conectar el concepto con la evidencia del ejercicio.'; }
  function historyPage() {
    return `<p class="eyebrow">LO QUE VAS CONSTRUYENDO</p><h1>Mi historial</h1><p>Los reintentos son parte del aprendizaje. No restan puntos ni borran clases completadas.</p><section class="panel"><h2>Tu progreso guardado</h2><p>${G.count(state)} de 12 clases completadas · ${Object.keys(state.mastered).length} de 24 preguntas resueltas.</p><p class="small muted">Se guarda en este navegador, para esta dirección web. Si borrás los datos del navegador o cambiás de dispositivo, necesitás un respaldo para recuperarlo.</p><div class="actions"><button class="secondary" data-action="export">Descargar respaldo</button><label class="button secondary" style="cursor:pointer">Importar respaldo<input class="sr-only" type="file" id="import-file" accept="application/json,.json"></label></div><p class="small muted" style="margin-top:.7rem">Importar un respaldo reemplaza el progreso de este navegador; se pedirá confirmación.</p></section><section class="panel"><h2>Simulacros</h2>${state.draft ? `<p><a href="#simulacro">Continuar el simulacro pendiente</a></p>` : ''}${state.exams.length ? state.exams.map((e, i) => `<div class="history-entry"><strong>Intento ${i + 1} · Nota ${e.grade.toLocaleString('es-AR')}/10</strong><p class="small">${esc(date(e.at))} · ${e.correct}/13 correctas</p><a href="#resultado/${i}">Abrir revisión completa →</a></div>`).reverse().join('') : '<p class="muted">Los resultados aparecerán acá cuando entregues tu primer simulacro.</p>'}</section><section class="panel"><h2>Intentos de práctica</h2>${state.attempts.length ? `<p class="small muted">${state.attempts.length} intentos registrados, sin penalización.</p>${state.attempts.slice().reverse().map(a => `<details class="history-entry"><summary>Clase ${a.lesson} · Pregunta ${a.id.endsWith('1') ? '1' : '2'} · ${a.correct ? '✓ Resuelta' : '↺ Reintento'}</summary><p class="small muted">${esc(date(a.at))}</p><p>${esc(D.lessons[a.lesson - 1]?.title || '')}</p>${(() => { const q = D.lessons[a.lesson - 1]?.questions.find(q => q.id === a.id); return q ? `<div class="review-answer">${answerText(q, a.answer)}</div>` : ''; })()}<a href="#clase/${a.lesson}">Volver a la clase</a></details>`).join('')}` : '<p class="muted">Tu primera respuesta comenzará este historial.</p>'}</section>`;
  }
  function sourcesPage() {
    return `<p class="eyebrow">DE DÓNDE SALE CADA IDEA</p><h1>Materiales y modelos</h1><section class="panel"><h2>Material de estudio de Pedro</h2><ul class="source-list"><li><strong>Bases de la herencia genética, 4 páginas.</strong> Genes y alelos (p. 1), homocigosis y heterocigosis (p. 2), dominancia (p. 3), genotipo y fenotipo (p. 4). Base de las clases 1–4.</li><li><strong>Leyes de Mendel, 2 páginas.</strong> Cruce parental y uniformidad F₁ (p. 1); segregación en F₂ y proporciones (p. 2). Base de las clases 5–7.</li><li><strong>Tres fotografías de la evaluación anterior.</strong> Referencia para los contenidos y la dificultad: ocho ítems de genética mendeliana, tres ABO, uno de fibrosis quística y uno Rh. Algunas líneas de las fotos están recortadas.</li></ul><p class="small muted">Los PDF y las fotografías no se distribuyen con la aplicación: el contenido didáctico está integrado. Así no se publican datos personales ni se necesitan archivos externos para estudiar.</p></section><section class="panel"><h2>Contenido complementario identificado</h2><ul class="source-list"><li>Método de Punnett e independencia entre fecundaciones: ampliación en clases 5–7.</li><li>Inferencia de genotipos: clase 8.</li><li>Codominancia y cruzamientos ABO: clases 9–10.</li><li>Fibrosis quística y portadores: clase 11.</li><li>Modelo escolar RhD y sus límites: clase 12.</li></ul></section><section class="panel"><h2>Precauciones científicas</h2><p>Las reglas de dominancia completa se aplican a los modelos expresamente indicados. No todos los caracteres son monogénicos ni todos los alelos presentan ese patrón.</p><p>Reemplazamos el ejemplo de color de ojos humano de los PDF por arvejas y plantas hipotéticas: el color de ojos depende de varios genes. Tampoco usamos “enanismo recesivo” como explicación general de la talla baja.</p><p>En ABO usamos el modelo habitual sin variantes raras. En RhD, d representa ausencia de D en un modelo simplificado. En fibrosis quística, ff representa dos variantes causales, que pueden ser diferentes en la realidad.</p><p>Un fenotipo por sí solo puede ser compatible con varios genotipos. Cuando no hay evidencia suficiente, no se afirma un genotipo único.</p></section><section class="panel"><h2>Referencias del complemento</h2><ul class="source-list"><li><a href="https://medlineplus.gov/genetics/understanding/traits/eyecolor/" target="_blank" rel="noopener noreferrer">MedlinePlus Genetics · Color de ojos</a></li><li><a href="https://www.ncbi.nlm.nih.gov/books/NBK100894/" target="_blank" rel="noopener noreferrer">NCBI Bookshelf · Sistema ABO</a></li><li><a href="https://www.cff.org/intro-cf/cf-genetics-basics" target="_blank" rel="noopener noreferrer">Cystic Fibrosis Foundation · Bases genéticas</a></li><li><a href="https://www.ncbi.nlm.nih.gov/books/NBK2269/" target="_blank" rel="noopener noreferrer">NCBI Bookshelf · Sistema Rh</a></li></ul><p class="small muted">Estos enlaces amplían el material; no son necesarios para completar las actividades.</p></section><a class="button" href="#mapa">Volver al recorrido</a>`;
  }
  function render(keepScroll = false) {
    const oldY = window.scrollY;
    const parts = (location.hash || '#mapa').slice(1).split('/');
    const route = parts[0], n = Number(parts[1]);
    current = { page: route === 'examen' && G.ready(state) && state.draft ? 'exam' : route === 'clase' ? 'lesson' : route, id: n };
    document.body.classList.toggle('exam-active', current.page === 'exam');
    if (route === 'clase') main.innerHTML = lessonPage(n);
    else if (route === 'simulacro') main.innerHTML = examStart();
    else if (route === 'examen') main.innerHTML = examPage(Number.isFinite(n) && n > 0 ? n - 1 : 0);
    else if (route === 'resultado') main.innerHTML = resultPage(n);
    else if (route === 'historial') main.innerHTML = historyPage();
    else if (route === 'fuentes') main.innerHTML = sourcesPage();
    else main.innerHTML = mapPage();
    const title = current.page === 'lesson' ? D.lessons[n - 1]?.title : current.page === 'exam' ? `Simulacro · ${n}/13` : 'Tu recorrido';
    document.title = `${title || 'Genética'} · Genética Challenge de Pedro`;
    if (keepScroll) window.scrollTo(0, oldY); else { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
  }
  function getQ(id) { return [...D.lessons.flatMap(l => l.questions), ...D.exam].find(q => q.id === id); }
  function updateAnswer(id, answer) {
    if (current.page === 'exam') { state.draft.answers[id] = answer; save(); }
    else buffers[id] = answer;
  }
  function freshGrid() { return { top: ['', ''], left: ['', ''], cells: ['', '', '', ''], conclusion: null }; }
  function updateExamStatus() {
    if (current.page !== 'exam') return;
    const answered = D.exam.filter(q => G.present(q, state.draft.answers[q.id])).length;
    const notice = main.querySelector('.exam-notice');
    if (notice) notice.textContent = `Sin pistas ni correcciones anticipadas. ${answered} de 13 respuestas completas. Podés revisarlas antes de entregar.`;
    main.querySelectorAll('.exam-nav a').forEach((el, i) => { const done = G.present(D.exam[i], state.draft.answers[D.exam[i].id]); el.classList.toggle('answered', done); el.setAttribute('aria-label', `Pregunta ${i + 1}, ${done ? 'contestada' : 'pendiente'}`); });
  }
  main.addEventListener('change', async event => {
    const el = event.target;
    if (el.id === 'import-file') {
      const file = el.files?.[0]; if (!file) return;
      try {
        if (file.size > 15000000) throw new Error('El respaldo es demasiado grande.');
        const parsed = JSON.parse(await file.text());
        if (parsed.app !== 'genetica-challenge-pedro' || parsed.state?.version !== G.VERSION) throw new Error('No es un respaldo compatible.');
        if (window.confirm('¿Reemplazar el progreso de este navegador con el respaldo elegido?')) { state = G.hydrate(parsed.state); buffers = {}; feedback = {}; save(); render(); toast('Respaldo importado.'); }
      } catch (err) { toast('No se pudo importar. ' + err.message); }
      return;
    }
    if (!el.dataset.answer) return;
    const q = getQ(el.dataset.answer); if (!q) return;
    if (current.page !== 'exam' && state.mastered[q.id]) return;
    if (q.kind === 'grid') { const a = answerFor(q) || freshGrid(); a.conclusion = Number(el.value); updateAnswer(q.id, a); }
    else if (q.kind === 'multi') updateAnswer(q.id, [...main.querySelectorAll(`input[data-answer="${q.id}"]:checked`)].map(e => Number(e.value)));
    else updateAnswer(q.id, Number(el.value));
    updateExamStatus();
  });
  main.addEventListener('click', event => {
    const scroll = event.target.closest('[data-scroll]');
    if (scroll) { event.preventDefault(); const target = document.getElementById(scroll.dataset.scroll); target?.scrollIntoView({ behavior: 'smooth', block: 'start' }); if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); } return; }
    const tokenEl = event.target.closest('[data-token]');
    if (tokenEl && !tokenEl.disabled) {
      palettes[tokenEl.dataset.q] = tokenEl.dataset.type === 'erase' ? '__erase' : tokenEl.dataset.token;
      const widget = tokenEl.closest('.interactive-grid');
      widget.querySelectorAll('[data-token]').forEach(t => t.setAttribute('aria-pressed', String(t === tokenEl)));
      widget.querySelector('.grid-status').textContent = palettes[tokenEl.dataset.q] === '__erase' ? 'Borrador seleccionado. Tocá una casilla.' : `Ficha seleccionada: ${tokenEl.dataset.token}. Tocá una casilla para colocarla.`;
      return;
    }
    const slot = event.target.closest('[data-slot]');
    if (slot && !slot.disabled) { place(slot, palettes[slot.dataset.slot]); return; }
    const button = event.target.closest('[data-action]'); if (!button) return;
    const action = button.dataset.action;
    if (action === 'step' || action === 'restart-example') {
      const id = Number(button.dataset.lesson); steps[id] = action === 'step' ? Math.min(3, (steps[id] || 1) + 1) : 1;
      const parent = document.getElementById('ejemplo'); parent.outerHTML = example(D.lessons[id - 1]);
      const next = document.querySelector('#ejemplo .example-controls button'); next?.focus({ preventScroll: true });
    }
    if (action === 'check') {
      const q = getQ(button.dataset.q), lesson = D.lessons.find(l => l.questions.some(item => item.id === q.id));
      if (state.mastered[q.id]) return;
      const before = G.complete(state, lesson.id);
      feedback[q.id] = G.practice(state, lesson.id, q, buffers[q.id]); save(); render(true);
      const box = document.querySelector(`#question-${q.id} .feedback`); box?.setAttribute('tabindex', '-1'); box?.focus({ preventScroll: true });
      if (!before && G.complete(state, lesson.id)) toast(lesson.id === 12 ? '¡Recorrido completo! Simulacro desbloqueado.' : `¡Clase ${lesson.id} completada! Se abrió la siguiente.`);
    }
    if (action === 'start-exam') {
      if (!G.ready(state)) return;
      if (!state.draft) state.draft = { answers: {}, index: 0, started: new Date().toISOString() };
      save(); location.hash = `examen/${state.draft.index + 1}`;
    }
    if (action === 'pause-exam') { save(); location.hash = 'simulacro'; toast('Simulacro guardado. Podés continuarlo después.'); }
    if (action === 'submit-exam') {
      const missing = D.exam.filter(q => !G.present(q, state.draft.answers[q.id]));
      if (missing.length) { document.getElementById('exam-submit-feedback').innerHTML = `<div class="feedback error"><strong>Faltan respuestas completas.</strong><p>Revisá las preguntas ${missing.map(q => q.number).join(', ')}. En los cuadros también se necesitan los gametos, las cuatro combinaciones y la conclusión.</p><a href="#examen/${missing[0].number}">Ir a la primera pendiente →</a></div>`; return; }
      if (!window.confirm('¿Entregar las 13 respuestas? Después verás la nota y la corrección completa.')) return;
      G.finish(state, D.exam); save(); location.hash = `resultado/${state.exams.length - 1}`;
    }
    if (action === 'export') {
      const blob = new Blob([JSON.stringify({ app: 'genetica-challenge-pedro', exported: new Date().toISOString(), state }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'genetica-pedro-respaldo.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });
  function place(slot, value) {
    const id = slot.dataset.slot, q = getQ(id);
    if (!value) { toast('Elegí primero una ficha de la bandeja.'); return; }
    const group = slot.dataset.group, index = Number(slot.dataset.index);
    if (value !== '__erase' && !(group === 'cells' ? q.genotypes : q.alleles).includes(value)) { toast(group === 'cells' ? 'En el centro usá una combinación de dos alelos.' : 'En los bordes colocá un solo alelo por gameto.'); return; }
    const a = answerFor(q) || freshGrid(); a[group][index] = value === '__erase' ? '' : value; updateAnswer(id, a);
    slot.textContent = a[group][index] || '+'; slot.classList.toggle('filled', Boolean(a[group][index]));
    const prefix = slot.getAttribute('aria-label').split(':')[0]; slot.setAttribute('aria-label', `${prefix}: ${a[group][index] || 'vacío'}. Elegí una ficha y activá esta casilla.`);
    document.getElementById(`status-${id}`).textContent = value === '__erase' ? 'Casilla borrada.' : `${value} colocado. Podés reutilizar esta ficha.`;
    updateExamStatus();
  }
  main.addEventListener('dragstart', event => { const t = event.target.closest('[data-token]'); if (!t || t.disabled || t.dataset.type === 'erase') return; event.dataTransfer.setData('text/plain', JSON.stringify({ q: t.dataset.q, value: t.dataset.token })); event.dataTransfer.effectAllowed = 'copy'; });
  main.addEventListener('dragover', event => { if (event.target.closest('[data-slot]:not(:disabled)')) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; } });
  main.addEventListener('drop', event => { const slot = event.target.closest('[data-slot]:not(:disabled)'); if (!slot) return; event.preventDefault(); try { const data = JSON.parse(event.dataTransfer.getData('text/plain')); if (data.q === slot.dataset.slot) place(slot, data.value); } catch { /* Una ficha ajena a la actividad no modifica el cuadro. */ } });
  window.addEventListener('hashchange', () => render());
  window.addEventListener('beforeunload', save);
  render();
})();
