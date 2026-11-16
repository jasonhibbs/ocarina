# Ocarina

[✨ Play the ocarina here](https://ocarina.netlify.app)

A web-based playable synth based on the [Ocarina of Time](<https://zelda.gamepedia.com/Ocarina_of_Time_(Item)>), built with [Tone](https://tonejs.github.io/) and [Vue](https://vuejs.org/).

## Stack

- [Vue 3](https://vuejs.org/) with `<script setup>` and TypeScript
- [Vite](https://vite.dev/) for dev server and builds
- [Pinia](https://pinia.vuejs.org/) for state, [VueUse](https://vueuse.org/) for browser APIs
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) for the offline service worker and manifest
- Deployed on [Netlify](https://www.netlify.com/) (see `netlify.toml`)

Requires Node 22.18+ or 24.12+ (`.nvmrc` pins 24).

## Project setup

```sh
npm install
```

### Develop

```sh
npm run dev
```

The dev server listens on your local network too, so you can open it on a phone to test touch.

### Type-check and build for production

```sh
npm run build
npm run preview # serve the built app, including the service worker
```

### Lint and format

```sh
npm run lint
npm run format
```
