import Vue from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import { createPinia, PiniaVuePlugin } from "pinia";
import VueSimpleAlert from "vue-simple-alert";

Vue.use(VueSimpleAlert);

Vue.config.productionTip = false;

Vue.use(PiniaVuePlugin);
const pinia = createPinia();

new Vue({
  router,
  store,
  vuetify,
  pinia,
  render: (h) => h(App),
}).$mount("#app");
