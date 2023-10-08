<template>
  <lightning-wallet />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import LightningWallet from "../components/LightningWallet.vue";

export default defineComponent({
  name: "WalletPage",
  components: { LightningWallet },
  setup() {
    //
  },
});
</script>
