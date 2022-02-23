module.exports = {
  presets: [
    // '@vue/cli-plugin-babel/preset'
    [ "@vue/app", { useBuiltIns: "entry" } ]
    // '@vue/app'
  ],
  // 'env': {
  //   'development': {
  //     // babel-plugin-dynamic-import-node plugin only does one thing by converting all import() to require().
  //     // This plugin can significantly increase the speed of hot updates, when you have a large number of pages.
  //     // https://panjiachen.github.io/vue-element-admin-site/guide/advanced/lazy-loading.html
  //     'plugins': ['dynamic-import-node']
  //   }
  // }
  
    // "presets": [
    //   ["env", {
    //     "modules": false,
    //     "targets": {
    //       "browsers": ["> 1%", "last 2 versions", "not ie <= 8"]
    //     }
    //   }],
    //   "stage-2",
    //   [ "@vue/app", { useBuiltIns: "entry" } ]
    // ],
    // "plugins": ["transform-runtime","transform-vue-jsx"],
    // "env": {
    //   "test": {
    //     "presets": ["env", "stage-2"],
    //     "plugins": ["transform-vue-jsx","istanbul"]
    //   }
    // }
  
}
