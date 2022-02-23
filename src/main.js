import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'


//import i18n
import i18n from './lang'
//plug-in register
import './plugins'
//svg icons
import './icons/index'



Vue.use(ElementUI,{
  i18n: (key, value) => i18n.t(key, value)
})

//向Vue的原型中添加$bus
Vue.prototype.$bus = new Vue()


Vue.config.productionTip = false
//leading-in self-defined instuctions
// directive()

new Vue({
  router,
  store,
  i18n,
  render: h => h(App)
}).$mount('#app')
