<template>
  <div>
    <dashboard />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Dashboard from "../components/Dashboard.vue";

export default defineComponent({
  components: { Dashboard },
  name: "DashboardPage",
  setup() {
    //
  },
});
</script>
