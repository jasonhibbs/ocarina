/**
 * Registers the service worker so new versions arrive on their own: the
 * worker takes over as soon as it installs (skipWaiting + clientsClaim, set
 * by `registerType: 'autoUpdate'`), and the page switches to the new code
 * when that won't interrupt anyone.
 */
export function registerServiceWorker({
  canReloadNow,
}: {
  /** Whether reloading right now would interrupt the player. */
  canReloadNow: () => boolean
}) {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return

  const sw = navigator.serviceWorker
  let hadController = !!sw.controller

  sw.addEventListener('controllerchange', () => {
    // The very first install isn't an update: the page is already current.
    if (!hadController) {
      hadController = true
      return
    }
    if (canReloadNow() || document.hidden) {
      location.reload()
    } else {
      // Mid-play: switch when the app is next hidden. iOS interrupts audio
      // in the background anyway, so it would need reactivating regardless.
      document.addEventListener('visibilitychange', () => location.reload(), {
        once: true,
      })
    }
  })

  sw.register('/serviceWorker.js').then((registration) => {
    // Installed apps can stay open for days without navigating, which is
    // when browsers normally check: check whenever the app comes back.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update()
    })
  })
}
