<template>
  <v-app>
    <div v-if="currentRoute != '/backup'">
      <v-app-bar :color="appBarColor" dark app>
        ChoreBit
        <div class="d-flex align-center pl-3">
          <v-img
            class="shrink mr-2"
            contain
            src="./assets/icons8-bitcoin-accepted-96.png"
            transition="scale-transition"
            width="40"
          />
        </div>

        <v-spacer></v-spacer>
        <div class="d-flex" v-if="pubKey && !nostrStore.isLoading">
          <div class="d-flex align-center pl-3">
            <v-menu
              :key="`${nostrStore.friends.length}-${nostrStore.forceUpdate}`"
              v-model="menuOpened"
              dark
              :close-on-content-click="false"
              offset-y
              nudge-left="170vw"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  color="secondary"
                  title="Messenger"
                  fab
                  small
                  dark
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon>mdi-message</v-icon>
                </v-btn>
              </template>
              <v-list class="messenger-window">
                <v-list-item class="messenger">
                  <messenger @input="menuOpened = !menuOpened" />
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
          <div class="d-flex align-center pl-3">
            <v-btn
              to="/nostr"
              color="secondary"
              title="Nostr Settings"
              fab
              small
              dark
            >
              <v-icon>mdi-cog</v-icon>
            </v-btn>
          </div>
          <div class="d-flex align-center pl-3">
            <v-btn rounded color="red" @click="logout()">Logout</v-btn>
          </div>
        </div>

        <v-switch
          v-model="dark"
          title="Light Mode"
          class="pl-3 pt-5"
          @change="toggleDark()"
        />
      </v-app-bar>
      <template v-if="pubKey && !nostrStore.isLoading">
        <v-card>
          <v-navigation-drawer
            v-model="drawer"
            :mini-variant="mini"
            permanent
            app
            :color="appBarColor"
            dark
          >
            <v-list-item class="px-2">
              <v-list-item-avatar>
                <v-img :src="nostrStore.UserInfo.profile.picture"></v-img>
              </v-list-item-avatar>

              <v-list-item-title>{{
                nostrStore.UserInfo.profile.username
              }}</v-list-item-title>

              <v-btn icon @click.stop="mini = !mini">
                <v-icon>mdi-chevron-left</v-icon>
              </v-btn>
            </v-list-item>

            <v-divider></v-divider>

            <v-list dense>
              <v-list-item
                v-for="page in pages"
                :key="page.title"
                :to="page.route"
                :title="page.hover"
              >
                <v-list-item-icon>
                  <v-icon>{{ page.icon }}</v-icon>
                </v-list-item-icon>

                <v-list-item-content>
                  <v-list-item-title>{{ page.title }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content> </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-navigation-drawer>
        </v-card>
      </template>
    </div>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { useDark, useToggle } from "@vueuse/core";
import { useNostrStore } from "./store/nostr-store";
import Router from "./router";
import Messenger from "./components/Messenger.vue";

export default defineComponent({
  components: { Messenger },
  name: "App",
  setup() {
    const router = Router;
    const appBarColor = ref("#262525");
    const dark = ref<boolean>(true);
    const drawer = ref<boolean>(true);
    const mini = ref<boolean>(true);
    const pages = ref([
      { title: "Home", icon: "mdi-home", route: "/", hover: "Home" },
      {
        title: "Chores Dashboard",
        icon: "mdi-view-dashboard",
        route: "/dashboard",
        hover: "Chores Dashboard",
      },
      {
        title: "Profile",
        icon: "mdi-account-box",
        route: "/profile",
        hover: "Profile",
      },
      {
        title: "Friends List",
        icon: "mdi-account-plus-outline",
        route: "/friends",
        hover: "Friends List",
      },
      {
        title: "Bitcoin Wallet",
        icon: "mdi-wallet",
        route: "/wallet",
        hover: "Bitcoin Wallet",
      },
    ]);
    const currentRoute = ref(router.currentRoute.fullPath);
    const showChat = ref<boolean>(false);
    const menuOpened = ref<boolean>(false);
    const nostrStore = computed(() => {
      return useNostrStore();
    });
    const pubKey = computed(() => {
      return nostrStore.value.pubKey;
    });
    const isDark = useDark({
      selector: "main", //element to add attribute to
      attribute: "theme", // attribute name
      valueDark: "custom-dark", // attribute value for dark mode
      valueLight: "custom-light", // attribute value for light mode
    });
    const toggleDark = useToggle(isDark);
    function logout() {
      router.push({ name: "home" });
      window.location.reload();
    }

    return {
      pages,
      dark,
      drawer,
      mini,
      isDark,
      pubKey,
      nostrStore,
      toggleDark,
      logout,
      currentRoute,
      showChat,
      menuOpened,
      appBarColor,
    };
  },
});
</script>

<style>
.fitScreen {
  width: 100vw;
}
@media (max-width: 800px) {
  /* CSS that should be displayed if width is equal to or less than 800px goes here */
  .messenger-window {
    margin-top: 10px;
    height: 50vh;
    width: 100vw;
  }
}

[theme="custom-dark"] {
  background: #353434;
  color: #fff;
  width: 100%;
  height: 100%;
}
[theme="custom-light"] {
  background: #fff;
  color: black;
  width: 100%;
  height: 100%;
}
</style>
