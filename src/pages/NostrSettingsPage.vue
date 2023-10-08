<template>
  <div align="center">
    <v-card class="card-container" dark>
      <v-card-title class="white--text font-weight-bold"
        >NOSTR Settings</v-card-title
      >
      <v-divider></v-divider>
      <v-card-text>
        <v-row>
          <h4>Current Relays</h4>
        </v-row>
        <v-row v-for="(url, index) in relayList" :key="index">
          <v-col cols="10">{{ url }}</v-col
          ><v-col
            ><v-btn cols="2" color="red" @click="removeRelay(index)"
              >Remove</v-btn
            ></v-col
          >
        </v-row>

        <v-row class="m-2">
          <span class="white--text font-weight-bold mr-1">Add Relay</span>
          <div class="text-field">
            <v-text-field
              v-model="relayUrl"
              class="input"
              label="Enter URL"
              hide-details="auto"
            ></v-text-field>
          </div>
          <v-btn rounded color="primary" class="mt-3 ml-3" @click="addRelay()"
            >Add</v-btn
          >
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>
<style scoped>
.card-container {
  width: 80%;
}
.text-field {
  width: 50%;
}
</style>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { useNostrStore } from "../store/nostr-store";

export default defineComponent({
  name: "NostrSettingsPage",

  setup() {
    const nostrStore = useNostrStore();
    const relayUrl = ref<string>("");
    const relayList = computed((): string[] => {
      return nostrStore.relays;
    });
    function addRelay() {
      nostrStore.addRelay(relayUrl.value);
    }
    async function removeRelay(index: number) {
      await nostrStore.removeRelay(index);
    }
    return { nostrStore, relayList, relayUrl, addRelay, removeRelay };
  },
});
</script>
