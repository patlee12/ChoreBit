<template>
  <div class="container" align="center">
    <v-card dark>
      <v-card v-if="showAddFriend" class="mb-3" elevation="5">
        <v-card-title>
          <v-icon large left> mdi-sheep </v-icon>
          <span class="text-h6 font-weight-light">Add Friend</span>
        </v-card-title>
        <v-card-actions>
          <v-row class="ml-10">
            <v-col cols="6" class="text-field">
              <v-text-field
                outlined
                v-model="friendAdd.pubkey"
                class="input"
                label="Enter pubkey"
                hide-details="auto"
              ></v-text-field>
            </v-col>
            <v-col cols="4" class="text-field">
              <v-text-field
                outlined
                v-model="friendAdd.nickname"
                class="input"
                label="Enter nickname"
                hide-details="auto"
              ></v-text-field>
            </v-col>
            <v-col align="center">
              <v-btn class="mt-3 mr-2" color="green" @click="addFriend()"
                >Add</v-btn
              >
              <v-btn
                class="mt-3 mr-2"
                color="red"
                @click="showAddFriend = !showAddFriend"
                >cancel</v-btn
              >
            </v-col>
          </v-row>
        </v-card-actions>
      </v-card>
      <v-card-title class="white--text font-weight-bold">Friends</v-card-title>
      <v-divider></v-divider>

      <div align="center">
        <v-btn
          class="ma-5"
          v-if="!showAddFriend"
          color="primary"
          @click="showAddFriend = !showAddFriend"
          >Add Friend</v-btn
        >
      </div>

      <v-card
        class="mb-1"
        elevation="5"
        dark
        v-for="(friend, index) in friends"
        :key="index"
      >
        <v-card-text>
          <v-row align="center" class="mb-1">
            <v-col align="center">
              <v-icon large left> mdi-sheep </v-icon>
              <span class="text-h6 font-weight-light">{{
                friend.profile.username
              }}</span>
              <v-img
                class="mt-2 mb-1"
                v-if="friend.profile.picture != undefined"
                :src="friend.profile.picture"
                contain
                height="100px"
                width="150px"
              />{{ friend.profile.about }}</v-col
            >
          </v-row>
          <v-row align="center">
            <v-col
              align="center"
              v-if="editMode && selectedIndex == index"
              cols="6"
              class="text-field"
            >
              <v-text-field
                outlined
                v-model="friendUpdate.nickname"
                class="input"
                label="Enter nickname"
                hide-details="auto"
                >Nickname:</v-text-field
              ></v-col
            >
            <v-col
              align="center"
              v-if="editMode && selectedIndex == index"
              cols="6"
              class="text-field"
            >
              <v-text-field
                outlined
                v-model="friendUpdate.pubkey"
                class="input"
                label="Enter pubkey"
                hide-details="auto"
                >Pubkey:</v-text-field
              ></v-col
            >

            <v-col align="center" v-if="selectedIndex != index">
              <v-text-field
                outlined
                v-model="friend.nickname"
                class="input mt-8"
                label="Nickname"
                hide-details="auto"
                disabled
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col align="center" v-if="selectedIndex != index"
              ><v-text-field
                outlined
                v-model="friend.pubkey"
                class="input mt-8"
                label="PubKey"
                hide-details="auto"
                disabled
              ></v-text-field
            ></v-col>
          </v-row>
          <v-row>
            <v-col align="center" v-if="selectedIndex != index" cols="6"
              ><v-text-field
                outlined
                v-model="friend.profile.lnurl"
                class="input mt-8"
                label="LN-URL"
                hide-details="auto"
                disabled
              ></v-text-field
            ></v-col>
            <v-col align="center" v-if="selectedIndex != index" cols="6"
              ><v-text-field
                outlined
                v-model="friend.profile.ln_address"
                class="input mt-8"
                label="LN-Address"
                hide-details="auto"
                disabled
              ></v-text-field
            ></v-col>
          </v-row>
          <v-row>
            <v-col align="center">
              <v-btn
                v-if="editMode && selectedIndex == index"
                color="green"
                @click="editFriend(index)"
                >Save</v-btn
              >
              <v-btn
                v-if="selectedIndex != index"
                color="primary"
                class="ma-1"
                @click="setEditMode(index, friend)"
                >Edit</v-btn
              >
              <v-btn color="red" class="ma-1" @click="cancelEditMode()" v-else>
                Cancel
              </v-btn>

              <v-btn
                v-if="selectedIndex != index"
                align="center"
                class="ma-1"
                color="red"
                @click="removeFriend(index)"
                >Remove</v-btn
              >
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-card>
  </div>
</template>
<style scoped>
@media (max-width: 600px) {
  /* CSS that should be displayed if width is equal to or less than 800px goes here */
  .container {
    padding: 5px;
    width: 80vw;
  }
}
@media (min-width: 1000px) {
  .container {
    width: 30vw;
  }
}
.text-field {
  margin-bottom: 10px;
  width: 50%;
}
</style>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import { useNostrStore, Author } from "../store/nostr-store";

export default defineComponent({
  name: "AddFriendsPage",

  setup() {
    const nostrStore = useNostrStore();
    onMounted(async () => {
      await nostrStore.getFriendsProfiles();
    });
    const friends = ref<Author[]>(nostrStore.friends);
    const friendAdd = ref<Author>({
      pubkey: "",
      nickname: "",
      profile: { username: "", about: "", picture: undefined },
    });
    const friendUpdate = ref<Author>({
      pubkey: "",
      nickname: "",
      profile: { username: "", about: "", picture: undefined },
    });
    const selectedIndex = ref<number>();
    const editMode = ref<boolean>(false);
    const showAddFriend = ref<boolean>(false);

    function setEditMode(rowIndex: number, author: Author) {
      editMode.value = !editMode.value;
      selectedIndex.value = rowIndex;
      friendUpdate.value.nickname = author.nickname;
      friendUpdate.value.pubkey = author.pubkey;
    }

    function cancelEditMode() {
      editMode.value = !editMode.value;
      selectedIndex.value = undefined;
      friendUpdate.value = {
        pubkey: "",
        nickname: "",
        profile: { username: "", about: "", picture: undefined },
      };
    }

    async function addFriend() {
      await nostrStore.addFriend(friendAdd.value);
      friendAdd.value = {
        pubkey: "",
        nickname: "",
        profile: { username: "", about: "", picture: undefined },
      };
      showAddFriend.value = !showAddFriend.value;
      await nostrStore.getFriendsProfiles();
      await nostrStore.fetchChoreEvents();
    }
    async function editFriend(friendInd: number) {
      await nostrStore.editFriend(friendInd, friendUpdate.value);
      editMode.value = !editMode.value;
      selectedIndex.value = undefined;
      friendUpdate.value = {
        pubkey: "",
        nickname: "",
        profile: { username: "", about: "", picture: undefined },
      };
      await nostrStore.getFriendsProfiles();
      await nostrStore.fetchChoreEvents();
    }
    async function removeFriend(index: number) {
      await nostrStore.removeFriend(index);
      await nostrStore.getFriendsProfiles();
      await nostrStore.fetchChoreEvents();
    }
    return {
      nostrStore,
      friends,
      friendAdd,
      showAddFriend,
      addFriend,
      removeFriend,
      editFriend,
      setEditMode,
      cancelEditMode,
      selectedIndex,
      friendUpdate,
      editMode,
    };
  },
});
</script>
