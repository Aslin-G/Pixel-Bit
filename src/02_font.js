/* =====================================================================
   02_font.js — Fuentes bitmap pixel (proporcional con acentos españoles)
   'main': mayúsculas de 7 px, minúsculas de 5 px, descendentes 2 px.
   'tiny': 3x5 para ejes, unidades y etiquetas densas.
   Marcado de color en línea: {y}amarillo{/} {c} {o} {r} {g} {p} {v} {b} {w} {d}
   ===================================================================== */

const FONT_SRC = {
  // 9 filas: 0-1 zona alta (ascendentes/acentos de minúsculas), 2-6 altura x, 0-6 mayúsculas, 7-8 descendentes
  'A': ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  'B': ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  'C': ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  'D': ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  'E': ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  'F': ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  'G': ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  'H': ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  'I': ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  'J': ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..'],
  'K': ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  'L': ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  'M': ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  'N': ['#...#', '##..#', '#.#.#', '#.#.#', '#..##', '#...#', '#...#'],
  'O': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  'P': ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  'Q': ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  'R': ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  'S': ['.###.', '#...#', '#....', '.###.', '....#', '#...#', '.###.'],
  'T': ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  'U': ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  'V': ['#...#', '#...#', '#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
  'W': ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  'X': ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  'Y': ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  'Z': ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  'a': ['....', '....', '.##.', '...#', '.###', '#..#', '.###'],
  'b': ['#...', '#...', '###.', '#..#', '#..#', '#..#', '###.'],
  'c': ['...', '...', '.##', '#..', '#..', '#..', '.##'],
  'd': ['...#', '...#', '.###', '#..#', '#..#', '#..#', '.###'],
  'e': ['....', '....', '.##.', '#..#', '####', '#...', '.###'],
  'f': ['.##', '#..', '###', '#..', '#..', '#..', '#..'],
  'g': ['....', '....', '.###', '#..#', '#..#', '#..#', '.###', '...#', '.##.'],
  'h': ['#...', '#...', '###.', '#..#', '#..#', '#..#', '#..#'],
  'i': ['#', '.', '#', '#', '#', '#', '#'],
  'ı': ['.', '.', '#', '#', '#', '#', '#'],
  'j': ['.#', '..', '.#', '.#', '.#', '.#', '.#', '.#', '#.'],
  'k': ['#...', '#...', '#..#', '#.#.', '##..', '#.#.', '#..#'],
  'l': ['#.', '#.', '#.', '#.', '#.', '#.', '.#'],
  'm': ['.....', '.....', '####.', '#.#.#', '#.#.#', '#.#.#', '#.#.#'],
  'n': ['....', '....', '###.', '#..#', '#..#', '#..#', '#..#'],
  'o': ['....', '....', '.##.', '#..#', '#..#', '#..#', '.##.'],
  'p': ['....', '....', '###.', '#..#', '#..#', '#..#', '###.', '#...', '#...'],
  'q': ['....', '....', '.###', '#..#', '#..#', '#..#', '.###', '...#', '...#'],
  'r': ['...', '...', '#.#', '##.', '#..', '#..', '#..'],
  's': ['....', '....', '.###', '#...', '.##.', '...#', '###.'],
  't': ['.#.', '.#.', '###', '.#.', '.#.', '.#.', '..#'],
  'u': ['....', '....', '#..#', '#..#', '#..#', '#..#', '.###'],
  'v': ['.....', '.....', '#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
  'w': ['.....', '.....', '#...#', '#...#', '#.#.#', '#.#.#', '.#.#.'],
  'x': ['....', '....', '#..#', '#..#', '.##.', '#..#', '#..#'],
  'y': ['....', '....', '#..#', '#..#', '#..#', '#..#', '.###', '...#', '.##.'],
  'z': ['....', '....', '####', '...#', '.##.', '#...', '####'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['.#.', '##.', '.#.', '.#.', '.#.', '.#.', '###'],
  '2': ['.###.', '#...#', '....#', '..##.', '.#...', '#....', '#####'],
  '3': ['.###.', '#...#', '....#', '..##.', '....#', '#...#', '.###.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  ' ': ['...'],
  '.': ['.', '.', '.', '.', '.', '.', '#'],
  ',': ['..', '..', '..', '..', '..', '..', '.#', '#.'],
  ':': ['.', '.', '.', '#', '.', '.', '#'],
  ';': ['..', '..', '..', '.#', '..', '..', '.#', '#.'],
  '!': ['#', '#', '#', '#', '#', '.', '#'],
  '¡': ['.', '.', '#', '.', '#', '#', '#', '#', '#'],
  '?': ['.###.', '#...#', '....#', '..##.', '..#..', '.....', '..#..'],
  '¿': ['.....', '.....', '..#..', '.....', '..#..', '.##..', '#....', '#...#', '.###.'],
  "'": ['#', '#'],
  '"': ['#.#', '#.#'],
  '-': ['...', '...', '...', '...', '###'],
  '–': ['....', '....', '....', '....', '####'],
  '—': ['......', '......', '......', '......', '######'],
  '…': ['.....', '.....', '.....', '.....', '.....', '.....', '#.#.#'],
  '_': ['....', '....', '....', '....', '....', '....', '....', '####'],
  '+': ['.....', '.....', '..#..', '..#..', '#####', '..#..', '..#..'],
  '=': ['....', '....', '....', '####', '....', '####'],
  '(': ['.#', '#.', '#.', '#.', '#.', '#.', '.#'],
  ')': ['#.', '.#', '.#', '.#', '.#', '.#', '#.'],
  '[': ['##', '#.', '#.', '#.', '#.', '#.', '##'],
  ']': ['##', '.#', '.#', '.#', '.#', '.#', '##'],
  '/': ['...#', '...#', '..#.', '.#..', '.#..', '#...', '#...'],
  '\\': ['#...', '#...', '.#..', '.#..', '..#.', '...#', '...#'],
  '%': ['##..#', '##..#', '...#.', '..#..', '.#...', '#..##', '#..##'],
  '°': ['.#.', '#.#', '.#.'],
  '³': ['##', '.#', '##', '.#', '##'],
  '²': ['##', '.#', '##', '#.', '##'],
  '₂': ['...', '...', '...', '...', '##.', '..#', '.#.', '###'],
  '·': ['.', '.', '.', '.', '#'],
  '•': ['...', '...', '.#.', '###', '.#.'],
  '→': ['.....', '.....', '...#.', '....#', '#####', '....#', '...#.'],
  '←': ['.....', '.....', '.#...', '#....', '#####', '#....', '.#...'],
  '↑': ['..#..', '.###.', '#.#.#', '..#..', '..#..', '..#..', '..#..'],
  '↓': ['..#..', '..#..', '..#..', '..#..', '#.#.#', '.###.', '..#..'],
  '≈': ['.....', '.....', '.#...', '#.#.#', '...#.', '.#...', '#.#.#', '...#.'],
  '~': ['.....', '.....', '.....', '.#...', '#.#.#', '...#.'],
  '≤': ['....', '...#', '.##.', '#...', '.##.', '...#', '####'],
  '≥': ['....', '#...', '.##.', '...#', '.##.', '#...', '####'],
  '<': ['...', '...', '..#', '.#.', '#..', '.#.', '..#'],
  '>': ['...', '...', '#..', '.#.', '..#', '.#.', '#..'],
  '±': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '#####'],
  '×': ['.....', '.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  '*': ['.....', '#.#.#', '.###.', '#.#.#'],
  '#': ['.....', '.#.#.', '#####', '.#.#.', '#####', '.#.#.'],
  '&': ['.##..', '#..#.', '#.#..', '.#...', '#.#.#', '#..#.', '.##.#'],
  '|': ['#', '#', '#', '#', '#', '#', '#', '#'],
  '$': ['..#..', '.####', '#.#..', '.###.', '..#.#', '####.', '..#..'],
  '€': ['..###', '.#...', '####.', '.#...', '####.', '.#...', '..###'],
  'Δ': ['..#..', '..#..', '.#.#.', '.#.#.', '#...#', '#...#', '#####'],
  'η': ['....', '....', '###.', '#..#', '#..#', '#..#', '#..#', '...#', '...#'],
  'π': ['.....', '.....', '#####', '.#.#.', '.#.#.', '.#.#.', '.#..#'],
  'µ': ['....', '....', '#..#', '#..#', '#..#', '#..#', '###.', '#...', '#...'],
  '«': ['.....', '.....', '..#.#', '.#.#.', '#.#..', '.#.#.', '..#.#'],
  '»': ['.....', '.....', '#.#..', '.#.#.', '..#.#', '.#.#.', '#.#..'],
  '@': ['.###.', '#...#', '#.###', '#.#.#', '#.###', '#....', '.###.'],
  '✓': ['.....', '.....', '....#', '...#.', '#.#..', '.#...', '.....'],
  '♥': ['.....', '.#.#.', '#####', '#####', '.###.', '..#..'],
  '★': ['..#..', '..#..', '#####', '.###.', '.#.#.', '#...#'],
  '♪': ['..##', '..#.', '..#.', '..#.', '###.', '###.'],
  // notación científica (QA: antes caían en «?»)
  '−': ['.....', '.....', '.....', '.....', '#####'],
  '↔': ['.......', '.......', '.#...#.', '#.....#', '#######', '#.....#', '.#...#.'],
  'Σ': ['#####', '#....', '.#...', '..#..', '.#...', '#....', '#####'],
  '≠': ['....', '....', '...#', '####', '.##.', '####', '#...'],
  'º': ['.#.', '#.#', '.#.', '...', '###'],
  '✕': ['.....', '.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  '✗': ['.....', '.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  '§': ['.###', '#...', '.##.', '#..#', '.##.', '...#', '###.'],
  '√': ['...##', '...#.', '...#.', '#..#.', '.#.#.', '.#.#.', '..#..'],
  '½': ['#....#', '#...#.', '#..#..', '..#.##', '.#...#', '#...#.', '...###'],
  'ρ': ['....', '....', '.##.', '#..#', '#..#', '#..#', '###.', '#...', '#...'],
  '₃': ['...', '...', '...', '...', '##.', '.##', '..#', '##.'],
  '₄': ['...', '...', '...', '...', '#.#', '###', '..#', '..#'],
  'λ': ['#..', '.#.', '.#.', '.#.', '#.#', '#.#', '#.#'],
  'Ω': ['.###.', '#...#', '#...#', '#...#', '.#.#.', '.#.#.', '##.##'],
};
/** Sustitutos tipográficos cuando una fuente no tiene el glifo (antes de recurrir a «?») */
const GLYPH_FALLBACK = { '“': '"', '”': '"', '‘': "'", '’': "'", '−': '-', '–': '-', '—': '-', '•': '·', '✕': '×', '✗': '×', 'Η': 'H', 'Ρ': 'P', '´': "'", 'º': '°' };

// marcas diacríticas (mínimas, se centran sobre el glifo base)
const ACC_MARK = { '´': ['.#', '#.'], '¨': ['#.#', '...'], '˜': ['.#.#', '#.#.'] };
const ACCENTED = {
  'á': ['a', '´'], 'é': ['e', '´'], 'í': ['ı', '´'], 'ó': ['o', '´'], 'ú': ['u', '´'], 'ñ': ['n', '˜'], 'ü': ['u', '¨'],
  'Á': ['A', '´'], 'É': ['E', '´'], 'Í': ['I', '´'], 'Ó': ['O', '´'], 'Ú': ['U', '´'], 'Ñ': ['N', '˜'], 'Ü': ['U', '¨'],
};

const TINY_SRC = {
  'A': ['.#.', '#.#', '###', '#.#', '#.#'], 'B': ['##.', '#.#', '##.', '#.#', '##.'], 'C': ['.##', '#..', '#..', '#..', '.##'],
  'D': ['##.', '#.#', '#.#', '#.#', '##.'], 'E': ['###', '#..', '##.', '#..', '###'], 'F': ['###', '#..', '##.', '#..', '#..'],
  'G': ['.##', '#..', '#.#', '#.#', '.##'], 'H': ['#.#', '#.#', '###', '#.#', '#.#'], 'I': ['###', '.#.', '.#.', '.#.', '###'],
  'J': ['..#', '..#', '..#', '#.#', '.#.'], 'K': ['#.#', '#.#', '##.', '#.#', '#.#'], 'L': ['#..', '#..', '#..', '#..', '###'],
  'M': ['#...#', '##.##', '#.#.#', '#...#', '#...#'], 'N': ['#..#', '##.#', '#.##', '#..#', '#..#'], 'O': ['.#.', '#.#', '#.#', '#.#', '.#.'],
  'P': ['##.', '#.#', '##.', '#..', '#..'], 'Q': ['.#.', '#.#', '#.#', '##.', '.##'], 'R': ['##.', '#.#', '##.', '#.#', '#.#'],
  'S': ['.##', '#..', '.#.', '..#', '##.'], 'T': ['###', '.#.', '.#.', '.#.', '.#.'], 'U': ['#.#', '#.#', '#.#', '#.#', '###'],
  'V': ['#.#', '#.#', '#.#', '.#.', '.#.'], 'W': ['#...#', '#...#', '#.#.#', '##.##', '#...#'], 'X': ['#.#', '#.#', '.#.', '#.#', '#.#'],
  'Y': ['#.#', '#.#', '.#.', '.#.', '.#.'], 'Z': ['###', '..#', '.#.', '#..', '###'],
  '0': ['###', '#.#', '#.#', '#.#', '###'], '1': ['.#.', '##.', '.#.', '.#.', '###'], '2': ['##.', '..#', '.#.', '#..', '###'],
  '3': ['##.', '..#', '.#.', '..#', '##.'], '4': ['#.#', '#.#', '###', '..#', '..#'], '5': ['###', '#..', '##.', '..#', '##.'],
  '6': ['.##', '#..', '###', '#.#', '###'], '7': ['###', '..#', '.#.', '.#.', '.#.'], '8': ['###', '#.#', '###', '#.#', '###'],
  '9': ['###', '#.#', '###', '..#', '##.'],
  ' ': ['..'], '.': ['.', '.', '.', '.', '#'], ',': ['.', '.', '.', '.', '#', '#'], ':': ['.', '#', '.', '#', '.'],
  '%': ['#.#', '..#', '.#.', '#..', '#.#'], '/': ['..#', '..#', '.#.', '#..', '#..'], '-': ['...', '...', '###', '...', '...'],
  '+': ['...', '.#.', '###', '.#.', '...'], '(': ['.#', '#.', '#.', '#.', '.#'], ')': ['#.', '.#', '.#', '.#', '#.'],
  '³': ['###', '.##', '###'], '²': ['##.', '.#.', '.##'], '°': ['###', '#.#', '###'], '=': ['...', '###', '...', '###', '...'],
  '>': ['#..', '.#.', '..#', '.#.', '#..'], '<': ['..#', '.#.', '#..', '.#.', '..#'], '·': ['.', '.', '#', '.', '.'],
  '→': ['....', '..#.', '####', '..#.', '....'], '←': ['....', '.#..', '####', '.#..', '....'], '↑': ['.#.', '###', '.#.', '.#.', '.#.'],
  '↓': ['.#.', '.#.', '.#.', '###', '.#.'], '!': ['#', '#', '#', '.', '#'], '?': ['##.', '..#', '.#.', '...', '.#.'],
  '_': ['...', '...', '...', '...', '###'], '₂': ['...', '...', '##.', '.#.', '.##'], 'Δ': ['.#.', '.#.', '#.#', '#.#', '###'],
  'η': ['##.', '#.#', '#.#', '#.#', '..#'], '|': ['#', '#', '#', '#', '#'], '$': ['.##', '##.', '.#.', '.##', '##.'],
  '≈': ['....', '.#.#', '#.#.', '.#.#', '#.#.'], 'π': ['####', '.#.#', '.#.#', '.#.#', '.#.#'], '≤': ['..##', '##..', '..##', '....', '####'], '≥': ['##..', '..##', '##..', '....', '####'], 'µ': ['#.#', '#.#', '#.#', '##.', '#..'], '—': ['....', '....', '####', '....', '....'], 'Ω': ['.#.', '#.#', '#.#', '.#.', '#.#'], '~': ['...', '.#.', '#.#', '...', '...'], '*': ['#.#', '.#.', '#.#', '...', '...'], '#': ['#.#', '###', '#.#', '###', '#.#'], '…': ['.....', '.....', '.....', '.....', '#.#.#'],
  ';': ['.', '#', '.', '#', '#'], "'": ['#', '#', '.', '.', '.'], '&': ['.#.', '#.#', '.#.', '#.#', '.##'], '"': ['#.#', '#.#', '...', '...', '...'],
  // notación científica y viñetas (QA: antes caían en «?»)
  '×': ['...', '#.#', '.#.', '#.#', '...'], '−': ['...', '...', '###', '...', '...'], '–': ['...', '...', '###', '...', '...'],
  '±': ['.#.', '###', '.#.', '...', '###'], '«': ['....', '.#.#', '#.#.', '.#.#', '....'], '»': ['....', '#.#.', '.#.#', '#.#.', '....'],
  '↔': ['......', '.#..#.', '######', '.#..#.', '......'], 'Σ': ['###', '#..', '.#.', '#..', '###'], '≠': ['..#', '###', '.#.', '###', '#..'],
  '•': ['..', '##', '##', '..', '..'], '✓': ['....', '...#', '#.#.', '.#..', '....'], '★': ['..#..', '#####', '.###.', '.#.#.', '.....'],
  '√': ['..##', '..#.', '#.#.', '.##.', '.#..'], 'ρ': ['.#.', '#.#', '##.', '#..', '#..'], '§': ['.##', '#..', '###', '..#', '##.'],
  '½': ['#..#.', '#.#..', '..###', '.#..#', '#..##'], '₃': ['...', '...', '##.', '.##', '##.'], '₄': ['...', '...', '#.#', '###', '..#'],
  '€': ['.##', '#..', '##.', '#..', '.##'], '♥': ['#.#', '###', '###', '.#.', '...'], 'λ': ['#..', '.#.', '.#.', '#.#', '#.#'],
};
const TINY_MAP = { 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'Ñ': 'N', 'Ü': 'U', 'á': 'A', 'é': 'E', 'í': 'I', 'ó': 'O', 'ú': 'U', 'ñ': 'N', 'ü': 'U', '¿': '?', '¡': '!' };

// {y}/{o} = tonos de palabra clave de la referencia (STYLE LOCK §11): amarillo suave y melocotón
const TEXT_COLORS = {
  y: '#f5dc5a', c: '#56e5ff', o: '#f5a576', r: '#ff4e5d', g: '#86e36f', p: '#f78acb', v: '#b49cff', b: '#6cb4ff', w: '#fffaf0', d: '#8a8fb8', k: '#140d26', t: '#20d6c7',
};

class BitmapFont {
  constructor(src, opts) {
    this.cellH = opts.cellH; this.top = opts.top; this.lineH = opts.lineH; this.spacing = opts.spacing ?? 1;
    this.glyphs = new Map(); // ch → {x,w,rows,up}
    this.map = opts.map || {};
    this.upper = !!opts.upper;
    const entries = [];
    for (const ch in src) entries.push([ch, src[ch], false]);
    if (opts.accented) for (const ch in opts.accented) {
      const [rows, up] = this._compose(src, opts.accented[ch]);
      entries.push([ch, rows, up]);
    }
    // negrita: dilatación horizontal de cada fila (trazos verticales de 2 px, ancho +1)
    if (opts.bold) for (const e of entries) e[1] = BitmapFont.dilate(e[1]);
    this.bold = !!opts.bold;
    let ax = 0;
    for (const [ch, rows, up] of entries) { const w = Math.max(...rows.map(r => r.length)); this.glyphs.set(ch, { x: ax, w, rows, up }); ax += w + 1; }
    this.atlas = makeCanvas(Math.max(1, ax), this.cellH);
    this.atlas.g.fillStyle = '#ffffff';
    for (const [, gl] of this.glyphs) {
      const off = gl.up ? 0 : this.top;
      gl.rows.forEach((row, ry) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') this.atlas.g.fillRect(gl.x + i, ry + off, 1, 1); });
    }
    this.tints = new Map();
  }
  static dilate(rows) {
    const w = Math.max(...rows.map(r => r.length));
    return rows.map(r => { const a = (r.padEnd(w, '.') + '.').split(''); for (let i = w - 1; i >= 0; i--) if (r[i] === '#') a[i + 1] = '#'; return a.join(''); });
  }
  /** Compone glifo acentuado; retorna [filas, esMayúsculaConFilasExtra] */
  _compose(src, [base, accKey]) {
    const b = src[base];
    const acc = ACC_MARK[accKey];
    const aw = acc[0].length;
    let w = b[0].length;
    const isUpper = base !== 'ı' && base === base.toUpperCase();
    let rows = b.map(r => r);
    if (w < aw) { // ensancha glifos estrechos (í)
      const pad = aw - w; rows = rows.map(r => r + '.'.repeat(pad)); w = aw;
    }
    const off = Math.max(0, Math.floor((w - aw) / 2) + (accKey === '´' && w > aw ? 1 : 0));
    const accRows = acc.map(r => { const row = '.'.repeat(w).split(''); for (let k = 0; k < r.length; k++) if (r[k] === '#' && off + k < w) row[off + k] = '#'; return row.join(''); });
    if (isUpper) return [accRows.concat(rows), true];
    const out = rows.slice();
    for (let i = 0; i < 2; i++) {
      const row = (out[i] || '.'.repeat(w)).split('');
      for (let k = 0; k < w; k++) if (accRows[i][k] === '#') row[k] = '#';
      out[i] = row.join('');
    }
    return [out, false];
  }
  glyph(ch) {
    // 1) mapa explícito · 2) el propio carácter si existe (η, µ, ×…: no pasar a la mayúscula griega) · 3) mayúscula
    let k = this.map[ch];
    if (k === undefined) k = (!this.upper || this.glyphs.has(ch)) ? ch : ch.toUpperCase();
    let gl = this.glyphs.get(k);
    if (!gl) { const f = GLYPH_FALLBACK[ch] || GLYPH_FALLBACK[k]; if (f) gl = this.glyphs.get(f) || (this.upper ? this.glyphs.get(f.toUpperCase()) : null); }
    return gl || this.glyphs.get('?');
  }
  tint(col) {
    let c = this.tints.get(col);
    if (!c) {
      c = makeCanvas(this.atlas.width, this.atlas.height);
      c.g.drawImage(this.atlas, 0, 0);
      c.g.globalCompositeOperation = 'source-in';
      c.g.fillStyle = col; c.g.fillRect(0, 0, c.width, c.height);
      this.tints.set(col, c);
    }
    return c;
  }
  charW(ch) { if (ch === '\n') return 0; const g = this.glyph(ch); return g.w + this.spacing; }
  measure(text) {
    let w = 0, best = 0;
    const s = stripMarkup(text);
    for (const ch of s) { if (ch === '\n') { best = Math.max(best, w); w = 0; continue; } w += this.charW(ch); }
    return Math.max(best, w) - this.spacing;
  }
}

/** Elimina marcado {x} de color */
function stripMarkup(t) { return String(t).replace(/\{[a-z\/]\}/g, ''); }

// La fuente principal usa 11 filas: 2 para acentos de mayúscula + 9 de glifo.
const FONTS = {};
function initFonts() {
  FONTS.main = new BitmapFont(FONT_SRC, { cellH: 11, top: 2, lineH: 11, accented: ACCENTED });
  // negrita (nombres, títulos, letras de opción y «Nv.»): mismas métricas que main, trazo de 2 px
  FONTS.bold = new BitmapFont(FONT_SRC, { cellH: 11, top: 2, lineH: 11, accented: ACCENTED, bold: true });
  // la fuente diminuta reserva una fila superior para tildes (desplazada al dibujar)
  const tinyAcc = {};
  for (const [ch, base, mark] of [['Á', 'A', '.#'], ['É', 'E', '.#'], ['Í', 'I', '.#'], ['Ó', 'O', '.#'], ['Ú', 'U', '.#'], ['Ñ', 'N', '.##.'], ['Ü', 'U', '#.#']]) {
    const b = TINY_SRC[base], w = b[0].length;
    const m = mark.length >= w ? mark.slice(0, w) : ('.'.repeat(Math.floor((w - mark.length) / 2) + (mark === '.#' && w >= 3 ? 1 : 0)) + mark).padEnd(w, '.').slice(0, w);
    tinyAcc[ch] = [m].concat(b);
  }
  const tinySrc = {};
  for (const k in TINY_SRC) tinySrc[k] = ['.'.repeat(TINY_SRC[k][0].length)].concat(TINY_SRC[k]);
  Object.assign(tinySrc, tinyAcc);
  const tinyMap = Object.assign({}, TINY_MAP);
  for (const k of ['Á', 'É', 'Í', 'Ó', 'Ú', 'Ñ', 'Ü']) delete tinyMap[k];
  tinyMap['µ'] = 'µ'; tinyMap['π'] = 'π'; tinyMap['Ω'] = 'Ω';
  for (const [lo, up] of [['á', 'Á'], ['é', 'É'], ['í', 'Í'], ['ó', 'Ó'], ['ú', 'Ú'], ['ñ', 'Ñ'], ['ü', 'Ü']]) tinyMap[lo] = up;
  FONTS.tiny = new BitmapFont(tinySrc, { cellH: 7, top: 0, lineH: 7, upper: true, map: tinyMap });
  FONTS.tiny.shift = 1;
}

/** Separa texto con marcado en segmentos {text,color} */
function parseRich(text, baseColor) {
  const out = [];
  let col = baseColor;
  const re = /\{([a-z\/])\}/g;
  let last = 0, m;
  const s = String(text);
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ t: s.slice(last, m.index), c: col });
    col = m[1] === '/' ? baseColor : (TEXT_COLORS[m[1]] || baseColor);
    last = re.lastIndex;
  }
  if (last < s.length) out.push({ t: s.slice(last), c: col });
  return out;
}

/** Envuelve texto con marcado a un ancho máximo → arreglo de líneas (conservan marcado) */
function wrapText(text, maxW, font = 'main') {
  const f = FONTS[font];
  const paragraphs = String(text).split('\n');
  const lines = [];
  for (const para of paragraphs) {
    const words = para.split(' ');
    let line = '', lineW = 0;
    let carry = ''; // código de color activo para continuar en la siguiente línea
    for (let wi = 0; wi < words.length; wi++) {
      const word = words[wi];
      // medir la línea completa evita subestimar el espaciado entre palabras
      if (line && f.measure(line + ' ' + word) > maxW) {
        lines.push(line);
        line = carry + word; lineW = f.measure(line);
      } else { line += (line ? ' ' : '') + word; lineW = f.measure(line); }
      const codes = word.match(/\{[a-z\/]\}/g);
      if (codes) { const lastc = codes[codes.length - 1]; carry = lastc === '{/}' ? '' : lastc; }
    }
    lines.push(line);
  }
  return lines;
}

/**
 * Dibuja texto pixel. opts: color, shadow, outline, align('left'|'center'|'right'), font, scale, max (nº de caracteres visibles)
 * Retorna ancho dibujado.
 */
function drawText(g, text, x, y, opts = {}) {
  const font = FONTS[opts.font || 'main'];
  const color = opts.color || '#fffaf0';
  const scale = opts.scale || 1;
  const segs = parseRich(text, color);
  const totalW = font.measure(text) * scale;
  let cx = Math.round(x);
  if (opts.align === 'center') cx = Math.round(x - totalW / 2);
  else if (opts.align === 'right') cx = Math.round(x - totalW);
  y = Math.round(y) - (font.top || 0) * scale;
  let shown = 0; const max = opts.max ?? Infinity;
  const startX = cx;
  const passes = [];
  if (opts.outline) passes.push({ col: opts.outline, offs: [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]] });
  if (opts.shadow) passes.push({ col: opts.shadow, offs: [[0, 1], [1, 1]] });
  passes.push({ col: null, offs: [[0, 0]] });
  for (const pass of passes) {
    cx = startX; shown = 0;
    for (const seg of segs) {
      const atlas = font.tint(pass.col || seg.c);
      for (const ch of seg.t) {
        if (shown >= max) break;
        shown++;
        if (ch === '\n') continue;
        const gl = font.glyph(ch);
        if (ch !== ' ') for (const [ox, oy] of pass.offs) g.drawImage(atlas, gl.x, 0, gl.w, font.cellH, cx + ox * scale, y + (oy - (font.shift || 0)) * scale, gl.w * scale, font.cellH * scale);
        cx += (gl.w + font.spacing) * scale;
      }
    }
  }
  return totalW;
}

/** Bloque de texto con ajuste de línea; retorna altura usada */
function drawTextBlock(g, text, x, y, maxW, opts = {}) {
  const fontName = opts.font || 'main';
  const f = FONTS[fontName];
  const lh = (opts.lineH || f.lineH) * (opts.scale || 1);
  const lines = wrapText(text, maxW / (opts.scale || 1), fontName);
  let remaining = opts.max ?? Infinity;
  lines.forEach((ln, i) => {
    if (remaining <= 0) return;
    const len = stripMarkup(ln).length;
    drawText(g, ln, opts.align === 'center' ? x + maxW / 2 : x, y + i * lh, Object.assign({}, opts, { max: remaining }));
    remaining -= len + 1;
  });
  return lines.length * lh;
}
function textHeight(text, maxW, opts = {}) {
  const fontName = opts.font || 'main';
  const f = FONTS[fontName];
  return wrapText(text, maxW / (opts.scale || 1), fontName).length * (opts.lineH || f.lineH) * (opts.scale || 1);
}

/** Texto de título: escalado, relleno en degradado por filas, contorno y sombra profunda */
function drawTitleText(g, text, x, y, scale, ramp, opts = {}) {
  const fname = opts.font || 'main';
  const font = FONTS[fname];
  const w = font.measure(text);
  const c = makeCanvas(w + 4, font.cellH + 4);
  drawText(c.g, text, 2, 2 + 2, { color: '#ffffff', font: fname });
  // recolorea por filas con rampa
  const id = c.g.getImageData(0, 0, c.width, c.height);
  const d = new Uint32Array(id.data.buffer);
  for (let yy = 0; yy < c.height; yy++) for (let xx = 0; xx < c.width; xx++) {
    const i = yy * c.width + xx;
    if (d[i] >>> 24) {
      const t = clamp((yy - 2) / (font.cellH - 2), 0, 1);
      d[i] = U(ramp[clamp(Math.floor(t * ramp.length), 0, ramp.length - 1)]);
    }
  }
  const pb = new PixelBuffer(c.width, c.height); pb.data.set(d);
  if (opts.inner) pb.outline(opts.inner);
  const cc = pb.toCanvas();
  const dx = Math.round(opts.align === 'center' ? x - (c.width * scale) / 2 : x), dy = Math.round(y);
  if (opts.shadow) {
    const sc = makeCanvas(c.width, c.height); sc.g.drawImage(cc, 0, 0); sc.g.globalCompositeOperation = 'source-in'; sc.g.fillStyle = opts.shadow; sc.g.fillRect(0, 0, sc.width, sc.height);
    for (let k = 1; k <= (opts.depth || 2); k++) g.drawImage(sc, dx + k * Math.max(1, scale / 2), dy + k * Math.max(1, scale / 2), c.width * scale, c.height * scale);
  }
  if (opts.outline) {
    const oc = makeCanvas(c.width, c.height); oc.g.drawImage(cc, 0, 0); oc.g.globalCompositeOperation = 'source-in'; oc.g.fillStyle = opts.outline; oc.g.fillRect(0, 0, oc.width, oc.height);
    for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.drawImage(oc, dx + ox * scale / 2, dy + oy * scale / 2, c.width * scale, c.height * scale);
  }
  g.drawImage(cc, dx, dy, c.width * scale, c.height * scale);
  return c.width * scale;
}
