import { describe, expect, it } from 'vitest'
import { evenSplit } from './defaults'

describe('evenSplit', () => {
  it('always adds up to 100 with whole numbers', () => {
    expect(evenSplit(['a', 'b'])).toEqual({ a: 50, b: 50 })
    expect(evenSplit(['a', 'b', 'c'])).toEqual({ a: 34, b: 33, c: 33 })
    expect(evenSplit(['a', 'b', 'c', 'd', 'e', 'f'])).toEqual({
      a: 17,
      b: 17,
      c: 17,
      d: 17,
      e: 16,
      f: 16,
    })
  })
})
