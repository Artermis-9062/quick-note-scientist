# Symbol Shortcuts

Canonical reference for the plain-text symbol translator in `mathTranslator.js`.
This file is the human-readable source of truth — every row here must also exist
as a key/value pair in the `KEYWORDS` map. When adding, removing, or renaming a
shortcut, update both files together.

## Scope

Shortcuts are translated **only inside `\start … \end` math blocks** (rendered
as `$$ … $$` on preview). Outside those blocks, text passes through untouched,
so prose like "the alpha particle" is safe to write.

## Matching rule

Each shortcut is matched as a **whole token**:

- Letter shortcuts (`alpha`, `hbar`) match only when surrounded by non-word
  characters or string boundaries — so `alphabet` is left alone.
- Symbol shortcuts (`->`, `=>`, `!=`) match only as a complete token of one or
  more non-letter, non-whitespace characters.

This means a token like `alpha-1` will translate the `alpha` part but leave
`-1` alone, while `alpha_0` translates the whole `alpha_0` token (the `_suffix`
is preserved by the tokenizer).

## Adding a new shortcut

1. Add the entry to `KEYWORDS` in `src/utils/mathTranslator.js`. Prefer a
   clean Unicode symbol; use a `\command` fallback only when no good Unicode
   exists.
2. Add the matching row to the table below in the correct category.
3. If the shortcut is a symbol-form token (e.g. `<=>`), escape it as needed
   in the source file so the regex tokenizer still treats it as one token.

---

## Greek letters

| Category | Shortcut | Renders as | Notes |
|---|---|---|---|
| Greek | `alpha` | α | lowercase α |
| Greek | `Alpha` | Α | uppercase Α |
| Greek | `beta` | β | |
| Greek | `Beta` | Β | |
| Greek | `gamma` | γ | |
| Greek | `Gamma` | Γ | |
| Greek | `delta` | δ | |
| Greek | `Delta` | Δ | |
| Greek | `epsilon` | ε | |
| Greek | `Epsilon` | Ε | |
| Greek | `varepsilon` | ε | variant (lunate) epsilon |
| Greek | `zeta` | ζ | |
| Greek | `Zeta` | Ζ | |
| Greek | `eta` | η | |
| Greek | `Eta` | Η | |
| Greek | `theta` | θ | |
| Greek | `Theta` | Θ | |
| Greek | `vartheta` | ϑ | variant theta |
| Greek | `iota` | ι | |
| Greek | `Iota` | Ι | |
| Greek | `kappa` | κ | |
| Greek | `Kappa` | Κ | |
| Greek | `lambda` | λ | |
| Greek | `Lambda` | Λ | |
| Greek | `mu` | μ | |
| Greek | `Mu` | Μ | |
| Greek | `nu` | ν | |
| Greek | `Nu` | Ν | |
| Greek | `xi` | ξ | |
| Greek | `Xi` | Ξ | |
| Greek | `pi` | π | |
| Greek | `Pi` | Π | |
| Greek | `varpi` | ϖ | variant pi |
| Greek | `rho` | ρ | |
| Greek | `Rho` | Ρ | |
| Greek | `varrho` | ϱ | variant rho |
| Greek | `sigma` | σ | |
| Greek | `Sigma` | Σ | |
| Greek | `varsigma` | ς | final sigma |
| Greek | `tau` | τ | |
| Greek | `Tau` | Τ | |
| Greek | `upsilon` | υ | |
| Greek | `Upsilon` | Υ | |
| Greek | `phi` | φ | |
| Greek | `Phi` | Φ | |
| Greek | `varphi` | ϕ | variant phi |
| Greek | `chi` | χ | |
| Greek | `Chi` | Χ | |
| Greek | `psi` | ψ | |
| Greek | `Psi` | Ψ | |
| Greek | `omega` | ω | |
| Greek | `Omega` | Ω | |

## Math operators and relations (letter forms)

| Category | Shortcut | Renders as | Notes |
|---|---|---|---|
| Math | `sum` | Σ | |
| Math | `prod` | Π | |
| Math | `coprod` | ∐ | |
| Math | `int` | ∫ | |
| Math | `iint` | ∬ | double integral |
| Math | `iiint` | ∭ | triple integral |
| Math | `oint` | ∮ | contour integral |
| Math | `sqrt` | √ | |
| Math | `infty` | ∞ | |
| Math | `inf` | ∞ | alias for `infty` |
| Math | `partial` | ∂ | |
| Math | `nabla` | ∇ | |
| Math | `forall` | ∀ | |
| Math | `exists` | ∃ | |
| Math | `nexists` | ∄ | |
| Math | `emptyset` | ∅ | |
| Math | `in` | ∈ | |
| Math | `notin` | ∉ | |
| Math | `subset` | ⊂ | |
| Math | `supset` | ⊃ | |
| Math | `subseteq` | ⊆ | |
| Math | `supseteq` | ⊇ | |
| Math | `cup` | ∪ | |
| Math | `cap` | ∩ | |
| Math | `to` | → | |
| Math | `rightarrow` | → | alias for `to` |
| Math | `leftarrow` | ← | |
| Math | `leftrightarrow` | ↔ | |
| Math | `Rightarrow` | ⇒ | |
| Math | `Leftrightarrow` | ⇔ | |
| Math | `mapsto` | ↦ | |
| Math | `cdot` | · | |
| Math | `times` | × | |
| Math | `div` | ÷ | |
| Math | `pm` | ± | |
| Math | `mp` | ∓ | |
| Math | `ast` | ∗ | |
| Math | `star` | ⋆ | |
| Math | `circ` | ∘ | |
| Math | `leq` | ≤ | |
| Math | `geq` | ≥ | |
| Math | `neq` | ≠ | |
| Math | `approx` | ≈ | |
| Math | `equiv` | ≡ | |
| Math | `sim` | ∼ | |
| Math | `cong` | ≅ | |
| Math | `propto` | ∝ | |
| Math | `ll` | ≪ | |
| Math | `gg` | ≫ | |
| Math | `deg` | ° | |
| Math | `prime` | ′ | |
| Math | `ldots` | … | |
| Math | `cdots` | ⋯ | |
| Math | `vdots` | ⋮ | |
| Math | `ddots` | ⋱ | |
| Math | `arrow` | → | alias for `to` |

## Math symbol-form shortcuts

| Category | Shortcut | Renders as | Notes |
|---|---|---|---|
| Math | `->` | → | |
| Math | `=>` | ⇒ | |
| Math | `<=` | ≤ | |
| Math | `>=` | ≥ | |
| Math | `!=` | ≠ | |
| Math | `~=` | ≈ | |
| Math | `+-` | ± | |
| Math | `--` | − | en-dash style minus |
| Math | `...` | … | |

## Physics

| Category | Shortcut | Renders as | Notes |
|---|---|---|---|
| Physics | `hbar` | ℏ | reduced Planck constant |
| Physics | `hplanck` | ℎ | alternate Planck constant glyph |
| Physics | `Re` | ℜ | real part |
| Physics | `Im` | ℑ | imaginary part |
| Physics | `aleph` | ℵ | aleph |
| Physics | `ell` | ℓ | italic l (liter) |
| Physics | `Box` | □ | |
| Physics | `triangle` | △ | |
| Physics | `Diamond` | ◇ | |
| Physics | `parallel` | ∥ | |
| Physics | `perpendicular` | ⊥ | |
| Physics | `Angstrom` | Å | |

## Chemistry

| Category | Shortcut | Renders as | Notes |
|---|---|---|---|
| Chemistry | `equilibrium` | ⇌ | |
| Chemistry | `<=>` | ⇌ | symbol-form alias |
| Chemistry | `precipitate` | ↓ | |
| Chemistry | `gas` | ↑ | |
| Chemistry | `dH` | \Delta H | LaTeX fallback (renders in KaTeX) |
| Chemistry | `dS` | \Delta S | LaTeX fallback |
| Chemistry | `dG` | \Delta G | LaTeX fallback |

## LaTeX fallbacks

These shortcuts have no clean single-glyph Unicode equivalent, so the
translator keeps them as `\command` strings that pass straight through to
KaTeX.

| Category | Shortcut | Renders as | Notes |
|---|---|---|---|
| LaTeX | `frac` | \frac | |
| LaTeX | `dfrac` | \dfrac | display-style fraction |
| LaTeX | `tfrac` | \tfrac | text-style fraction |
| LaTeX | `binom` | \binom | |
| LaTeX | `overline` | \overline | |
| LaTeX | `underline` | \underline | |
| LaTeX | `hat` | \hat | |
| LaTeX | `vec` | \vec | |
| LaTeX | `bar` | \bar | |
| LaTeX | `tilde` | \tilde | |
