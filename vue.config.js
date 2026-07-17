module.exports = {
  transpileDependencies: [
    'vuetify'
  ],

  pwa: {
    name: 'Fodinha',
    themeColor: '#1B5E20',
    msTileColor: null,
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black-translucent',
    // public/manifest.json (created by hand) is picked up automatically by
    // @vue/cli-plugin-pwa as manifestOptions when this key is left unset.
    iconPaths: {
      // We don't have these extra icon formats, so disable the default
      // (broken) links the plugin would otherwise inject.
      faviconSVG: null,
      favicon32: null,
      favicon16: null,
      maskIcon: null,
      msTileImage: null,
      appleTouchIcon: 'img/icons/apple-touch-icon.png'
    }
  },

  chainWebpack: config => {
    // @vue/cli-plugin-pwa generates its own dist/manifest.json (merging
    // public/manifest.json with its defaults) and would otherwise conflict
    // with the raw copy of public/manifest.json performed by copy-webpack-plugin.
    // Exclude the raw file here so the plugin-generated one is the only output.
    if (config.plugins.has('copy')) {
      config.plugin('copy').tap(pluginArgs => {
        pluginArgs[0][0].ignore = [
          ...(pluginArgs[0][0].ignore || []),
          'manifest.json'
        ]
        return pluginArgs
      })
    }
  }
}
