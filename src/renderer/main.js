// Pakcages
import Vue from 'vue'
import axios from 'axios'

// Libs
import App from './App'
import router from './router'
import store from './store'

// Theme
import 'bootstrap/dist/css/bootstrap.css'
import 'open-iconic/font/css/open-iconic.css'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
