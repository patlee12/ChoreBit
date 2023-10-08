<template>
  <div class="pt-5">
    <div style="text-align: center"></div>
    <v-row>
      <v-col align="center">
        <v-btn
          color="primary"
          title="Refresh Chores"
          fab
          x-small
          dark
          @click="clearAndFetchChores()"
        >
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-col>
      <v-col align="center">
        <help-button
          color="primary"
          text="This page shows all your friends chores and your chores. In order to interact with your friends Chores you need to both have eachother added. Navigate to the left menu and click 'Friends List'."
        />
      </v-col>
      <v-col align="center">
        <v-btn
          color="primary"
          title="Create Chore"
          fab
          x-small
          dark
          @click="showCard = true"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </v-col>
    </v-row>
    <v-row v-if="showCard">
      <v-col align="center">
        <v-card
          elevation="6"
          outlined
          shaped
          class="card"
          style="text-align: center"
          dark
        >
          <v-card-title>Create new Chore</v-card-title>

          <v-divider />

          <v-card-text>
            <v-row align="center" class="mx-0">
              <v-col>
                <div class="white--text font-weight-bold">Chore Title</div>
                <div class="ml-1">
                  <v-text-field outlined v-model="name" />
                </div>
              </v-col>
            </v-row>
            <v-row align="center" class="mx-0">
              <v-col>
                <div class="white--text font-weight-bold">Description</div>
                <div class="ml-1">
                  <v-textarea outlined v-model="description" />
                </div>
              </v-col>
            </v-row>

            <v-row align="center" class="mx-0">
              <v-col>
                <div class="white--text font-weight-bold">Reward</div>
                <v-container class="d-flex justify-center">
                  <span class="pl-2"
                    ><v-text-field outlined v-model="reward"
                  /></span>
                  <v-img
                    class="shrink ml-3 mb-6"
                    contain
                    src="../assets/btcLightning.svg.png"
                    width="25"
                  />
                </v-container>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-actions>
            <v-row align="center">
              <v-col>
                <v-btn
                  class="mr-2"
                  rounded
                  small
                  color="green"
                  @click="createChore()"
                  >Create</v-btn
                >
                <v-btn rounded small color="red" @click="showCard = false"
                  >Cancel</v-btn
                >
              </v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col align="center">
        <v-progress-circular
          v-if="nostrStore.loadingChores || loadingList"
          size="120"
          color="primary"
          indeterminate
          >Loading</v-progress-circular
        >
      </v-col>
    </v-row>
    <v-row>
      <v-col align="center" v-for="(chore, index) in choresList" :key="index">
        <v-card elevation="6" outlined shaped class="card" dark>
          <v-card-title class="justify-center" primary-title>
            {{ chore.name }}</v-card-title
          >

          <v-divider />

          <div
            class="modal pt-3"
            v-if="raise && raiseIndex == index && !showQrCode && !paidZap"
          >
            <v-card align="center" outlined shaped dark>
              <div class="white--text font-weight-bold ma-3">Reward</div>

              <v-container class="d-flex justify-center">
                <v-text-field class="text-field ma-3" v-model="raiseAmount" />

                <v-img
                  class="shrink ml-1"
                  contain
                  src="../assets/btcLightning.svg.png"
                  transition="scale-transition"
                  width="18"
                />
              </v-container>
              <v-btn
                class="ma-3"
                color="primary"
                small
                @click="raiseChore(chore)"
                >Boost</v-btn
              >
              <v-btn
                class="ma-3"
                color="red"
                @click="
                  raise = false;
                  raiseIndex = 0;
                "
                small
                >Cancel
              </v-btn>
            </v-card>
          </div>
          <div
            class="modal pt-3"
            v-else-if="
              (raise && raiseIndex == index && showQrCode) ||
              (approve && approveIndex == index && showQrCode)
            "
          >
            <v-card align="center" outlined shaped dark>
              <div class="white--text font-weight-bold ma-3">Pay Invoice</div>

              <v-container class="d-flex justify-center">
                <v-img
                  class="shrink"
                  contain
                  :src="currentQrCode"
                  width="55%"
                />
              </v-container>

              <div class="pt-4 pl-3">
                <v-btn title="Copy to Clipboard" @click="copyInvoice()"
                  ><v-icon color="green darken-2" v-if="copiedInvoice"
                    >mdi-content-save-check
                  </v-icon>
                  <v-icon v-else>mdi-content-copy</v-icon>
                  Copy Invoice
                </v-btn>
              </div>

              <v-btn
                class="ma-3"
                color="red"
                @click="
                  raise = false;
                  approve = false;
                  showQrCode = false;
                  copiedInvoice = false;
                  raiseIndex = 0;
                  approveIndex = 0;
                "
                small
                >Cancel ({{ timer }})
              </v-btn>
            </v-card>
          </div>
          <div
            class="modal pt-3"
            v-else-if="
              (raise && raiseIndex == index && paidZap) ||
              (approve && approveIndex == index && paidZap)
            "
          >
            <v-card align="center" outlined shaped dark>
              <div class="green--text font-weight-bold ma-3">
                Payment Completed
              </div>

              <v-container class="d-flex justify-center">
                <v-icon x-large color="green">mdi-check</v-icon>
              </v-container>
            </v-card>
          </div>

          <div v-else>
            <v-row class="pt-3">
              <v-col align="center">
                <span class="white--text font-weight-bold mr-2">Reward</span>
                <v-container class="d-flex justify-center">
                  {{ chore.reward }}
                  <v-img
                    class="shrink ml-1"
                    src="../assets/btcLightning.svg.png"
                    height="20px"
                    width="20px"
                  /> </v-container
              ></v-col>
              <v-col align="center">
                <div class="white--text font-weight-bold">Status</div>
                <div class="ml-1">
                  <v-icon
                    large
                    class="ma-3"
                    title="Chore Completed (Pending Approval)"
                    v-if="
                      getChoreReply(chore, ChoreStatus.Completed) &&
                      chore.status == ChoreStatus.Completed
                    "
                    color="yellow"
                    >mdi-account-clock</v-icon
                  >
                  <v-icon
                    large
                    class="ma-3"
                    title="Chore Accepted (In-progress)"
                    v-else-if="
                      getChoreReply(chore, ChoreStatus.Accepted) &&
                      chore.status == ChoreStatus.Accepted
                    "
                    color="orange"
                    >mdi-account-hard-hat</v-icon
                  >
                  <v-icon
                    large
                    class="ma-3"
                    title="Chore Approved (Done)"
                    v-else-if="
                      getChoreReply(chore, ChoreStatus.Approved) &&
                      chore.status == ChoreStatus.Approved
                    "
                    color="green"
                    >mdi-check-circle</v-icon
                  >
                  <v-icon
                    large
                    class="ma-3"
                    title="Chore Posted (Available)"
                    color="blue"
                    v-else-if="chore.status == ChoreStatus.Posted"
                    >mdi-briefcase</v-icon
                  >
                  <span v-else>
                    {{ chore.status }}
                  </span>
                </div>
              </v-col>
            </v-row>
            <v-row class="pb-3">
              <v-col align="center">
                <div class="white--text font-weight-bold pt-3">Description</div>
                <span class="overflow-box pl-2">{{ chore.description }}</span>
              </v-col>
            </v-row>

            <v-divider />

            <v-card-text>
              <h3 style="text-align: center">Author</h3>
              <v-row class="card-meta" align="center">
                <v-col align="center">
                  <v-row>
                    <v-col align="center" cols="5">
                      <p>
                        <v-icon large left> mdi-sheep </v-icon>
                        {{
                          getUserProfile(chore.author)?.username || chore.author
                        }}
                      </p>
                      <p class="pl-3">
                        <v-img
                          class="mt-2 mb-1"
                          :src="getUserProfile(chore.author)?.picture"
                          contain
                          height="80px"
                          width="80px"
                        />
                      </p>
                      <p class="pl-3">
                        {{ getUserProfile(chore.author)?.about }}
                      </p>
                    </v-col>
                    <v-col align="center" cols="7">
                      <v-container fill-height fluid>
                        <v-row justify="center">
                          <v-col>
                            <span class="white--text font-weight-bold ma-3">
                              Post Date
                            </span>

                            <span>
                              {{ returnDateTime(chore.created) }}
                            </span>
                          </v-col>
                        </v-row>
                      </v-container>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
              <div
                v-if="
                  getChoreReply(chore, ChoreStatus.Accepted) &&
                  !getChoreReply(chore, ChoreStatus.Completed)
                "
              >
                <v-divider />

                <h3 class="pt-3" style="text-align: center">
                  Chore In-Progess
                </h3>
                <v-row class="card-meta" align="center">
                  <v-col align="center">
                    <v-row>
                      <v-col align="center" cols="5">
                        <p>
                          <v-icon large left> mdi-sheep </v-icon>
                          {{
                            getUserProfile(
                              getChoreReply(chore, ChoreStatus.Accepted)
                                ?.author || ""
                            )?.username ||
                            getChoreReply(chore, ChoreStatus.Accepted)?.author
                          }}
                        </p>
                        <p class="pl-3">
                          <v-img
                            class="mt-2 mb-1"
                            :src="
                              getUserProfile(
                                getChoreReply(chore, ChoreStatus.Accepted)
                                  ?.author || ''
                              )?.picture || ''
                            "
                            contain
                            height="80px"
                            width="80px"
                          />
                        </p>
                        <p class="pl-3">
                          {{
                            getUserProfile(
                              getChoreReply(chore, ChoreStatus.Accepted)
                                ?.author || ""
                            )?.about || ""
                          }}
                        </p>
                      </v-col>
                      <v-col align="center" cols="7">
                        <v-container fill-height fluid>
                          <v-row justify="center">
                            <v-col>
                              <span class="white--text font-weight-bold ma-3">
                                Started
                              </span>

                              <span>
                                {{
                                  returnDateTime(
                                    getChoreReply(chore, ChoreStatus.Accepted)
                                      ?.created || 0
                                  )
                                    ? returnDateTime(
                                        getChoreReply(
                                          chore,
                                          ChoreStatus.Accepted
                                        )?.created || 0
                                      )
                                    : "Unknown"
                                }}
                              </span>
                            </v-col>
                          </v-row>
                        </v-container>
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </div>
              <div v-if="getChoreReply(chore, ChoreStatus.Completed)">
                <v-divider />

                <h3 class="pt-3" style="text-align: center">Chore Completed</h3>
                <v-row class="card-meta" align="center">
                  <v-col align="center">
                    <v-row>
                      <v-col align="center" cols="5">
                        <p>
                          <v-icon large left> mdi-sheep </v-icon>
                          {{
                            getUserProfile(
                              getChoreReply(chore, ChoreStatus.Completed)
                                ?.author || ""
                            )?.username ||
                            getChoreReply(chore, ChoreStatus.Completed)?.author
                          }}
                        </p>
                        <p class="pl-3">
                          <v-img
                            class="mt-2 mb-1"
                            :src="
                              getUserProfile(
                                getChoreReply(chore, ChoreStatus.Completed)
                                  ?.author || ''
                              )?.picture || ''
                            "
                            contain
                            height="80px"
                            width="80px"
                          />
                        </p>
                        <p class="pl-3">
                          {{
                            getUserProfile(
                              getChoreReply(chore, ChoreStatus.Completed)
                                ?.author || ""
                            )?.about || ""
                          }}
                        </p>
                      </v-col>
                      <v-col align="center" cols="7">
                        <v-container fill-height fluid>
                          <v-row justify="center">
                            <v-col>
                              <span class="white--text font-weight-bold ma-3">
                                Completed
                              </span>

                              <span>
                                {{
                                  returnDateTime(
                                    getChoreReply(chore, ChoreStatus.Completed)
                                      ?.created || 0
                                  )
                                    ? returnDateTime(
                                        getChoreReply(
                                          chore,
                                          ChoreStatus.Completed
                                        )?.created || 0
                                      )
                                    : "Unknown"
                                }}
                              </span>
                            </v-col>
                          </v-row>
                        </v-container>
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </div>
            </v-card-text>

            <v-card-actions align="center">
              <v-row>
                <v-col align="center">
                  <v-btn
                    v-if="chore.status == ChoreStatus.Posted"
                    rounded
                    small
                    class="btn"
                    title="Take Chore"
                    color="green"
                    @click="acceptChore(chore.id)"
                    >Accept</v-btn
                  >
                  <!-- <v-btn rounded small color="red">Reject</v-btn> -->
                  <v-btn
                    v-if="
                      chore.status !== ChoreStatus.Approved &&
                      chore.status !== ChoreStatus.Posted &&
                      getChoreReply(chore, ChoreStatus.Accepted)?.author !==
                        nostrStore.pubKey
                    "
                    rounded
                    small
                    color="primary"
                    class="btn"
                    title="Tip Chore Worker"
                    @click="
                      raise = true;
                      raiseIndex = index;
                    "
                    >Boost
                    <v-img
                      contain
                      class="shrink ml-1"
                      src="../assets/btcLightning.svg.png"
                      height="20px"
                      width="20px"
                  /></v-btn>
                  <v-btn
                    v-if="
                      getChoreReply(chore, ChoreStatus.Accepted)?.author ==
                        nostrStore.pubKey &&
                      chore.status == ChoreStatus.Accepted
                    "
                    rounded
                    small
                    class="btn"
                    title="Finish Chore"
                    color="green"
                    @click="completeChore(chore.id, chore.reward, chore.reply)"
                    >Complete</v-btn
                  >
                  <v-btn
                    v-if="
                      nostrStore.pubKey == chore.author &&
                      chore.status === ChoreStatus.Completed
                    "
                    rounded
                    small
                    class="btn"
                    title="Approve Chore for Payout"
                    color="green"
                    @click="
                      approveIndex = index;
                      approveChore(chore);
                    "
                    >Approve</v-btn
                  >
                </v-col>
              </v-row>
            </v-card-actions>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, ref, onMounted } from "vue";
import {
  useNostrStore,
  Chore,
  partialEvent,
  Author,
  ChoreStatus,
  RaisedChoreResult,
  ApproveChoreResult,
} from "../store/nostr-store";
import { nip19, Event } from "nostr-tools";
import HelpButton from "./HelpButton.vue";

export default defineComponent({
  // eslint-disable-next-line vue/multi-word-component-names
  name: "Dashboard",
  components: { HelpButton },
  setup() {
    const nostrStore = computed(() => {
      return useNostrStore();
    });
    const showCard = ref<boolean>(false);
    const name = ref<string>();
    const description = ref<string>();
    const reward = ref<number>();
    const raise = ref<boolean>(false);
    const approve = ref<boolean>(false);
    const showQrCode = ref<boolean>(false);
    const raiseIndex = ref<number>(0);
    const approveIndex = ref<number>(0);
    const raiseAmount = ref<number>(0);
    const qrCode = ref<string>();
    const timer = ref<number>(0);
    const currentQrCode = computed(() => {
      return qrCode.value;
    });
    const paidZap = ref<boolean>(false);
    const copiedInvoice = ref<boolean>(false);
    const currentInvoice = ref<string>("");
    const zapReceipt = ref<Event | null>();
    const zapReceiptCheckInterval = ref();
    const loadingList = ref<boolean>(true);
    const userInfo = ref<Author>(nostrStore.value.UserInfo);
    //needed to use ...[] to copy the state and not just point to it.
    const friends = ref<Author[]>([...nostrStore.value.friends]);
    //A list of your friends including you and your info.
    const userList = computed(() => {
      let users: Author[] = friends.value;
      users.push(userInfo.value);
      return users;
    });

    const choresList = computed((): Chore[] => {
      const chores = nostrStore.value.chores;
      const sortedChores = chores.sort((a, b) => b.created - a.created);
      return sortedChores;
    });

    /**
     * Get the author from the replys based on the status of chore you are looking for.
     * @param chore is the current chore.
     * @param choreStatus is the status within the chore replies you are looking for.
     * @returns the authors pub key. Or ""
     */
    function getChoreReply(chore: Chore, choreStatus: ChoreStatus) {
      return chore.reply.find((reply) => reply.status === choreStatus);
    }

    const newChore = computed((): Partial<Chore> => {
      return {
        name: name.value,
        description: description.value,
        reward: reward.value,
        status: ChoreStatus.Posted,
        reply: [],
      };
    });

    async function clearAndFetchChores() {
      await nostrStore.value.getFriendsProfiles();
      await nostrStore.value.fetchChoreEvents();
    }
    async function createChore() {
      newChore.value.created = Math.floor(Date.now() / 1000);
      newChore.value.author = nostrStore.value.pubKey;
      const choreEvent: partialEvent = {
        to: nostrStore.value.decodedPubKey,
        from: nostrStore.value.decodedPubKey,
        content: JSON.stringify(newChore.value),
      };
      const signedPublicEvent = await nostrStore.value.signPublicEvent(
        choreEvent,
        1,
        [{ key: "ChoreBit", value: ChoreStatus.Posted }]
      );
      await nostrStore.value.publishEvent(signedPublicEvent).then(async () => {
        //add chore to page without forcing a load event
        const addChore: Chore = {
          id: signedPublicEvent.id,
          name: newChore.value.name || "",
          description: newChore.value.description || "",
          status: newChore.value.status || "",
          reply: [],
          originalId: signedPublicEvent.id,
          reward: newChore.value.reward || 0,
          created: signedPublicEvent.created_at,
          author: newChore.value.author || "",
          sig: signedPublicEvent.sig,
        };
        await nostrStore.value.chores.push(addChore);

        showCard.value = false;
        name.value = "";
        description.value = "";
        reward.value = undefined;
      });
    }
    async function acceptChore(choreId: string) {
      await nostrStore.value.acceptChore(choreId);
      await clearAndFetchChores();
    }
    function zapBoostTimer(result: RaisedChoreResult) {
      if (timer.value >= 0) {
        setTimeout(async () => {
          if (timer.value <= 0) {
            clearInterval(zapReceiptCheckInterval.value);
            showQrCode.value = false;
            raise.value = false;
            raiseIndex.value = 0;
            copiedInvoice.value = false;
          } else {
            if (zapReceipt.value) {
              clearInterval(zapReceiptCheckInterval.value);
              timer.value = -1;
              await nostrStore.value.publishEvent(result.event);
              paidZap.value = true;
              showQrCode.value = false;
              copiedInvoice.value = false;

              const choreRewardEvent: Chore = await JSON.parse(
                result.event.content
              );
              await nostrStore.value.hotUpdateChoreReward(
                choreRewardEvent.originalId,
                Number(choreRewardEvent.reward)
              );
              setTimeout(() => {
                paidZap.value = false;
                raise.value = false;
                raiseIndex.value = 0;
              }, 2000);
            } else if (!showQrCode.value) {
              clearInterval(zapReceiptCheckInterval.value);
              timer.value = -1;
              raise.value = false;
              raiseIndex.value = 0;
              copiedInvoice.value = false;
            } else {
              timer.value -= 1;
              zapBoostTimer(result);
            }
          }
        }, 1000);
      }
      if (!showQrCode.value) {
        timer.value = 0;
      }
    }

    async function raiseChore(chore: Chore) {
      const result: RaisedChoreResult | null =
        await nostrStore.value.raiseChore(chore, raiseAmount.value);
      if (result === null) {
        return;
      }
      currentInvoice.value = result.invoice;
      qrCode.value = await generateQRCode(result.invoice);
      showQrCode.value = true;
      timer.value = 30;
      zapReceipt.value = null;
      zapReceiptCheckInterval.value = setInterval(async () => {
        zapReceipt.value = await nostrStore.value.zapReceipt(result.event.id);
      }, 1000);
      zapBoostTimer(result);
    }

    async function generateQRCode(invoice: string) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const QRCode = require("qrcode");
      let genQR = "";
      await QRCode.toDataURL(invoice, function (err: any, url: any) {
        try {
          genQR = url;
        } catch {
          console.log(err);
        }
      });
      return genQR;
    }

    async function completeChore(
      choreId: string,
      reward: number,
      replies: Chore[]
    ) {
      await nostrStore.value.completeChore(choreId, reward, replies);
      await clearAndFetchChores();
    }

    async function approveChore(chore: Chore) {
      approve.value = true;
      const result: ApproveChoreResult | null =
        await nostrStore.value.approveChore(chore);
      if (result === null) {
        return;
      }
      currentInvoice.value = result.invoice;
      qrCode.value = await generateQRCode(result.invoice);
      showQrCode.value = true;
      timer.value = 30;
      zapReceipt.value = null;
      zapReceiptCheckInterval.value = setInterval(async () => {
        zapReceipt.value = await nostrStore.value.zapReceipt(result.event.id);
      }, 1000);
      zapApproveTimer(result);
    }

    function zapApproveTimer(result: ApproveChoreResult) {
      if (timer.value >= 0) {
        setTimeout(async () => {
          if (timer.value <= 0) {
            clearInterval(zapReceiptCheckInterval.value);
            showQrCode.value = false;
            approve.value = false;
            approveIndex.value = 0;
            copiedInvoice.value = false;
          } else {
            if (zapReceipt.value) {
              clearInterval(zapReceiptCheckInterval.value);
              timer.value = -1;
              await nostrStore.value.publishEvent(result.event);
              paidZap.value = true;
              showQrCode.value = false;
              copiedInvoice.value = false;

              const choreApproveEvent: Chore = await JSON.parse(
                result.event.content
              );
              await nostrStore.value.hotUpdateChoreApprove(
                choreApproveEvent.originalId,
                choreApproveEvent
              );
              setTimeout(() => {
                paidZap.value = false;
                approve.value = false;
                approveIndex.value = 0;
              }, 2000);
            } else if (!showQrCode.value) {
              clearInterval(zapReceiptCheckInterval.value);
              timer.value = -1;
              approve.value = false;
              approveIndex.value = 0;
              copiedInvoice.value = false;
            } else {
              timer.value -= 1;
              zapApproveTimer(result);
            }
          }
        }, 1000);
      }
      if (!showQrCode.value) {
        timer.value = 0;
      }
    }

    function getUserProfile(pk: string) {
      const user = userList.value.filter((user) => user.pubkey == pk).pop();
      if (user) {
        return user.profile;
      } else {
        return;
      }
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

    function copyInvoice() {
      navigator.clipboard.writeText(currentInvoice.value);
      copiedInvoice.value = true;
    }
    //intialize page
    onMounted(async () => {
      try {
        await clearAndFetchChores();
      } catch (e) {
        console.log(e);
      } finally {
        loadingList.value = false;
      }
    });

    return {
      nip19,
      showCard,
      name,
      description,
      reward,
      newChore,
      choresList,
      nostrStore,
      clearAndFetchChores,
      getChoreReply,
      createChore,
      acceptChore,
      raiseChore,
      completeChore,
      approveChore,
      getUserProfile,
      raise,
      showQrCode,
      currentQrCode,
      paidZap,
      copiedInvoice,
      zapReceipt,
      raiseAmount,
      loadingList,
      ChoreStatus,
      raiseIndex,
      returnDateTime,
      copyInvoice,
      timer,
      approve,
      approveIndex,
    };
  },
});
</script>
<style scoped>
@media (max-width: 1200px) {
  /* CSS that should be displayed if width is equal to or less than 800px goes here */
  .card {
    width: 80vw;
    min-height: 500px;
    padding: 5px;
    margin-right: 5px;
    border-width: 4px;
    border-color: #353434;
  }
}
@media (min-width: 1200px) {
  .card {
    width: 25vw;
    min-height: 500px;
    padding: 2px;
    border-width: 4px;
    border-color: #353434;
  }
}
.card.modal {
  max-width: 100%;
  max-height: 100%;
}
.card-meta {
  transform: scale(0.9);
}

.btn {
  margin-right: 5px;
}
.text-field {
  max-width: 50px;
}
.overflow-box {
  overflow-y: scroll;
}
</style>
