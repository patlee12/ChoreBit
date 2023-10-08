<template>
  <v-container class="container">
    <div v-if="nostrStore.privKey != '' && !nostrStore.isLoading">
      <v-card dark>
        <v-card-title class="white--text font-weight-bold"
          >Profile</v-card-title
        >
        <v-divider></v-divider>
        <v-card elevation="5" dark>
          <v-card-text>
            <div v-if="editInfo">
              <v-row align="center">
                <v-col align="center">
                  <v-text-field
                    v-model="profile.picture"
                    class="input"
                    label="Enter URL"
                    hide-details="auto"
                    outlined
                  ></v-text-field>
                </v-col>
                <v-col align="center">
                  <v-text-field
                    v-model="profile.username"
                    class="input"
                    label="Enter Username"
                    hide-details="auto"
                    outlined
                  ></v-text-field>
                </v-col>
                <v-col align="center">
                  <v-text-field
                    v-model="publicKey"
                    class="input"
                    label="PubKey"
                    hide-details="auto"
                    disabled
                    outlined
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row align="center">
                <v-col align="center">
                  <v-text-field
                    v-model="profile.about"
                    class="input"
                    label="Enter about info"
                    hide-details="auto"
                    outlined
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row align="center">
                <v-col align="center">
                  <v-btn rounded color="green" @click="updateProfile()"
                    >Save</v-btn
                  >
                  <v-btn
                    class="ma-2"
                    rounded
                    color="red"
                    @click="editInfo = !editInfo"
                    >Cancel</v-btn
                  >
                </v-col>
              </v-row>
            </div>
            <div v-else>
              <v-row align="center">
                <v-col cols="4" align="center">
                  <v-icon large left> mdi-sheep </v-icon>
                  <span class="text-h6 font-weight-light">
                    {{ nostrStore.UserInfo.profile.username }}
                  </span>
                  <v-img
                    class="mt-2 mb-1"
                    v-if="profilePic != undefined"
                    :src="nostrStore.UserInfo.profile.picture"
                    contain
                    height="100px"
                    width="150px"
                  />{{ nostrStore.UserInfo.profile.about }}
                </v-col>
                <v-col>
                  <v-text-field
                    v-model="publicKey"
                    class="input"
                    label="PubKey"
                    hide-details="auto"
                    outlined
                    disabled
                  ></v-text-field>
                  <div class="pt-4 pl-3">
                    <v-btn title="Copy to Clipboard" @click="copyPubkey()"
                      ><v-icon color="green darken-2" v-if="copiedPubkey"
                        >mdi-content-save-check</v-icon
                      >
                      <v-icon v-else>mdi-content-copy</v-icon></v-btn
                    >
                  </div>
                </v-col>
              </v-row>
              <v-row align="center">
                <v-col align="center">
                  <v-text-field
                    v-model="lnURL"
                    class="input"
                    label="LN-URL"
                    hide-details="auto"
                    outlined
                    disabled
                  ></v-text-field>

                  <div class="pt-4 pl-3">
                    <v-btn title="Copy to Clipboard" @click="copyLnUrl()"
                      ><v-icon color="green darken-2" v-if="copiedLnUrl"
                        >mdi-content-save-check</v-icon
                      >
                      <v-icon v-else>mdi-content-copy</v-icon></v-btn
                    >
                  </div>
                </v-col>
                <v-col align="center">
                  <v-text-field
                    v-model="lnAddress"
                    class="input"
                    label="LN-Address"
                    hide-details="auto"
                    disabled
                    outlined
                  ></v-text-field>

                  <div class="pt-4 pl-3">
                    <v-btn title="Copy to Clipboard" @click="copyLnAddress()"
                      ><v-icon color="green darken-2" v-if="copiedLnAddress"
                        >mdi-content-save-check</v-icon
                      >
                      <v-icon v-else>mdi-content-copy</v-icon></v-btn
                    >
                  </div>
                </v-col>
              </v-row>
              <v-row align="center">
                <v-col align="center">
                  <v-btn rounded color="primary" @click="editInfo = true"
                    >Edit</v-btn
                  >
                </v-col>
              </v-row>
            </div>
          </v-card-text>
        </v-card>
      </v-card>
    </div>
    <div v-else>
      <v-card class="card" dark>
        <v-card-title class="white--text font-weight-bold">Login</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row class="m-2">
            <v-col align="center">
              <v-progress-circular
                v-if="nostrStore.isLoading"
                indeterminate
                size="120"
                color="primary"
                >Loading</v-progress-circular
              >
            </v-col>
          </v-row>
          <v-row align="center" class="m-2">
            <v-col align="center">
              <div class="text-field">
                <v-text-field
                  v-model="privateKey"
                  class="input"
                  label="Enter Private Key"
                  hide-details="auto"
                  outlined
                  :type="privateKey ? 'password' : 'text'"
                ></v-text-field>
              </div>
              <v-btn rounded color="primary" class="mt-3 ml-3" @click="login()"
                >Login</v-btn
              >
              <v-btn
                title="Generates new Private/Public Keys"
                rounded
                color="green"
                class="mt-3 ml-3"
                @click="generateNewPk()"
                >New Account</v-btn
              >
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>
<style scoped>
@media (max-width: 600px) {
  /* CSS that should be displayed if width is equal to or less than 800px goes here */
  .container {
    width: 86vw;
  }
}
@media (min-width: 1000px) {
  .container {
    width: 100vw;
  }
}
.card {
  min-height: 200px;
}
.text-field {
  width: 50%;
  margin: 5px;
}
</style>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import router from "../router/index";
import { Profile, Author, useNostrStore } from "../store/nostr-store";
import { generatePrivateKey, getPublicKey, nip19 } from "nostr-tools";

export default defineComponent({
  name: "ProfilePage",

  setup() {
    const nostrStore = useNostrStore();
    const privateKey = ref<string>("");
    const generatedKey = ref<boolean>(false);
    const publicKey = computed<string>(() => {
      return nostrStore.pubKey;
    });
    const lnURL = computed<string>(() => {
      return nostrStore.lnURL;
    });
    const lnAddress = computed<string>(() => {
      return nostrStore.lnAddress;
    });
    const userName = computed<string>(() => {
      return nostrStore.UserInfo.profile.username;
    });
    const about = computed<string>(() => {
      return nostrStore.UserInfo.profile.about;
    });
    const profilePic = computed<URL | undefined>(() => {
      return nostrStore.UserInfo.profile.picture;
    });
    const userInfo = computed<Author>(() => {
      return nostrStore.UserInfo;
    });
    const profile = ref<Profile>({
      username: userName.value,
      about: about.value,
      picture: profilePic.value,
    });
    const editInfo = ref<boolean>(false);
    const copiedPubkey = ref<boolean>(false);
    const copiedLnUrl = ref<boolean>(false);
    const loggedIn = ref<boolean>(false);
    const copiedLnAddress = ref<boolean>(false);

    function copyPubkey() {
      navigator.clipboard.writeText(publicKey.value);
      copiedPubkey.value = true;
    }

    function copyLnUrl() {
      navigator.clipboard.writeText(lnURL.value);
      copiedLnUrl.value = true;
    }

    function copyLnAddress() {
      navigator.clipboard.writeText(lnAddress.value);
      copiedLnAddress.value = true;
    }

    function generateNewPk() {
      privateKey.value = nip19.nsecEncode(generatePrivateKey());
      generatedKey.value = true;
      login();
    }
    function login() {
      nostrStore.privKey = privateKey.value;
      const pubKey = getPublicKey(
        nip19.decode(privateKey.value).data.toString()
      );
      const nPub = nip19.npubEncode(pubKey);
      nostrStore.pubKey = nPub;
      if (generatedKey.value) {
        localStorage["params"] = JSON.stringify({
          key: nostrStore.privKey,
        });
        const routeData = router.resolve({
          name: "backup",
        });
        window.open(routeData.href, "_blank");
      }
      nostrStore.getUser();
      watch(userInfo, () => {
        profile.value = {
          username: nostrStore.UserInfo.profile.username,
          about: nostrStore.UserInfo.profile.about,
          picture: nostrStore.UserInfo.profile.picture,
        };
      });
    }
    function updateProfile() {
      nostrStore.username = profile.value.username;
      nostrStore.about = profile.value.about;
      nostrStore.profilePic = profile.value.picture;

      nostrStore.saveUser();
      editInfo.value = false;
    }
    return {
      nostrStore,
      privateKey,
      editInfo,
      publicKey,
      userName,
      about,
      profilePic,
      profile,
      generateNewPk,
      copyPubkey,
      copyLnUrl,
      copyLnAddress,
      copiedLnUrl,
      copiedLnAddress,
      copiedPubkey,
      login,
      updateProfile,
      lnURL,
      lnAddress,
    };
  },
});
</script>
