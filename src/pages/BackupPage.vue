<template>
  <div align="center">
    <v-card class="card-container" dark>
      <v-card-title class="white--text font-weight-bold"
        >Backup Private Key</v-card-title
      >
      <v-divider></v-divider>
      <v-card-text>
        <v-row>
          <h4>You will not see this again please write it down</h4>
        </v-row>
        <v-row>
          <v-text-field disabled v-model="privateKey.key" />
          <div class="pt-4 pl-3">
            <v-btn title="Copy to Clipboard" @click="copyToClipBoard()"
              ><v-icon color="green darken-2" v-if="copied"
                >mdi-content-save-check</v-icon
              >
              <v-icon v-else>mdi-content-copy</v-icon></v-btn
            >
          </div>
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
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "BackupPage",

  setup() {
    const privateKey = ref(JSON.parse(localStorage["params"]));
    localStorage["params"] = "";
    const copied = ref<boolean>(false);
    function copyToClipBoard() {
      navigator.clipboard.writeText(privateKey.value.key);
      copied.value = true;
    }
    return { privateKey, copyToClipBoard, copied };
  },
});
</script>
