import Vue from 'vue'
import '@mdi/font/css/materialdesignicons.css'
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import './styles/tema.css'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'
import store from './store'
import i18n, { aplicarIdiomaNoDocumento } from './i18n'

Vue.config.productionTip = false

aplicarIdiomaNoDocumento()

new Vue({
  vuetify,
  router,
  store,
  i18n,
  render: h => h(App)
}).$mount('#app')
