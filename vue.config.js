const fs = require('fs');

module.exports = {
  chainWebpack: (config) => {
    config.plugin('html').tap((args) => {
      args[0].title = 'Ocarina';
      return args;
    });
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
};
