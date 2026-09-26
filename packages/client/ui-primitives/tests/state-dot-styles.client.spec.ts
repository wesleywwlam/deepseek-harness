/**
 * StateDot's palette as CSS text. jsdom has no layout and CSS Modules resolve
 * to class-name maps in the component suites, so the only place the per-state
 * colors can be read is the stylesheet itself: a state whose rule is missing
 * renders on the inherited color instead of its own, which no render assertion
 * would catch.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const css = readFileSync(fileURLToPath(new URL('../src/StateDot.module.css', import.meta.url)), 'utf8')

describe('StateDot.module.css', () => {
  it.each(['done', 'warning', 'error', 'idle'] as const)('gives the %s state its own color rule', (state) => {
    expect(css).toContain(`.dot[data-state='${state}']`)
  })

  it('renders solid states without a halo', () => {
    expect(css).not.toContain('.dot::before')
    expect(css).toContain('.dot::after')
  })

  it('uses success green for done', () => {
    expect(css).toMatch(/\.dot\[data-state='done'\][^{]*\{[^}]*--dsw-alias-state-success-primary/su)
  })

  it('uses the neutral state token for idle', () => {
    expect(css).toMatch(/\.dot\[data-state='idle'\][^{]*\{[^}]*--dsw-alias-state-idle-primary/su)
  })

  it('keeps ongoing on the rotating spinner rather than a solid-dot rule', () => {
    expect(css).not.toContain(".dot[data-state='ongoing']")
    expect(css).toContain('.spinnerTrack')
    expect(css).toMatch(/\.spinnerArc\s*\{[^}]*stroke-dasharray: 18 150;[^}]*stroke-dashoffset: -3/su)
    expect(css).toContain('@keyframes dsh-state-dot-spin')
  })

  it('animates only compositor-driven properties, on the outer svg', () => {
    // stroke-dash* and transforms on inner SVG nodes re-run style and layout every frame on the main thread.
    const keyframes = [...css.matchAll(/@keyframes [\w-]+\s*\{((?:[^{}]*\{[^}]*\})*)\s*\}/gu)].map(match => match[1] ?? '')
    expect(keyframes.length).toBeGreaterThan(0)
    for (const body of keyframes) {
      const properties = [...body.matchAll(/([\w-]+)\s*:/gu)].map(match => match[1])
      expect(properties.every(property => property === 'transform' || property === 'opacity')).toBe(true)
    }
    expect(css).toMatch(/\.spinner\s*\{[^}]*animation: dsh-state-dot-spin 1\.5s linear infinite/su)
  })

  it('stops the rotation for reduced motion', () => {
    const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduced).toMatch(/\.spinner\s*\{\s*animation: none/su)
  })
})
