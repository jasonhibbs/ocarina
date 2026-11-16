# Design sources

Source artwork that isn't served by the app, kept here so it doesn't end up
in the build or the service worker's offline cache.

- `icon-1024.png`, `icon-dark-1024.png`: master app icons, for generating
  the sizes in `public/img/icons`.
- `launch.html`: template for the iOS launch screens in `public/img/launch`,
  rendered with [pwa-asset-generator](https://github.com/elegantapp/pwa-asset-generator).
  The commands are in a comment in the file.
