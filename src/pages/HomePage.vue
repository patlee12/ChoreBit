<template>
  <v-container class="card">
    <v-card align="center" class="card pt-10" dark>
      <h1>ChoreBit</h1>
      <h2>(Early Alpha Version)</h2>
      <h4>An application focused on providing ways to save in Bitcoin.</h4>
      <div v-if="pubKey == ''" class="pt-3 pb-3">
        <v-btn to="/profile" color="primary">Login</v-btn>
      </div>
      <div v-else class="pt-3 pb-3">
        <v-btn to="/profile" color="primary">Get Started</v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useNostrStore } from "../store/nostr-store";

export default defineComponent({
  name: "HomePage",
  setup() {
    const nostrStore = useNostrStore();
    const pubKey = computed(() => {
      return nostrStore.pubKey;
    });
    return {
      pubKey,
      nostrStore,
    };
  },
});
</script>
<style scoped>
@media (max-width: 600px) {
  /* CSS that should be displayed if width is equal to or less than 800px goes here */
  .card {
    width: 80vw;
    padding: 5px;
    border-width: 4px;
    border-color: #353434;
  }
}
@media (min-width: 1000px) {
  .card {
    width: 50vw;
    padding: 2px;
    border-width: 4px;
    border-color: #353434;
  }
}
</style>
