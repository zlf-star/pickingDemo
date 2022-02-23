/**
 * @description 导入所有 vuex 模块，自动加入namespaced:true，用于解决vuex命名冲突，请勿修改。
 * 通过key/attributeName访问模块的vuex
 */

import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const files = require.context('./modules', false, /\.js$/)
const modules = {}
files.keys().forEach((key) => {
  //key == ./project.js ./setting.js ./tagsView.js ....
  //set ./project.js => project as key in modules。
  modules[key.replace(/(\.\/|\.js)/g, '')] = files(key).default
})
Object.keys(modules).forEach((key) => {
  //open namespaced in modules
  modules[key]['namespaced'] = true
})
const store = new Vuex.Store({
  //默认以modules中key作为模块名进行模块注册了
  //=> project: require('./project.js') 
  modules,
})
export default store
