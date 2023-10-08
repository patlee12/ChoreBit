<template>
  <v-menu
    v-model="menuOpened"
    dark
    :close-on-content-click="false"
    offset-y
    nudge-left="170"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        :color="color"
        title="More Information"
        fab
        x-small
        dark
        v-bind="attrs"
        v-on="on"
      >
        <v-icon>mdi-help</v-icon>
      </v-btn>
    </template>
    <v-list outlined class="list">
      <v-list-item>
        <span>{{ text }}</span>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
<style scoped>
.list {
  margin-top: 5px;
  width: 50vw;
  border-width: 5px;
  border-color: #42a5f5;
}
</style>

<script lang="ts">
import { defineComponent, ref, toRefs } from "vue";

export default defineComponent({
  name: "HelpButton",
  props: {
    text: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: "primary",
    },
  },
  setup() {
    const menuOpened = ref<boolean>(false);
    //
    return { menuOpened };
  },
});
</script>
