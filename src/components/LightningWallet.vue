<template>
  <div align="center">
    <v-card class="wallet" dark>
      <v-card-title class="white--text font-weight-bold">
        <v-img
          class="shrink ml-1 mr-1"
          contain
          src="../assets/btcLightning.svg.png"
          transition="scale-transition"
          width="18"
        />
        Lightning Wallet</v-card-title
      >
      <v-divider></v-divider>
      <v-card-text>
        <v-row class="ma-3">
          <span class="white--text font-weight-bold mr-10 mt-5">LN-URL</span>
          <v-text-field
            v-model="lnURL"
            class="input mt-1"
            label="Enter LN-URL"
            title="This LN-URL is saved to public profile."
            hide-details="auto"
            outlined
          ></v-text-field>
          <v-btn @click="setLNUrl()" color="green" rounded class="ma-3"
            >Save</v-btn
          >
        </v-row>
        <v-row class="ma-3">
          <span class="white--text font-weight-bold mr-3 mt-5">LN-Address</span>
          <v-text-field
            v-model="lnAddress"
            class="input mt-1"
            label="Enter LN-Address"
            title="This LN-Address is saved to public profile."
            hide-details="auto"
            outlined
          ></v-text-field>
          <v-btn @click="setLNAddress()" color="green" rounded class="ma-3"
            >Save</v-btn
          >
        </v-row>
        <v-row>
          <v-col>
            Desktop Wallet with NOSTR support and Wallet Extension (For
            Beginners)
            <v-btn
              title="Alby NOSTR/Bitcoin Wallet Extension"
              class="ma-3"
              href="https://getalby.com/"
              target="_blank"
              ><v-img
                class="ma-3"
                contain
                src="../assets/alby.svg"
                transition="scale-transition"
                width="10vw"
            /></v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            Phone Wallets
            <v-btn
              title="Custodial Lightning Wallet with NOSTR Support (Beginners)"
              class="ma-3"
              href="https://www.walletofsatoshi.com/"
              target="_blank"
              ><v-img
                class="ma-3"
                contain
                src="../assets/walletOfSat.svg"
                transition="scale-transition"
                width="10vw"
            /></v-btn>
            <v-btn
              title="Blue Wallet Bitcoin/Lightning Non Custodial (Intermediate)"
              class="ma-3"
              href="https://bluewallet.io/"
              target="_blank"
              ><v-img
                class="ma-3"
                contain
                src="../assets/blueWallet.png"
                transition="scale-transition"
                width="5vw"
            /></v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            Bitcoin Full Node (Beginner Friendly)
            <v-btn
              title="MyNode Bitcoin/Lightning Full Node Environment and hardware"
              class="ma-3"
              href="https://mynodebtc.com/"
              target="_blank"
              ><v-img
                class="ma-3"
                contain
                src="../assets/mynode_logo.png"
                transition="scale-transition"
                width="10vw"
            /></v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>
<style scoped>
.wallet {
  width: 50vw;
}
</style>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useNostrStore } from "../store/nostr-store";

export default defineComponent({
  name: "LightningWallet",
  setup() {
    const nostrStore = useNostrStore();
    const lnURL = ref<string>(nostrStore.lnURL || "");
    const lnAddress = ref<string>(nostrStore.lnAddress || "");

    const isValidUrl = (urlString: string) => {
      var urlPattern = new RegExp(
        "^(https?:\\/\\/)?" + // validate protocol
          "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // validate domain name
          "((\\d{1,3}\\.){3}\\d{1,3}))" + // validate OR ip (v4) address
          "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // validate port and path
          "(\\?[;&a-z\\d%_.~+=-]*)?" + // validate query string
          "(\\#[-a-z\\d_]*)?$",
        "i"
      );
      return !!urlPattern.test(urlString);
    };

    const isValidAddress = (address: string) => {
      const isValid = /\S+@\S+\.\S+/;
      return isValid.test(address);
    };
    /**
     * Sets the LN-URL (nostr-store) in the logged in user's profile.
     */
    function setLNUrl() {
      nostrStore.lnURL = lnURL.value;
      nostrStore.saveUser();
    }

    /**
     * Sets the LN-Address (nostr-store) in the logged in user's profile.
     */
    function setLNAddress() {
      nostrStore.lnAddress = lnAddress.value;
      nostrStore.saveUser();
    }

    return {
      lnURL,
      lnAddress,
      isValidUrl,
      isValidAddress,
      setLNUrl,
      setLNAddress,
    };
  },
});
</script>
