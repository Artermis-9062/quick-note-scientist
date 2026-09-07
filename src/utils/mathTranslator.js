// Plain-text symbol translator for math blocks.
//
// Inside `\start ... \end` regions, type a shortcut word (e.g. `alpha`) or a
// symbol token (e.g. `->`) and it is replaced with the corresponding Unicode
// symbol or LaTeX command. Outside those regions, input is returned unchanged.
//
// Co-located reference: see ./SHORTCUTS.md for the full shortcut table.

export const KEYWORDS = {
  // Greek (lowercase + uppercase where applicable)
  alpha: 'α', Alpha: 'Α',
  beta: 'β', Beta: 'Β',
  gamma: 'γ', Gamma: 'Γ',
  delta: 'δ', Delta: 'Δ',
  epsilon: 'ε', Epsilon: 'Ε',
  varepsilon: 'ε',
  zeta: 'ζ', Zeta: 'Ζ',
  eta: 'η', Eta: 'Η',
  theta: 'θ', Theta: 'Θ',
  vartheta: 'ϑ',
  iota: 'ι', Iota: 'Ι',
  kappa: 'κ', Kappa: 'Κ',
  lambda: 'λ', Lambda: 'Λ',
  mu: 'μ', Mu: 'Μ',
  nu: 'ν', Nu: 'Ν',
  xi: 'ξ', Xi: 'Ξ',
  pi: 'π', Pi: 'Π',
  varpi: 'ϖ',
  rho: 'ρ', Rho: 'Ρ',
  varrho: 'ϱ',
  sigma: 'σ', Sigma: 'Σ',
  varsigma: 'ς',
  tau: 'τ', Tau: 'Τ',
  upsilon: 'υ', Upsilon: 'Υ',
  phi: 'φ', Phi: 'Φ',
  varphi: 'ϕ',
  chi: 'χ', Chi: 'Χ',
  psi: 'ψ', Psi: 'Ψ',
  omega: 'ω', Omega: 'Ω',

  // Math operators / relations (letter forms)
  sum: 'Σ',
  prod: 'Π',
  coprod: '∐',
  int: '∫',
  iint: '∬',
  iiint: '∭',
  oint: '∮',
  sqrt: '√',
  infty: '∞',
  inf: '∞',
  partial: '∂',
  nabla: '∇',
  forall: '∀',
  exists: '∃',
  nexists: '∄',
  emptyset: '∅',
  in: '∈',
  notin: '∉',
  subset: '⊂',
  supset: '⊃',
  subseteq: '⊆',
  supseteq: '⊇',
  cup: '∪',
  cap: '∩',
  to: '→',
  rightarrow: '→',
  leftarrow: '←',
  leftrightarrow: '↔',
  Rightarrow: '⇒',
  Leftrightarrow: '⇔',
  mapsto: '↦',
  cdot: '·',
  times: '×',
  div: '÷',
  pm: '±',
  mp: '∓',
  ast: '∗',
  star: '⋆',
  circ: '∘',
  leq: '≤',
  geq: '≥',
  neq: '≠',
  approx: '≈',
  equiv: '≡',
  sim: '∼',
  cong: '≅',
  propto: '∝',
  ll: '≪',
  gg: '≫',
  deg: '°',
  prime: '′',
  ldots: '…',
  cdots: '⋯',
  vdots: '⋮',
  ddots: '⋱',
  arrow: '→',

  // Symbol-form short tokens
  '->': '→',
  '=>': '⇒',
  '<=': '≤',
  '>=': '≥',
  '!=': '≠',
  '~=': '≈',
  '+-': '±',
  '--': '−',
  '...': '…',

  // Physics
  hbar: 'ℏ',
  hplanck: 'ℎ',
  Re: 'ℜ',
  Im: 'ℑ',
  aleph: 'ℵ',
  ell: 'ℓ',
  Box: '□',
  triangle: '△',
  Diamond: '◇',
  parallel: '∥',
  perpendicular: '⊥',
  Angstrom: 'Å',

  // Chemistry
  equilibrium: '⇌',
  '<=>': '⇌',
  precipitate: '↓',
  gas: '↑',
  dH: '\\Delta H',
  dS: '\\Delta S',
  dG: '\\Delta G',

  // LaTeX fallbacks (no clean Unicode → store the command)
  frac: '\\frac',
  dfrac: '\\dfrac',
  tfrac: '\\tfrac',
  binom: '\\binom',
  overline: '\\overline',
  underline: '\\underline',
  hat: '\\hat',
  vec: '\\vec',
  bar: '\\bar',
  tilde: '\\tilde',
};

// Tokenizer: single-pass, character-class based. Keeps every character of the
// input as part of some token (no drops) and emits each token with its kind so
// the lookup below only consults KEYWORDS for word/operator tokens.
const BLOCK_RE = /(\\start[\s\S]*?\\end)/g;

function tokenize(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-zA-Z0-9]/.test(s[j])) j++;
      out.push({ text: s.slice(i, j), kind: 'word' });
      i = j;
    } else if (/\s/.test(c)) {
      let j = i;
      while (j < s.length && /\s/.test(s[j])) j++;
      out.push({ text: s.slice(i, j), kind: 'space' });
      i = j;
    } else if (/[0-9]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      out.push({ text: s.slice(i, j), kind: 'number' });
      i = j;
    } else {
      // Operator run: includes `_`, so `beta_0` tokenizes as
      // [word('beta'), op('_0'), number handled separately], but treating
      // `_0` as one op is fine — it won't match a keyword and won't be lost.
      let j = i;
      while (j < s.length && !/[a-zA-Z0-9\s]/.test(s[j])) j++;
      out.push({ text: s.slice(i, j), kind: 'op' });
      i = j;
    }
  }
  return out;
}

function translateSegment(segment) {
  const trimmed = segment.slice(6, -4); // strip leading \start and trailing \end
  const tokens = tokenize(trimmed);
  const rebuilt = tokens
    .map((t) => (KEYWORDS[t.text] !== undefined ? KEYWORDS[t.text] : t.text))
    .join('');
  return '\\start' + rebuilt + '\\end';
}

export function translateMath(input) {
  if (!input) return input;
  const parts = input.split(BLOCK_RE);
  return parts
    .map((p) => {
      if (p.startsWith('\\start') && p.endsWith('\\end')) {
        return translateSegment(p);
      }
      return p;
    })
    .join('');
}

// Reverse map for preview rendering: Unicode symbol → LaTeX command.
// Only entries whose value is a single Unicode glyph are reversed; `\command`
// fallbacks already round-trip. When two shortcuts map to the same glyph
// (e.g. `to` and `->` both → `→`), we keep the first (letter-name) reverse so
// the output is `\to`, not `\->`.
export const LATEX_KEYWORDS = (() => {
  const m = new Map();
  for (const [k, v] of Object.entries(KEYWORDS)) {
    if (v.startsWith('\\')) continue;
    if (!m.has(v)) m.set(v, '\\' + k);
  }
  return Object.fromEntries(m);
})();

// Inverse: convert stored Unicode symbols back to LaTeX inside $$ ... $$ blocks
// so KaTeX can render them. Leaves text outside math blocks untouched.
const LATEX_BLOCK_RE = /(\$\$[\s\S]*?\$\$)/g;

function reverseSegment(inner) {
  const tokens = tokenize(inner);
  return tokens
    .map((t) => (LATEX_KEYWORDS[t.text] !== undefined ? LATEX_KEYWORDS[t.text] : t.text))
    .join('');
}

export function toLatex(input) {
  if (!input) return input;
  const parts = input.split(LATEX_BLOCK_RE);
  return parts
    .map((p) => {
      if (p.startsWith('$$') && p.endsWith('$$')) {
        return '$$' + reverseSegment(p.slice(2, -2)) + '$$';
      }
      return p;
    })
    .join('');
}

// Map a caret offset in `original` to the equivalent offset in `translated`,
// where the two strings differ only by keyword replacements inside math blocks.
export function mapCaret(original, translated, caret) {
  if (caret <= 0) return 0;
  if (caret >= original.length) return translated.length;
  const origParts = original.split(BLOCK_RE);
  let origPos = 0;
  let transPos = 0;
  for (const origPart of origParts) {
    const isBlock =
      origPart.startsWith('\\start') && origPart.endsWith('\\end');
    const transPart = isBlock ? translateSegment(origPart) : origPart;
    const partEnd = origPos + origPart.length;
    if (caret < partEnd) {
      const localOffset = caret - origPos;
      if (!isBlock) return transPos + localOffset;
      const DELIM_LEN = 6; // len(\start)
      const END_LEN = 4;   // len(\end)
      const inner = origPart.slice(DELIM_LEN, -END_LEN);
      const innerLen = inner.length;
      // Caret in the trailing `\end` is preserved 1:1 (those chars don't change).
      if (localOffset >= DELIM_LEN + innerLen) {
        const endOffset = localOffset - DELIM_LEN - innerLen;
        return transPos + DELIM_LEN + (transPart.length - DELIM_LEN - END_LEN) + endOffset;
      }
      // Walk token-by-token inside the block to find the translated position.
      const tokens = tokenize(inner);
      let innerPos = 0;
      let innerTransPos = 0;
      const caretInInner = localOffset - DELIM_LEN;
      for (const tok of tokens) {
        const tokEnd = innerPos + tok.text.length;
        if (caretInInner < tokEnd) {
          const offsetInTok = caretInInner - innerPos;
          const replacement = KEYWORDS[tok.text] ?? tok.text;
          const offsetInRep = Math.min(offsetInTok, replacement.length);
          return transPos + DELIM_LEN + innerTransPos + offsetInRep;
        }
        innerPos = tokEnd;
        innerTransPos += (KEYWORDS[tok.text] ?? tok.text).length;
      }
      return transPos + transPart.length;
    }
    origPos = partEnd;
    transPos += transPart.length;
  }
  return translated.length;
}
