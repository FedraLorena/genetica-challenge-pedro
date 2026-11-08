/* Motor sin acceso al DOM: también se verifica con Node, sin dependencias. */
(function (root) {
  'use strict';
  const VERSION = 1;
  const KEY = 'genetica-pedro-v1';
  function fresh() { return { version: VERSION, mastered: {}, attempts: [], exams: [], draft: null }; }
  function hydrate(raw) {
    if (!raw || raw.version !== VERSION) return fresh();
    const state = fresh();
    if (raw.mastered && typeof raw.mastered === 'object') {
      for (let l = 1; l <= 12; l++) for (let q = 1; q <= 2; q++) {
        const id = `l${l}q${q}`;
        if (raw.mastered[id] === true) state.mastered[id] = true;
      }
    }
    state.attempts = Array.isArray(raw.attempts) ? raw.attempts.filter(a => a && typeof a.id === 'string' && typeof a.correct === 'boolean') : [];
    state.exams = Array.isArray(raw.exams) ? raw.exams.filter(e => e && Array.isArray(e.results) && e.results.length === 13) : [];
    if (raw.draft && typeof raw.draft.answers === 'object' && raw.draft.answers !== null) state.draft = { answers: raw.draft.answers, index: Math.max(0, Math.min(12, Number(raw.draft.index) || 0)), started: raw.draft.started || new Date().toISOString() };
    return state;
  }
  function complete(state, id) { return state.mastered[`l${id}q1`] === true && state.mastered[`l${id}q2`] === true; }
  function unlocked(state, id) { return id >= 1 && id <= 12 && Array.from({ length: id - 1 }, (_, i) => i + 1).every(n => complete(state, n)); }
  function ready(state) { return Array.from({ length: 12 }, (_, i) => i + 1).every(n => complete(state, n)); }
  function count(state) { return Array.from({ length: 12 }, (_, i) => i + 1).filter(n => complete(state, n)).length; }
  function canonical(a) {
    const text = String(a || '').trim();
    if (text.length === 2 && text[0].toUpperCase() === text[1].toUpperCase()) return text.split('').sort().join('');
    return text;
  }
  function present(question, answer) {
    if (question.kind === 'grid') return !!answer && Array.isArray(answer.top) && answer.top.length === 2 && answer.top.every(Boolean) && Array.isArray(answer.left) && answer.left.length === 2 && answer.left.every(Boolean) && Array.isArray(answer.cells) && answer.cells.length === 4 && answer.cells.every(Boolean) && Number.isInteger(answer.conclusion);
    if (question.kind === 'multi') return Array.isArray(answer) && answer.length > 0;
    return Number.isInteger(answer) && answer >= 0 && answer < question.options.length;
  }
  function evaluate(question, answer) {
    if (!present(question, answer)) return { correct: false, missing: true, errors: ['Completá tu respuesta antes de comprobar.'] };
    if (question.kind === 'grid') {
      const errors = [];
      const normalize = (arr) => arr.slice().sort().join('|');
      if (normalize(answer.top) !== normalize(question.top)) errors.push('Revisá los gametos del progenitor de arriba: cada gameto lleva un solo alelo.');
      if (normalize(answer.left) !== normalize(question.left)) errors.push('Revisá los gametos del progenitor de la izquierda: conservá los alelos de su genotipo.');
      const formed = [0, 1, 2, 3].map(i => question.combine[`${answer.top[i % 2]}|${answer.left[Math.floor(i / 2)]}`]);
      if (answer.cells.some((v, i) => !formed[i] || canonical(v) !== canonical(formed[i]))) errors.push('En cada casilla reuní el alelo de su columna y el de su fila. No copies el genotipo completo de un progenitor.');
      if (answer.conclusion !== question.correct) errors.push(question.feedback[answer.conclusion]);
      return { correct: errors.length === 0, errors, missing: false };
    }
    const correct = question.kind === 'multi' ? JSON.stringify([...answer].sort()) === JSON.stringify([...question.correct].sort()) : answer === question.correct;
    return { correct, missing: false, errors: correct ? [] : [question.kind === 'multi' ? question.error : question.feedback[answer]] };
  }
  function practice(state, lesson, question, answer, now = new Date().toISOString()) {
    if (!unlocked(state, lesson)) throw new Error('Clase bloqueada');
    const result = evaluate(question, answer);
    if (result.missing) return result;
    state.attempts.push({ id: question.id, lesson, answer: JSON.parse(JSON.stringify(answer)), correct: result.correct, at: now });
    if (result.correct) state.mastered[question.id] = true;
    return result;
  }
  function finish(state, questions, now = new Date().toISOString()) {
    if (!ready(state)) throw new Error('Completá las 12 microclases');
    if (!state.draft || questions.some(q => !present(q, state.draft.answers[q.id]))) throw new Error('Faltan respuestas');
    const results = questions.map(q => ({ id: q.id, answer: state.draft.answers[q.id], ...evaluate(q, state.draft.answers[q.id]) }));
    const correct = results.filter(r => r.correct).length;
    const exam = { id: `exam-${now}`, at: now, results, correct, grade: Math.round(correct / 13 * 100) / 10 };
    state.exams.push(exam);
    state.draft = null;
    return exam;
  }
  const api = { VERSION, KEY, fresh, hydrate, complete, unlocked, ready, count, canonical, present, evaluate, practice, finish };
  root.GeneticsEngine = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
