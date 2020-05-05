module.exports = {
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = 'Ocarina'
      return args
    })
  },
  configureWebpack: {
    devtool: 'source-map',
  },
  devServer: {
    disableHostCheck: true,
  },
  css: {
    loaderOptions: {
      sass: {
        sassOptions: {
          precision: 8,
        },
      },
    },
    sourceMap: true,
  },
  pwa: {
    name: 'Ocarina',
    themeColor: '#fff',
    appleMobileWebAppCapable: 'yes',
    iconPaths: {
      appleTouchIcon: 'img/icons/apple-touch-icon-precomposed.png',
      msTileImage: 'img/icons/mstile-150x150.png',
    },
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: 'src/serviceWorker.js',
    },
    msTileColor: '#528bFF',
    manifestOptions: {
      background_color: '#fff',
      theme_color: 'transparent',
    },
  },
}
