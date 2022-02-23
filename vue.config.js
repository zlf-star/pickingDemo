const path = require('path')
const {
  publicPath,
  assetsDir,
  outputDir,
  lintOnSave,
  transpileDependencies,
  title,
  devPort,
} = require('./src/utils/config')
const { version, author } = require('./package.json')
process.env.VUE_APP_TITLE = title || 'vue-admin-beautiful'
process.env.VUE_APP_AUTHOR = author || 'zhanglunfeng 1251822523@qq.com'
process.env.VUE_APP_VERSION = version
const resolve = (dir) => path.join(__dirname, dir)

// const ThreeExamples = require('import-three-examples')

module.exports = {
  publicPath,
  assetsDir,
  outputDir,
  lintOnSave,
  transpileDependencies,
  devServer: {
    hot: true,
    port: devPort,
    open: true,
    noInfo: false,
    overlay: {
      warnings: false,
      errors: true,
    },
  },
  css: {
    loaderOptions: {
      less: {
        globalVars: {
          hack: `true; @import '~assets/styles/variables.less';`
        }
      }
    }
  },
  chainWebpack(config) {
    // set svg-sprite-loader
    config.module
        .rule('svg')
        .exclude.add(resolve('src/icons'))
        .end()
    config.module
        .rule('icons')
        .test(/\.svg$/)
        .include.add(resolve('src/icons'))
        .end()
        .use('svg-sprite-loader')
        .loader('svg-sprite-loader')
        .options({
            symbolId: 'icon-[name]'
        })
        .end()

      

},
  configureWebpack:{
    resolve:{

      alias:{
        'assets':'@/assets',//vue-cli2不可以直接写@，需要写src
        'network':'@/network',
        'components':'@/components',
        'views':'@/views',
        'utils':'@/utils',
        'api':'@/api',
        'lang':'@/lang',
        'layout':'@/layout',
        'plugins':'@/plugins',
        'router':'@/router',
        'store':'@/store'
        
        // 'vue':'vue/dist/vue.js'
      }
    }
  }
  
}