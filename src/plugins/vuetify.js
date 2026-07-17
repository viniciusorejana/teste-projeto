import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    themes: {
      light: {
        primary: '#2E7D32',
        secondary: '#FFC107',
        accent: '#FF7043',
        error: '#D32F2F',
        success: '#43A047',
        info: '#0288D1',
        warning: '#FFA000',
      },
    },
  },
});
