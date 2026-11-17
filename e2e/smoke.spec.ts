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
  await page.getByTitle('About Ocarina').click()
  const card = page.locator('.drawer-card')
  const top = async () => (await card.boundingBox())!.y
  const first = await top()
  await expect.poll(top).toBeLessThan(first - 100)
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
