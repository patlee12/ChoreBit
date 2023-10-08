import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import HomePage from "../pages/HomePage.vue";
import DashboardPage from "../pages/DashboardPage.vue";
import WalletPage from "../pages/WalletPage.vue";
import NostrSettingsPage from "../pages/NostrSettingsPage.vue";
import AddFriendsPage from "../pages/AddFriendsPage.vue";
import ProfilePage from "../pages/ProfilePage.vue";
import BackupPage from "../pages/BackupPage.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "home",
    component: HomePage,
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: DashboardPage,
  },
  {
    path: "/wallet",
    name: "wallet",
    component: WalletPage,
  },
  {
    path: "/nostr",
    name: "nostr",
    component: NostrSettingsPage,
  },
  {
    path: "/friends",
    name: "friends",
    component: AddFriendsPage,
  },
  {
    path: "/profile",
    name: "profile",
    component: ProfilePage,
  },
  {
    path: "/backup",
    name: "backup",
    component: BackupPage,
  },
];

const router = new VueRouter({
  routes,
});

export default router;
