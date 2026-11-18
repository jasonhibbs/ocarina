import { describe, expect, it } from 'vitest'
import { equalLoudnessSpl } from '../equalLoudness'

describe('ISO 226:2003 equal-loudness contours', () => {
  it.each([20, 40, 60, 80])('gives %i dB at 1 kHz for %i phon', (phon) => {
    expect(equalLoudnessSpl(1000, phon)).toBeCloseTo(phon, 1)
  })

  it('needs more level for lower tones', () => {
    // The standard's 60-phon contour: about 78.7 dB at 100 Hz
    expect(equalLoudnessSpl(100, 60)).toBeCloseTo(78.7, 0)
    expect(equalLoudnessSpl(330, 60)).toBeGreaterThan(equalLoudnessSpl(880, 60))
  })

  it('needs about 5 dB more for E4 than A5, at 60 phon', () => {
    const extra = equalLoudnessSpl(329.63, 60) - equalLoudnessSpl(880, 60)
    expect(extra).toBeGreaterThan(4.5)
    expect(extra).toBeLessThan(5.7)
  })
})
