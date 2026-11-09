(function (root) {
  'use strict';
  const KEY = 'genetica-pedro-laboratorio-v1';
  const trim = value => String(value ?? '').trim();

  function genotype(value) {
    const compact = trim(value).replace(/\s+/g, '').replace(/I\^?A/g, 'Iᴬ').replace(/I\^?B/g, 'Iᴮ');
    const tokens = compact.match(/I[ᴬᴮ]|[iDdNn]/g);
    if (tokens?.length === 2 && tokens.join('') === compact) return combine(...tokens);
    return compact;
  }

  function combine(a, b) {
    if (a === 'i') return b + a;
    if (b === 'i') return a + b;
    return [a, b].sort().join('');
  }

  function fieldCorrect(field, value) {
    const raw = trim(value);
    if (field.type === 'percent') {
      const number = raw.replace(/\s*%$/, '').replace(',', '.');
      return /^\d+(\.\d+)?$/.test(number) && Number(number) === field.expected;
    }
    if (field.type === 'genotype') return genotype(raw) === field.expected;
    if (field.type === 'genotype-list') return raw.split(/[,;/]+/).map(genotype).sort().join('|') === [...field.expected].sort().join('|');
    return raw.toLowerCase() === field.expected.toLowerCase();
  }

  function blank(task) {
    if (task.kind === 'match') return { links: task.pairs.map(() => '') };
    if (task.kind === 'fill') return { fields: task.fields.map(() => '') };
    return { before: task.before.map(() => ''), top: ['', ''], left: ['', ''], cells: ['', '', '', ''], after: task.after.map(() => '') };
  }

  function solution(task) {
    if (task.kind === 'match') return { links: task.pairs.map(pair => pair[1]) };
    if (task.kind === 'fill') return { fields: task.fields.map(f => f.expected) };
    return { before: task.before.map(f => f.expected), top: task.top, left: task.left, cells: task.left.flatMap(left => task.top.map(top => combine(top, left))), after: task.after.map(f => f.expected) };
  }

  function assess(task, answer) {
    const checks = [];
    const add = (label, values, correct, message) => checks.push({ label, complete: values.every(v => trim(v) !== ''), correct, message });
    const fields = (label, definitions, values) => {
      if (!definitions.length) return;
      const incorrect = definitions.filter((f, i) => !fieldCorrect(f, values[i]));
      add(label, values, !incorrect.length, `Revisá ${incorrect.map(f => f.label).join(', ')}.`);
    };
    if (task.kind === 'match') {
      const wrong = task.pairs.filter((p, i) => p[1] !== answer.links[i]);
      add('Relaciones', answer.links, !wrong.length, `Revisá las conexiones de ${wrong.map(p => p[0]).join(', ')}.`);
    } else if (task.kind === 'fill') {
      fields('Interpretación', task.fields, answer.fields);
    } else {
      fields('Genotipos parentales', task.before, answer.before);
      const samePair = (actual, expected) => [...actual].sort().join('|') === [...expected].sort().join('|');
      const topOK = samePair(answer.top, task.top);
      const leftOK = samePair(answer.left, task.left);
      const sides = [!topOK && 'arriba', !leftOK && 'a la izquierda'].filter(Boolean).join(' y ');
      add('Gametos', [...answer.top, ...answer.left], topOK && leftOK, `Revisá los alelos ${sides}. En cada lugar va una sola copia del progenitor de ese lado.`);
      const wrongCells = answer.cells.flatMap((value, i) => {
        const top = answer.top[i % 2], left = answer.left[Math.floor(i / 2)];
        return top && left && value === combine(top, left) ? [] : [i + 1];
      });
      add('Cuadro de Punnett', [...answer.top, ...answer.left, ...answer.cells], !wrongCells.length, `Revisá las casillas ${wrongCells.join(', ')} (numeradas por filas). Cada una combina el aporte de su fila y el de su columna.`);
      fields('Interpretación', task.after, answer.after);
    }
    return { checks, complete: checks.every(c => c.complete), correct: checks.every(c => c.complete && c.correct) };
  }

  function fresh() { return { version: 1, passed: {}, draft: null, results: [] }; }
  function unlocked(state, index) {
    for (let i = 0; i < index; i++) if (!state.passed[`${i}-0`] || !state.passed[`${i}-1`]) return false;
    return true;
  }
  function load(storage) {
    const data = JSON.parse(storage.getItem(KEY));
    return data?.version === 1 && data.passed && Array.isArray(data.results) ? data : fresh();
  }
  function submit(state, tasks, at) {
    if (!unlocked(state, 4) || !state.draft) return null;
    const answers = tasks.map((task, i) => state.draft[i] || blank(task));
    const grades = tasks.map((task, i) => assess(task, answers[i]));
    if (!grades.every(grade => grade.complete)) return null;
    const result = { answers, correct: grades.filter(grade => grade.correct).length, at };
    state.results.push(result);
    state.draft = null;
    return result;
  }

  if (typeof module !== 'undefined') module.exports = { KEY, combine, blank, solution, assess, fresh, unlocked, load, submit };
  if (typeof document === 'undefined') return;

  const { lessons, challenge } = root.LabContent;
  const main = document.getElementById('lab-main');
  const warning = document.getElementById('storage-warning');
  const esc = value => trim(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const answers = {}, feedback = {}, steps = {};
  let state = fresh(), view, selected = null, observer;
  try { state = load(localStorage); } catch { storageWarning(); }

  function storageWarning() { warning.textContent = 'El navegador no permite recuperar o guardar el progreso del laboratorio en este momento.'; }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { storageWarning(); }
  }

  function diagram(type) {
    if (type === 'abo') {
      const rows = [['A', 'IᴬIᴬ · Iᴬi'], ['B', 'IᴮIᴮ · Iᴮi'], ['AB', 'IᴬIᴮ'], ['O', 'ii']];
      return `<figure class="concept-visual"><div class="lab-diagram">${rows.map(([group, genes]) => `<div class="gene-pair"><svg viewBox="0 0 90 68" aria-hidden="true"><ellipse cx="45" cy="34" rx="33" ry="23" fill="#e9b3a3" stroke="#a55244" stroke-width="2"/>${group.includes('A') ? '<path d="M30 4l8 14H22z" fill="#245c4b"/><text x="28" y="40">A</text>' : ''}${group.includes('B') ? '<rect x="55" y="7" width="13" height="13" fill="#7754a0"/><text x="55" y="40">B</text>' : ''}</svg><strong>${group}</strong><small>${genes}</small></div>`).join('')}</div><figcaption>Triángulo = marca A. Cuadrado = marca B. Los símbolos muestran qué marcas están presentes.</figcaption></figure>`;
    }
    if (type === 'rh') return `<figure class="concept-visual"><svg viewBox="0 0 440 170" role="img" aria-label="Madre dd aporta d y descendiente positivo Dd conserva d y presenta D"><rect x="20" y="16" width="170" height="48" rx="12" fill="#fffef9"/><text x="105" y="45" text-anchor="middle">Madre dd (−)</text><rect x="250" y="16" width="170" height="48" rx="12" fill="#fffef9"/><text x="335" y="45" text-anchor="middle">Otro aporte D</text><path d="M105 65v30l95 19 M335 65v30l-95 19" fill="none" stroke="#245c4b" stroke-width="3"/><text x="115" y="91">d</text><text x="315" y="91">D</text><rect x="122" y="113" width="196" height="46" rx="12" fill="#dced96"/><text x="220" y="142" text-anchor="middle">Descendiente Dd (+)</text></svg><figcaption>El vínculo familiar revela d. La marca observada revela D.</figcaption></figure>`;
    if (type === 'cf') return `<figure class="concept-visual"><div class="lab-diagram">${[['NN', 'Sin enfermedad, no portador'], ['Nn', 'Portador sin enfermedad'], ['nn', 'Con fibrosis quística']].map(([genes, label]) => `<div class="gene-pair"><svg viewBox="0 0 100 64" aria-hidden="true">${[0, 1].map(i => `<rect x="${20 + i * 36}" y="4" width="24" height="55" rx="11" fill="${genes[i] === 'N' ? '#bad58a' : '#efb79d'}"/><text x="${32 + i * 36}" y="37" text-anchor="middle">${genes[i]}</text>`).join('')}</svg><strong>${genes}</strong><small>${label}</small></div>`).join('')}</div><figcaption>Cada barra representa una de las dos copias de CFTR en el modelo.</figcaption></figure>`;
    return `<figure class="concept-visual"><div class="lab-diagram">${[['IᴬIᴮ', 'AB', '25 %'], ['Iᴬi', 'A', '25 %'], ['IᴮIᴮ + Iᴮi', 'B', '50 %'], ['Sin ii', 'O', '0 %']].map(([genes, group, percent]) => `<div class="gene-pair"><small>${genes} → ${group}</small><strong>${percent}</strong><div class="lab-bar" aria-hidden="true"><span style="width:${parseInt(percent, 10)}%"></span></div></div>`).join('')}</div><figcaption>Dos casillas distintas pueden aportar al mismo grupo. En B, 25 % + 25 % = 50 %.</figcaption></figure>`;
  }

  function grid(top, left, cells, slot) {
    const value = slot || ((group, i, text) => esc(text || '—'));
    return `<table class="punnett"><caption class="sr-only">Cuadro de Punnett de dos filas y dos columnas</caption><thead><tr><th class="corner">Gametos</th>${top.map((v, i) => `<th scope="col">${value('top', i, v, `Gameto superior ${i + 1}`)}</th>`).join('')}</tr></thead><tbody>${left.map((v, row) => `<tr><th scope="row">${value('left', row, v, `Gameto izquierdo ${row + 1}`)}</th>${cells.slice(row * 2, row * 2 + 2).map((cell, col) => `<td>${value('cells', row * 2 + col, cell, `Casilla ${row * 2 + col + 1}`)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }

  function example(lesson, index) {
    const step = steps[index] || 0, ex = lesson.example;
    const top = step ? ex.top : ['', ''], left = step ? ex.left : ['', ''];
    const cells = step === 2 ? ex.left.flatMap(a => ex.top.map(b => combine(a, b))) : ['', '', '', ''];
    return `<section class="panel" id="lab-example"><p class="eyebrow">Ejemplo resuelto</p><h2>${ex.title}</h2>${grid(top, left, cells)}<ol>${ex.steps.slice(0, step + 1).map(s => `<li>${s}</li>`).join('')}</ol><div class="example-controls"><span>Paso ${step + 1} de 3</span>${step < 2 ? `<button type="button" class="secondary" data-step="${index}">Ver paso ${step + 2} →</button>` : ''}</div></section>`;
  }

  function inputs(definitions, values, group, key) {
    if (!definitions.length) return '';
    return `<div class="lab-fields">${definitions.map((field, i) => `<label>${esc(field.label)}${field.type === 'percent' ? ' (%)' : ''}<input type="text" ${field.type === 'percent' ? 'inputmode="decimal"' : ''} autocomplete="off" spellcheck="false" data-field="${group}" data-index="${i}" data-key="${key}" value="${esc(values[i])}"></label>`).join('')}</div>`;
  }

  function matching(task, answer, key) {
    return `<p class="small muted">${task.mode === 'classify' ? 'Elegí una tarjeta y luego su categoría.' : 'Elegí una tarjeta de la izquierda y luego su destino a la derecha.'} Para cambiar una relación, elegí un destino distinto.</p><div class="lab-match" data-match="${key}"><svg class="lab-arrows" aria-hidden="true"></svg><div>${task.pairs.map(([label], i) => `<button type="button" class="secondary" data-source="${i}" data-key="${key}" aria-pressed="${selected?.key === key && selected.source === i}">${esc(label)}<small>${answer.links[i] ? `→ ${esc(answer.links[i])}` : 'Sin conexión'}</small></button>`).join('')}</div><div>${task.targets.map((target, i) => `<button type="button" class="secondary" data-target="${i}" data-key="${key}">${esc(target)}</button>`).join('')}</div></div>`;
  }

  function crossing(task, answer, key) {
    const alleles = [...new Set([...task.top, ...task.left])];
    const pairs = [...new Set(alleles.flatMap(a => alleles.map(b => combine(a, b))))];
    function palette(values, label) {
      return `<p class="small muted lab-palette-label">${label}</p><div class="palette">${values.map(value => `<button type="button" class="token" draggable="true" data-piece="${value}" data-key="${key}" aria-pressed="${selected?.key === key && selected.piece === value}">${value}</button>`).join('')}</div>`;
    }
    const slot = (group, i, value, label) => `<button type="button" class="slot${value ? ' filled' : ''}" data-slot="${group}" data-index="${i}" data-key="${key}" aria-label="${label}: ${esc(value || 'vacío')}">${esc(value || '+')}</button>`;
    return `${task.before.length ? `<h3>Genotipos parentales</h3>${inputs(task.before, answer.before, 'before', key)}` : ''}<h3>Gametos y cuadro de Punnett</h3><p class="small muted">Arrastrá una ficha o elegila y tocá la casilla. Usá un alelo por gameto y dos por casilla. Podés reemplazar cualquier ficha.</p>${palette(alleles, 'Alelos para los bordes')}${palette(pairs, 'Combinaciones para el centro')}${grid(answer.top, answer.left, answer.cells, slot)}<h3>Interpretación</h3>${inputs(task.after, answer.after, 'after', key)}`;
  }

  function readTask(task, answer) {
    const fields = (defs, values) => defs.map((field, i) => {
      const value = Array.isArray(values[i]) ? values[i].join(', ') : trim(values[i]);
      const unit = field.type === 'percent' && value && !value.endsWith('%') ? ' %' : '';
      return `<li><strong>${esc(field.label)}</strong> · ${esc(value || '—')}${unit}</li>`;
    }).join('');
    if (task.kind === 'match') return `<ul>${task.pairs.map(([label], i) => `<li>${esc(label)} → ${esc(answer.links[i] || '—')}</li>`).join('')}</ul>`;
    if (task.kind === 'fill') return `<ul>${fields(task.fields, answer.fields)}</ul>`;
    return `${task.before.length ? `<ul>${fields(task.before, answer.before)}</ul>` : ''}${grid(answer.top, answer.left, answer.cells)}<ul>${fields(task.after, answer.after)}</ul>`;
  }

  function taskBox(task, answer, key, label, practice) {
    const done = practice && state.passed[key];
    const result = practice && feedback[key];
    const body = done ? readTask(task, done) : task.kind === 'match' ? matching(task, answer, key) : task.kind === 'cross' ? crossing(task, answer, key) : inputs(task.fields, answer.fields, 'fields', key);
    return `<section class="panel lab-task" id="task-${key}"><p class="eyebrow">${label}${done ? ' · ✓ Resuelta' : ''}</p><h2>${esc(task.title)}</h2>${body}${done ? `<p class="takeaway">${task.explanation}</p>` : `<p class="lab-status small" role="status" id="status-${key}"></p>${result ? `<div class="feedback error" role="status"><ul>${result.checks.map(check => `<li><strong>${check.label}</strong> · ${!check.complete ? 'Faltan datos.' : check.correct ? 'Correcto.' : esc(check.message)}</li>`).join('')}</ul>${result.complete ? `<p>${task.explanation}</p>` : ''}</div>` : ''}${practice ? `<div class="question-actions"><button class="primary" type="button" data-check="${key}">${result ? 'Volver a comprobar' : 'Comprobar actividad'}</button><a class="button secondary" href="#lab-explanation" data-explanation>Revisar explicación</a></div>` : ''}`}</section>`;
  }

  function home() {
    const count = lessons.filter((_, i) => state.passed[`${i}-0`] && state.passed[`${i}-1`]).length;
    return `<section class="lab-hero"><p class="eyebrow">Práctica complementaria · 4.º año</p><h1>Laboratorio de Genética</h1><p class="lab-lead">Aprendé, construí y descubrí</p><p>Seguí los alelos, armá cruces y explicá lo que puede ocurrir en un nuevo nacimiento.</p><strong>${count} de 4 microclases completas</strong></section><div class="path-grid lab-path">${lessons.map((lesson, i) => unlocked(state, i) ? `<a class="lesson-card" href="#clase/${i + 1}"><span class="number">0${i + 1}</span><h3>${lesson.title}</h3><span class="card-status">${state.passed[`${i}-0`] && state.passed[`${i}-1`] ? '✓ Completada · Repasar' : 'Entrar a la microclase →'}</span></a>` : `<article class="lesson-card locked"><span class="number">0${i + 1}</span><h3>${lesson.title}</h3><span class="card-status">🔒 Completá la clase anterior</span></article>`).join('')}</div><section class="exam-card"><div><h2>Desafío final</h2><p>10 problemas de dificultad progresiva. Corrección completa al entregar.</p></div>${unlocked(state, 4) ? '<a class="button" href="#desafio">Abrir desafío →</a>' : '<span class="badge">🔒 Completá las cuatro clases</span>'}</section>${state.results.length ? `<section class="panel lab-history"><h2>Resultados del laboratorio</h2>${state.results.map((r, i) => `<p><a href="#resultado/${i + 1}">Intento ${i + 1} · ${r.correct}/10</a> <span class="small muted">${new Date(r.at).toLocaleDateString('es-AR')}</span></p>`).reverse().join('')}</section>` : ''}`;
  }

  function lessonPage(index) {
    const lesson = lessons[index];
    const complete = unlocked(state, index + 1);
    return `<div class="breadcrumbs"><a href="#laboratorio">← Laboratorio</a><span>Microclase ${index + 1} de 4</span></div><h1>${lesson.title}</h1><section class="panel" id="lab-explanation" tabindex="-1"><p class="eyebrow">Comprender</p><h2>Qué mirar y cómo razonarlo</h2>${lesson.text.map(p => `<p>${p}</p>`).join('')}${diagram(lesson.visual)}</section>${example(lesson, index)}${lesson.activities.map((task, i) => { const key = `${index}-${i}`; return taskBox(task, answers[key] || blank(task), key, i === 0 ? 'Actividad 1 · Comprensión' : 'Actividad 2 · Aplicación', true); }).join('')}${complete ? `<a class="button" href="${index === 3 ? '#desafio' : `#clase/${index + 2}`}">${index === 3 ? 'Abrir el desafío final' : 'Siguiente microclase'} →</a>` : '<p class="muted">Resolvé ambas actividades para avanzar.</p>'}`;
  }

  function challengePage(index) {
    if (index < 0 || !state.draft) return `<div class="breadcrumbs"><a href="#laboratorio">← Laboratorio</a></div><h1>Desafío final</h1><section class="panel"><p>Resolvé los diez problemas. Podés volver a cualquier problema antes de entregar. Al final vas a ver tus respuestas, las soluciones y qué clases conviene repasar.</p><button class="primary" type="button" data-start>${state.draft ? 'Continuar desafío' : 'Comenzar desafío'} →</button></section>`;
    const task = challenge[index], key = `d-${index}`;
    return `<div class="breadcrumbs"><a href="#laboratorio">← Guardar y volver al laboratorio</a></div><h1>Desafío final</h1><nav class="exam-nav" aria-label="Problemas">${challenge.map((q, i) => `<a href="#desafio/${i + 1}" class="${i === index ? 'active' : ''} ${assess(q, state.draft[i] || blank(q)).complete ? 'answered' : ''}" ${i === index ? 'aria-current="step"' : ''}>${i + 1}</a>`).join('')}</nav>${taskBox(task, state.draft[index] || blank(task), key, `Problema ${index + 1} de 10`, false)}<div class="actions">${index > 0 ? `<a class="button secondary" href="#desafio/${index}">← Anterior</a>` : ''}${index < 9 ? `<a class="button" href="#desafio/${index + 2}">Siguiente →</a>` : '<button class="primary" type="button" data-submit>Entregar desafío</button>'}</div><p class="lab-status" role="status" id="lab-submit-status"></p>`;
  }

  function resultPage(result) {
    return `<div class="breadcrumbs"><a href="#laboratorio">← Laboratorio</a></div><h1>Revisión del desafío</h1><p class="lab-lead">${result.correct} de 10 problemas resueltos</p>${challenge.map((task, i) => {
      const answer = result.answers[i], grade = assess(task, answer);
      return `<details class="panel" ${grade.correct ? '' : 'open'}><summary><strong>${i + 1}. ${grade.correct ? 'Correcto' : 'Para revisar'} · ${esc(task.title)}</strong></summary><div class="lab-result"><h3>Tu respuesta</h3>${readTask(task, answer)}<ul>${grade.checks.map(c => `<li>${c.label} · ${c.correct ? 'Correcto' : esc(c.message)}</li>`).join('')}</ul><h3>Solución y explicación</h3>${readTask(task, solution(task))}<p>${task.explanation}</p>${grade.correct ? '' : `<a href="#clase/${task.review + 1}">Repasá ${lessons[task.review].title}</a>`}</div></details>`;
    }).join('')}<a class="button" href="#desafio">Volver al desafío</a>`;
  }

  function route() {
    const match = location.hash.match(/^#(clase|desafio|resultado)(?:\/(\d+))?$/);
    if (!match) return { page: 'home' };
    const index = Number(match[2] || 0) - 1;
    if (match[1] === 'clase' && index >= 0 && index < 4) return { page: unlocked(state, index) ? 'lesson' : 'locked', index };
    if (match[1] === 'desafio' && index < 10) return { page: unlocked(state, 4) ? 'challenge' : 'locked', index };
    if (match[1] === 'resultado' && state.results[index]) return { page: 'result', index };
    return { page: 'home' };
  }

  function render(keep = false) {
    view = route();
    if (view.page === 'lesson') main.innerHTML = lessonPage(view.index);
    else if (view.page === 'challenge') main.innerHTML = challengePage(view.index);
    else if (view.page === 'result') main.innerHTML = resultPage(state.results[view.index]);
    else if (view.page === 'locked') main.innerHTML = '<section class="panel"><h1>Actividad bloqueada</h1><p>Completá las microclases anteriores para acceder.</p><a class="button" href="#laboratorio">Volver al laboratorio</a></section>';
    else main.innerHTML = home();
    observer?.disconnect();
    observer = typeof ResizeObserver === 'function' ? new ResizeObserver(drawLines) : null;
    main.querySelectorAll('[data-match]').forEach(board => observer?.observe(board));
    drawLines();
    if (!keep) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
  }

  function taskFor(key) {
    if (key.startsWith('d-') && view.page === 'challenge' && state.draft) return challenge[Number(key.slice(2))];
    if (view.page === 'lesson' && key.startsWith(`${view.index}-`)) return lessons[view.index].activities[Number(key.split('-')[1])];
    return null;
  }
  function answerFor(key, task) {
    const target = key.startsWith('d-') ? state.draft : answers;
    const id = key.startsWith('d-') ? key.slice(2) : key;
    return target[id] ||= blank(task);
  }

  function drawLines() {
    main.querySelectorAll('[data-match]').forEach(board => {
      const key = board.dataset.match, task = taskFor(key);
      if (!task) return;
      const answer = answerFor(key, task), box = board.getBoundingClientRect();
      const sources = board.querySelectorAll('[data-source]'), targets = board.querySelectorAll('[data-target]');
      const svg = board.querySelector('svg');
      svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
      const marker = `arrow-${key}`;
      const lines = answer.links.map((link, i) => {
        const target = targets[task.targets.indexOf(link)];
        if (!target) return '';
        const a = sources[i].getBoundingClientRect(), b = target.getBoundingClientRect();
        const x1 = a.right - box.left, y1 = a.top + a.height / 2 - box.top;
        const x2 = b.left - box.left - 3, y2 = b.top + b.height / 2 - box.top;
        const mid = (x1 + x2) / 2;
        return `<path d="M${x1} ${y1} C${mid} ${y1} ${mid} ${y2} ${x2} ${y2}" fill="none" stroke="#245c4b" stroke-width="2" marker-end="url(#${marker})"/>`;
      });
      svg.innerHTML = `<defs><marker id="${marker}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#245c4b"/></marker></defs>${lines.join('')}`;
    });
  }

  function status(key, message) {
    const el = document.getElementById(`status-${key}`);
    if (el) el.textContent = message;
  }

  function select(button, selection, selector) {
    selected = selection;
    button.closest('.lab-task').querySelectorAll(selector).forEach(el => el.setAttribute('aria-pressed', String(el === button)));
  }

  function place(button, piece) {
    const { key, slot, index } = button.dataset, task = taskFor(key);
    if (!task || !piece || state.passed[key]) { status(key, 'Elegí una ficha primero.'); return; }
    const alleles = [...task.top, ...task.left];
    const allowed = slot === 'cells' ? alleles.some(a => alleles.some(b => combine(a, b) === piece)) : alleles.includes(piece);
    if (!allowed) { status(key, slot === 'cells' ? 'En el centro va una combinación de dos alelos.' : 'En el borde va un alelo por gameto.'); return; }
    answerFor(key, task)[slot][index] = piece;
    if (key.startsWith('d-')) save();
    button.textContent = piece;
    button.classList.add('filled');
    button.setAttribute('aria-label', `${button.getAttribute('aria-label').split(':')[0]}: ${piece}`);
    status(key, `Ficha ${piece} colocada.`);
  }

  main.addEventListener('input', event => {
    const { key, field, index } = event.target.dataset;
    if (!field) return;
    const task = taskFor(key);
    if (!task || state.passed[key]) return;
    answerFor(key, task)[field][index] = event.target.value;
    if (key.startsWith('d-')) save();
  });

  main.addEventListener('click', event => {
    const button = event.target.closest('button');
    const explanation = event.target.closest('[data-explanation]');
    if (explanation) {
      event.preventDefault();
      const section = document.getElementById('lab-explanation');
      section.scrollIntoView(); section.focus({ preventScroll: true });
    }
    if (!button) return;
    const { key, source, target, piece, slot, step, check } = button.dataset;
    if (step !== undefined) {
      steps[step] = Math.min(2, (steps[step] || 0) + 1);
      document.getElementById('lab-example').outerHTML = example(lessons[step], Number(step));
      document.querySelector('#lab-example button')?.focus({ preventScroll: true });
    } else if (source !== undefined) {
      select(button, { key, source: Number(source) }, '[data-source]');
      status(key, 'Tarjeta elegida. Tocá su destino.');
    } else if (target !== undefined) {
      if (selected?.key !== key || selected.source === undefined) { status(key, 'Elegí primero una tarjeta de la izquierda.'); return; }
      const task = taskFor(key), value = task.targets[Number(target)];
      answerFor(key, task).links[selected.source] = value;
      if (key.startsWith('d-')) save();
      const row = button.closest('.lab-match').querySelector(`[data-source="${selected.source}"]`);
      row.querySelector('small').textContent = `→ ${value}`;
      status(key, `Conexión con ${value} guardada.`);
      drawLines();
    } else if (piece !== undefined) {
      select(button, { key, piece }, '[data-piece]');
      status(key, `Ficha ${piece} elegida. Tocá una casilla.`);
    } else if (slot !== undefined) {
      place(button, selected?.key === key ? selected.piece : null);
    } else if (check !== undefined) {
      const task = taskFor(check);
      if (!task || state.passed[check]) return;
      const answer = answerFor(check, task), grade = assess(task, answer);
      feedback[check] = grade;
      if (grade.correct) { state.passed[check] = answer; save(); }
      render(true);
    } else if (Object.hasOwn(button.dataset, 'start') && unlocked(state, 4)) {
      state.draft ||= {}; save(); location.hash = '#desafio/1';
      render();
    } else if (Object.hasOwn(button.dataset, 'submit')) {
      const result = submit(state, challenge, new Date().toISOString());
      if (!result) {
        const pending = challenge.flatMap((task, i) => assess(task, state.draft?.[i] || blank(task)).complete ? [] : [i + 1]);
        document.getElementById('lab-submit-status').textContent = `Completá los problemas ${pending.join(', ')} antes de entregar.`;
      } else { save(); location.hash = `#resultado/${state.results.length}`; }
    }
  });

  main.addEventListener('dragstart', event => {
    const piece = event.target.closest('[data-piece]');
    if (!piece) return;
    event.dataTransfer.setData('text/plain', JSON.stringify({ key: piece.dataset.key, piece: piece.dataset.piece }));
    event.dataTransfer.effectAllowed = 'copy';
  });
  main.addEventListener('dragover', event => {
    if (event.target.closest('[data-slot]')) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }
  });
  main.addEventListener('drop', event => {
    const slot = event.target.closest('[data-slot]');
    if (!slot) return;
    event.preventDefault();
    let data;
    try { data = JSON.parse(event.dataTransfer.getData('text/plain')); } catch { return; }
    if (data?.key === slot.dataset.key) place(slot, data.piece);
  });
  window.addEventListener('hashchange', () => { selected = null; render(); });
  render();
})(globalThis);
