<template>
  <div :key="`${store.forceUpdate}`">
    <div v-if="friends.length < 1">Must add a friend to use chat.</div>
    <div v-else>
      <v-container class="messenger">
        <v-row class="no-gutters">
          <v-col cols="5" sm="4" style="border-right: 1px solid #0000001f">
            <v-responsive class="overflow-y-auto fill-height" height="600">
              <v-list subheader>
                <v-list-item-group v-model="activeChat">
                  <div v-for="(friend, index) in friends" :key="friend.pubkey">
                    <v-list-item
                      ref="friendsList"
                      :value="friend"
                      @click="selectFriend(friend)"
                    >
                      <v-list-item-avatar color="grey lighten-1 white--text">
                        <v-icon> mdi-message </v-icon>
                      </v-list-item-avatar>
                      <v-list-item-content>
                        <v-list-item-title>{{
                          friend.nickname || ""
                        }}</v-list-item-title>
                        <v-list-item-subtitle>{{
                          friend.pubkey
                        }}</v-list-item-subtitle>
                      </v-list-item-content>
                      <v-list-item-icon>
                        <v-icon color=" deep-purple accent-4">
                          mdi-message-alert
                        </v-icon>
                      </v-list-item-icon>
                    </v-list-item>
                    <v-divider :key="`chatDivider${index}`" class="my-0" />
                  </div>
                </v-list-item-group>
              </v-list>
            </v-responsive>
          </v-col>
          <v-col cols="7">
            <v-responsive
              v-if="activeChat"
              class="overflow-y-hidden fill-height"
              width="1000"
              height="600"
            >
              <v-card
                v-if="isLoading"
                flat
                class="d-flex flex-column fill-height"
              >
                <v-progress-circular
                  align="center"
                  v-if="isLoading"
                  :size="300"
                  color="primary"
                  indeterminate
                ></v-progress-circular>
              </v-card>
              <v-card
                :key="friends.length"
                v-else
                flat
                class="d-flex flex-column fill-height"
              >
                <v-progress-circular
                  align="center"
                  v-if="isLoading"
                  :size="300"
                  color="primary"
                  indeterminate
                ></v-progress-circular>
                <v-card-title>
                  {{ currentFriend.nickname || "" }}
                  <span class="ml-3">
                    <v-btn
                      title="Edit contact info"
                      x-small
                      fab
                      to="friends"
                      @click="emit('input')"
                      ><v-icon>mdi-information-box</v-icon></v-btn
                    >
                  </span>
                </v-card-title>
                <v-card-text
                  id="chat"
                  ref="chat"
                  class="flex-grow-1 overflow-y-auto"
                >
                  <div
                    v-for="msg in mergeSortMessages"
                    :key="msg.id"
                    class="text-message"
                  >
                    <div
                      v-if="
                        (msg.to == currentFriendDecodedPubKey &&
                          msg.from == myPubkey) ||
                        (msg.to == myPubkey &&
                          msg.from == currentFriendDecodedPubKey)
                      "
                      :class="{
                        'd-flex flex-row-reverse': msg.from == myPubkey,
                      }"
                    >
                      <v-chip
                        :color="msg.from == myPubkey ? 'blue' : ''"
                        style="
                          word-break: keep-all;
                          width: auto;
                          height: auto;
                          font-size: 1rem;
                        "
                        class="text-wrap pa-4 mb-2"
                      >
                        {{ msg.content }}

                        <sub
                          align="right"
                          class="pl-1"
                          style="height: auto; font-size: 0.6rem"
                        >
                          {{ returnDateTime(msg.received) }}
                        </sub>
                      </v-chip>
                    </div>
                  </div>
                  <div class="pt-10"></div>
                </v-card-text>
                <v-card-text class="flex-shrink-1">
                  <v-text-field
                    ref="typingBox"
                    v-model="newMessage.content"
                    label="Type Message"
                    type="text"
                    no-details
                    outlined
                    append-outer-icon="mdi-send"
                    @keyup.enter="sendMessage()"
                    @click:append-outer="sendMessage()"
                    clearable
                    clear
                    hide-details
                  />
                </v-card-text>
              </v-card>
            </v-responsive>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted } from "vue";
import {
  useNostrStore,
  Author,
  DirectMessage,
  partialDirectMessage,
} from "../store/nostr-store";
import { nip19 } from "nostr-tools";

export default defineComponent({
  // eslint-disable-next-line vue/multi-word-component-names
  name: "Messenger",
  setup(_, { emit }) {
    const activeChat = ref(true);
    const friendsList = ref();
    const isLoading = ref(false);
    const typingBox = ref<HTMLElement>();
    const chat = ref<HTMLElement>();

    const store = computed(() => {
      return useNostrStore();
    });
    const friends = computed<Author[]>(() => {
      return store.value.friends;
    });
    const decodedFriends = computed<Author[]>(() => {
      return store.value.decodedFriends;
    });
    const currentFriend = ref<Author>(friends.value[0]);

    const currentFriendDecodedPubKey = computed<string>(() => {
      return nip19.decode(currentFriend.value.pubkey).data.toString();
    });
    const myPubkey = ref<string>(store.value.decodedPubKey);

    async function getMessages() {
      isLoading.value = true;
      await store.value
        .querryAllDirectMessages()
        .then(() => {
          isLoading.value = false;
        })
        .catch((error) => {
          console.log(`Error getting messages ${error}`);
        });
    }

    const mergeSortMessages = computed<DirectMessage[]>(() => {
      let result = [
        ...store.value.receivedMessages,
        ...store.value.sentMessages,
      ];
      const sortedMessages = result.sort((a, b) => a.received - b.received);
      return sortedMessages;
    });

    const newMessage = ref<partialDirectMessage>({
      to: "",
      from: "",
      content: "",
    });

    async function sendMessage() {
      newMessage.value.to = currentFriendDecodedPubKey.value;
      newMessage.value.from = myPubkey.value;
      await store.value.sendDirectMessage(newMessage.value);
      newMessage.value.content = "";
    }

    function returnDateTime(createdAt: number) {
      const date = new Date(createdAt * 1000);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      // Hours part from the timestamp
      const hours = date.getHours();
      // Minutes part from the timestamp
      const minutes = "0" + date.getMinutes();
      // Seconds part from the timestamp
      const seconds = "0" + date.getSeconds();
      // Will display time in 10:30:23 format
      const formattedTime =
        month + "/" + day + "@" + hours + ":" + minutes + ":" + seconds;

      return formattedTime;
    }

    function scrollDownChat() {
      const getMessages = Array(
        document.getElementsByClassName("text-message")
      );
      console.log(getMessages);

      if (getMessages != null) {
        console.log(getMessages);
        // getMessages[0].scroll({
        //   top: chat!.scrollHeight,
        //   behavior: "smooth",
        // });
      }
    }

    function selectFriend(friend: Author) {
      currentFriend.value = friend;
      scrollDownChat();
    }
    getMessages();
    scrollDownChat();

    watch(mergeSortMessages, () => {
      scrollDownChat();
    });

    return {
      activeChat,
      isLoading,
      friends,
      decodedFriends,
      currentFriend,
      currentFriendDecodedPubKey,
      mergeSortMessages,
      newMessage,
      myPubkey,
      chat,
      store,
      typingBox,
      sendMessage,
      returnDateTime,
      emit,
      selectFriend,
      friendsList,
    };
  },
});
</script>
<style scoped>
.messenger {
  width: 50vw;
}
@media (max-width: 1000px) {
  /* CSS that should be displayed if width is equal to or less than 800px goes here */
  .messenger {
    width: 130vw;
    transform-origin: top left;
    transform: scale(0.6);
  }
}
</style>
