import { expect, test } from '@playwright/test'

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

test.describe('mouse and keyboard', { tag: '@desktop' }, () => {
  test('plays a note with the mouse and turns the status dot green', async ({
    page,
  }) => {
    const key = page.locator('.synth-key[data-note="C5"]')
    const status = page.locator('.status')
    await expect(status).not.toHaveAttribute('data-state', /./)

    await key.hover()
    await page.mouse.down()
    await expect(key).toHaveAttribute('aria-pressed', 'true')
    await expect(status).toHaveAttribute('data-state', 'good')
    await page.mouse.up()
    await expect(key).toHaveAttribute('aria-pressed', 'false')
  })

  test('plays from the keyboard', async ({ page }) => {
    const key = page.locator('.synth-key[data-note="C5"]')
    await page.keyboard.down('s')
    await expect(key).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.up('s')
    await expect(key).toHaveAttribute('aria-pressed', 'false')
  })
})

test.describe('touch', { tag: '@mobile' }, () => {
  test('plays a note by touch and turns the status dot green', async ({
    page,
  }) => {
    const key = page.locator('.synth-key[data-note="C5"]')
    const status = page.locator('.status')
    await expect(status).not.toHaveAttribute('data-state', /./)

    // Raw touch events: Playwright's tap() releases immediately.
    const box = (await key.boundingBox())!
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    const cdp = await page.context().newCDPSession(page)

    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [point],
    })
    await expect(key).toHaveAttribute('aria-pressed', 'true')
    await expect(status).toHaveAttribute('data-state', 'good')

    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    })
    await expect(key).toHaveAttribute('aria-pressed', 'false')
  })
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
