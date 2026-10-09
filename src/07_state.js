/* =====================================================================
   07_state.js — Estado de la partida, banderas narrativas, herramientas,
   decisiones y guardado (clave localStorage: aridiaNexusSave).
   ===================================================================== */

const TOOLS = {
  lente: { name: 'Lente Nexo', icon: 'lens', desc: 'Muestra flujos, unidades y límites del sistema (tecla N).', level: 0 },
  barrido: { name: 'Barrido Sensorial', icon: 'sensor', desc: 'Toma muestras y revela la incertidumbre de medición (tecla Q).', level: 1 },
  tejedor: { name: 'Tejedor de Presión', icon: 'membrane', desc: 'Ajusta trenes de ósmosis inversa dentro de límites seguros.', level: 2 },
  brujula: { name: 'Brújula de Salmuera', icon: 'drop_brine', desc: 'Visualiza la pluma de salinidad y el balance de masa.', level: 3 },
  rele: { name: 'Relé Solar', icon: 'sun', desc: 'Asigna cargas flexibles a ventanas de generación.', level: 4 },
  vela: { name: 'Vela de Brisa', icon: 'wind', desc: 'Planea con el viento (mantén SALTAR en el aire) y lee su dirección.', level: 5 },
  reserva: { name: 'Cambio de Reserva', icon: 'battery', desc: 'Gestiona la batería y protege las cargas críticas.', level: 6 },
  sincro: { name: 'Sincronizador H2', icon: 'h2', desc: 'Programa la electrólisis con excedentes y restricciones de seguridad.', level: 7 },
  raices: { name: 'Mapa de Raíces', icon: 'leaf', desc: 'Relaciona agua, suelo, cultivo y biodiversidad.', level: 8 },
  tablero: { name: 'Tablero Mosaico', icon: 'mosaic', desc: 'Compara escenarios multiobjetivo sin ocultar supuestos.', level: 9 },
  mosaicoVivo: { name: 'Control Mosaico Vivo', icon: 'mosaic', desc: 'Integra todos los modelos con incertidumbre visible.', level: 10 },
};

const STORY_FLAGS = ['sawLimen', 'protectedIntake', 'foundUnsafePermeateLog', 'discoveredLimenPurpose', 'recognizedDispatchCode', 'foundOutlierDeletion', 'learnedElianaIsolation', 'kiruDataUnlocked', 'kiruBackupBuilt', 'communityDataRestored', 'rejectedSingleIndex', 'survivedCalima', 'transformedMirage'];

function newState() {
  return {
    version: SAVE_VERSION, timestamp: 0,
    scene: 'map', checkpoint: null, level: 0,
    player: { name: 'Amaya' },
    tools: [], activeTool: null,
    unlocked: [0], completed: [], badges: [],
    levelProgress: {}, // id → {tech, explain, variant, feedback, codex, mastery, solo, guardian, side:{}}
    mastery: null, // lo inicializa LearningModel
    questionHistory: [], challengeHistory: [],
    quests: {}, codex: [], clues: [],
    storyFlags: {}, decisions: {}, trust: { naira: 50, dante: 50, eliana: 40, limen: 20, community: 50 },
    kiruNodes: 0, echoes: [], sensors: 0, limenTalks: 0,
    simulationState: {},
    stats: { playTime: 0, hints: 0, retries: 0 },
    ending: null,
    lastRank: 1, // rango «Nv.» mostrado en el HUD (se notifica al subir)
  };
}

const GS = {
  s: newState(),
  reset() { this.s = newState(); LearningModel.init(this.s); },
  flag(name, v) { if (v === undefined) return !!this.s.storyFlags[name]; this.s.storyFlags[name] = v; return v; },
  hasTool(id) { return this.s.tools.includes(id); },
  giveTool(id, silent) {
    if (this.hasTool(id)) return;
    this.s.tools.push(id); this.s.activeTool = id;
    if (!silent) { Audio2.sfx('unlock'); Game.toast('Herramienta: {y}' + TOOLS[id].name + '{/}', TOOLS[id].icon, '#ffe14d', 4); }
  },
  /** Experiencia derivada del aprendizaje real: Σ dominio (0–2000) + 20·capítulos + 2·fichas del Atlas */
  xp() {
    const s = this.s; let m = 0;
    if (s.mastery) for (const k in s.mastery) m += s.mastery[k] || 0;
    return m + 20 * (s.completed || []).length + 2 * (s.codex || []).length;
  },
  /** Rango «Nv.» 1–15 (cada 150 de experiencia) */
  rank() { return Math.min(15, 1 + Math.floor(this.xp() / 150)); },
  rankFrac() { return this.rank() >= 15 ? 1 : (this.xp() % 150) / 150; },
  /** Notifica una subida de rango (sin fanfarrias exageradas) */
  checkRank() {
    const r = this.rank();
    if (!this.s.lastRank) this.s.lastRank = r;
    if (r > this.s.lastRank) {
      this.s.lastRank = r; this.rankUpT = (typeof Game !== 'undefined') ? Game.time : 0;
      if (typeof Game !== 'undefined' && Game.toast) Game.toast('{y}Nv. ' + r + '{/} · dominio en aumento', 'star', '#ffd23a', 2.6);
      if (typeof Audio2 !== 'undefined') Audio2.sfx('unlock', { vol: 0.5 });
      return true;
    }
    if (r < this.s.lastRank) this.s.lastRank = r;
    return false;
  },
  lp(id) { if (!this.s.levelProgress[id]) this.s.levelProgress[id] = { tech: false, explain: false, variant: false, feedback: false, codex: false, mastery: false, solo: false, guardian: false, side: {}, attempts: 0, hints: 0, time: 0 }; return this.s.levelProgress[id]; },
  addClue(id) { if (!this.s.clues.includes(id)) { this.s.clues.push(id); Game.toast('Pista registrada en el Tablero de Evidencias', 'eye', '#b49cff'); Audio2.sfx('mystery', { vol: 0.5 }); } },
  decide(key, value) { this.s.decisions[key] = value; },
  trust(who, d) { this.s.trust[who] = clamp((this.s.trust[who] || 50) + d, 0, 100); },
  save(checkpoint) {
    if (checkpoint) this.s.checkpoint = checkpoint;
    this.s.settings = Game.settings;
    const ok = SaveManager.save(this.s);
    if (ok) Game.toast('Progreso guardado', 'save', '#86e36f', 1.8);
    return ok;
  },
  load() {
    const d = SaveManager.load();
    if (!d) return false;
    this.s = Object.assign(newState(), d);
    LearningModel.init(this.s);
    if (d.lastRank == null) this.s.lastRank = this.rank(); // partidas antiguas: sin aviso de rango espurio
    return true;
  },
};
