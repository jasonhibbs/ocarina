import { expect, test, type Page } from '@playwright/test'

// Browsers only start audio from a gesture, like a real visitor's first tap.
async function startAudio(page: Page) {
  const start = page.getByRole('button', { name: 'Tap to activate' })
  await start.click()
  await expect(start).toBeHidden()
  await expect(page.locator('.status')).toHaveAttribute('data-state', 'good')
}

let errors: string[] = []

test.beforeEach(async ({ page }) => {
  errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/')
})

test.afterEach(() => {
  expect(errors).toEqual([])
})

test('shows twenty keys from F4 to D7', async ({ page }) => {
  const keys = page.locator('.synth-key')
  await expect(keys).toHaveCount(20)
  await expect(keys.first()).toHaveAttribute('data-note', 'F4')
  await expect(keys.last()).toHaveAttribute('data-note', 'D7')
})

test('asks for a tap before playing, then gets out of the way', async ({
  page,
}) => {
  await expect(page.locator('.status')).not.toHaveAttribute('data-state', /./)
  await startAudio(page)
})

test.describe('mouse and keyboard', { tag: '@desktop' }, () => {
  test('plays a note with the mouse', async ({ page }) => {
    await startAudio(page)
    const key = page.locator('.synth-key[data-note="C5"]')
    await key.hover()
    await page.mouse.down()
    await expect(key).toHaveAttribute('aria-pressed', 'true')
    await page.mouse.up()
    await expect(key).toHaveAttribute('aria-pressed', 'false')
  })

  test('starts audio and plays from the keyboard, without the button', async ({
    page,
  }) => {
    const key = page.locator('.synth-key[data-note="C5"]')
    await page.keyboard.down('s')
    await expect(key).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.status')).toHaveAttribute('data-state', 'good')
    await expect(
      page.getByRole('button', { name: 'Tap to activate' })
    ).toBeHidden()
    await page.keyboard.up('s')
    await expect(key).toHaveAttribute('aria-pressed', 'false')
  })

  test('plays notes in quick succession without an error', async ({ page }) => {
    await startAudio(page)
    // Notes a millisecond apart share an audio block, so share Tone's "now"
    await page.evaluate(async () => {
      const tick = () => new Promise((r) => setTimeout(r, 0))
      const key = (type: string, code: string) =>
        document.documentElement.dispatchEvent(
          new KeyboardEvent(type, { code, bubbles: true })
        )
      for (const [a, b] of [
        ['KeyS', 'KeyD'],
        ['KeyF', 'KeyG'],
        ['KeyH', 'KeyJ'],
      ] as const) {
        key('keydown', a)
        await tick()
        key('keydown', b)
        await tick()
        key('keyup', b)
        key('keyup', a)
        await tick()
      }
    })
    await expect(page.locator('.status')).toHaveAttribute('data-state', 'good')
  })
})

test.describe('touch', { tag: '@mobile' }, () => {
  test('plays a note by touch', async ({ page }) => {
    await startAudio(page)
    const key = page.locator('.synth-key[data-note="C5"]')

    // Raw touch events: Playwright's tap() releases immediately.
    const box = (await key.boundingBox())!
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    const cdp = await page.context().newCDPSession(page)

    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [point],
    })
    await expect(key).toHaveAttribute('aria-pressed', 'true')

    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    })
    await expect(key).toHaveAttribute('aria-pressed', 'false')
  })
})

test('slides the drawer up when it opens', async ({ page }) => {
  // The browser starts a transform transition on the card only if it slides
  // in. (Timing its position instead was flaky under load.)
  await page.evaluate(() => {
    document.addEventListener(
      'transitionrun',
      (e) => {
        const target = e.target as HTMLElement
        if (
          target.classList.contains('drawer-card') &&
          e.propertyName === 'transform'
        ) {
          document.documentElement.dataset.drawerSlid = 'true'
        }
      },
      true
    )
  })
  await page.getByTitle('About Ocarina').click()
  await expect(page.locator('html')).toHaveAttribute('data-drawer-slid', 'true')
})

test('switches layout from the drawer and remembers it', async ({ page }) => {
  const keys = page.locator('.synth-keys')
  await expect(keys).toHaveClass(/_gamepad/)

  await page.getByTitle('About Ocarina').click()
  const drawer = page.getByRole('dialog', { name: 'Ocarina Settings' })
  await expect(drawer).toBeVisible()
  await drawer.getByRole('radio', { name: 'Pad' }).click()
  await expect(keys).not.toHaveClass(/_gamepad/)

  await page.reload()
  await expect(page.locator('.synth-keys')).not.toHaveClass(/_gamepad/)
  await page.getByTitle('Layout: Pad').click()
  await expect(page.locator('.synth-keys')).toHaveClass(/_gamepad/)
})

test('labels the Switch 2 buttons L, R, Y, X and A', async ({ page }) => {
  await page.getByTitle('Layout: N64').click()
  await expect(page.locator('.synth-keys')).toHaveClass(/_switch/)

  // Same notes as the N64's A, C-down, C-left, C-up and C-right
  for (const [note, letter] of [
    ['D5', 'L'],
    ['F5', 'R'],
    ['B5', 'Y'],
    ['D6', 'X'],
    ['A5', 'A'],
  ]) {
    await expect(
      page.locator(`.synth-key[data-note="${note}"] .synth-key-inner`)
    ).toHaveCSS('content', `"${letter}"`, { pseudo: 'after' })
  }
})

test.describe('the Pad grid', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() =>
      localStorage.setItem('ocarina.synthLayout', 'pad')
    )
    await page.reload()
  })

  test('lays out semitones along rows a major third apart, squared to the screen', async ({
    page,
  }) => {
    const keys = page.locator('.synth-key')
    const landscape = await page.evaluate(
      () => matchMedia('(orientation: landscape)').matches
    )
    // A row more above and below in portrait, a column more either side in
    // landscape
    const [rows, columns] = landscape ? [6, 7] : [8, 5]
    await expect(keys).toHaveCount(rows * columns)

    const layout = await keys.evaluateAll((els) =>
      els.map((el) => {
        const box = el.getBoundingClientRect()
        return {
          note: (el as HTMLElement).dataset.note!,
          x: Math.round(box.x),
          y: Math.round(box.y),
          size: Math.min(box.width, box.height),
        }
      })
    )
    const names = [
      'C',
      'C#',
      'D',
      'D#',
      'E',
      'F',
      'F#',
      'G',
      'G#',
      'A',
      'A#',
      'B',
    ]
    const midi = (note: string) => {
      const [, name, octave] = note.match(/^([A-G]#?)(\d)$/)!
      return names.indexOf(name!) + (Number(octave) + 1) * 12
    }
    // From where each key is on screen: up a row is 4 semitones, along a
    // column 1, starting at the bottom-left
    // Rows and columns, grouping positions within a pixel or two (keys can
    // sit on half pixels)
    const lines = (values: number[]) =>
      [...values]
        .sort((a, b) => a - b)
        .filter((v, i, sorted) => i === 0 || v - sorted[i - 1]! > 2)
    const lineOf = (lines: number[], v: number) =>
      lines.findIndex((line) => Math.abs(line - v) <= 2)
    const xs = lines(layout.map((k) => k.x))
    const ys = lines(layout.map((k) => k.y)).reverse() // bottom row first
    expect([ys.length, xs.length]).toEqual([rows, columns])
    const bottomLeft = layout.find(
      (k) => lineOf(xs, k.x) === 0 && lineOf(ys, k.y) === 0
    )!
    const base = midi(bottomLeft.note)
    for (const k of layout) {
      expect(midi(k.note)).toBe(base + lineOf(ys, k.y) * 4 + lineOf(xs, k.x))
    }
    // Every key a comfortable touch target
    expect(Math.min(...layout.map((k) => k.size))).toBeGreaterThanOrEqual(44)
  })

  test('plays a note from either of its keys', async ({ page }) => {
    await startAudio(page)
    const f5 = page.locator('.synth-key[data-note="F5"]')
    expect(await f5.count()).toBeGreaterThanOrEqual(2)
    for (const i of [0, 1]) {
      await f5.nth(i).hover()
      await page.mouse.down()
      await expect(f5.nth(i)).toHaveAttribute('aria-pressed', 'true')
      await page.mouse.up()
      await expect(f5.nth(i)).toHaveAttribute('aria-pressed', 'false')
    }
  })
})

test('offers the fourths grid with ?grid=fourths', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('ocarina.synthLayout', 'pad'))
  await page.goto('/?grid=fourths')
  const keys = page.locator('.synth-key')
  // 7 rows of 5 in portrait, or 5 rows of 7 in landscape
  await expect(keys).toHaveCount(35)
  const notes = await keys.evaluateAll((els) =>
    els.map((el) => (el as HTMLElement).dataset.note)
  )
  // A row up is a fourth: the second row starts 5 semitones above the first
  const landscape = await page.evaluate(
    () => matchMedia('(orientation: landscape)').matches
  )
  expect(notes[landscape ? 7 : 5]).toBe(landscape ? 'C#5' : 'A4')
})
