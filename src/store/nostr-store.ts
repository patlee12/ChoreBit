import { defineStore } from "pinia";
import { ref, Ref, computed } from "vue";
import {
  Event,
  Sub,
  UnsignedEvent,
  getEventHash,
  signEvent,
  SimplePool,
  verifySignature,
  nip04,
  nip19,
  nip57,
} from "nostr-tools";

export type Tag = {
  key: string;
  value?: string;
  eventId?: string;
  relayURL?: string;
  marker?: string;
};
export type Chore = {
  id: string;
  name: string;
  description: string;
  status: string;
  reply: Chore[];
  originalId: string;
  reward: number;
  created: number;
  author: string;
  sig: string;
};
export type Author = {
  pubkey: string;
  nickname: string;
  profile: Profile;
};
export type DirectMessage = {
  id: string;
  to: string;
  from: string;
  content: string;
  received: number;
};
export type partialDirectMessage = {
  to: string;
  from: string;
  content: string;
};
export type partialEvent = {
  to: string;
  from: string;
  content: string;
};
export type DirectMessageJSON = {
  content: string;
  peerPubkey: string;
};
export type Profile = {
  username: string;
  about: string;
  picture: URL | undefined;
  lnurl?: string;
  ln_address?: string;
};
export type User = {
  friends: Author[];
  relays: string[];
  profile?: Profile;
};
export enum ChoreStatus {
  Accepted = "Accepted",
  Raise = "Raise",
  Completed = "Completed",
  Approved = "Approved",
  Posted = "Posted",
}
export interface RaisedChoreResult {
  invoice: string;
  event: Event;
}
export interface ApproveChoreResult {
  invoice: string;
  event: Event;
}

export const useNostrStore = defineStore("nostr", () => {
  //Add default open and public relays here if necessary
  const relays = ref<string[]>([
    "wss://relay.damus.io",
    "wss://nostr-pub.wellorder.net",
    "wss://nostr.mom",
  ]);
  const pool = ref<SimplePool>();
  pool.value = new SimplePool();

  const UserInfo = computed<Author>(() => {
    return {
      pubkey: pubKey.value,
      nickname: username.value,
      profile: {
        username: username.value,
        about: about.value,
        picture: profilePic.value,
        lnurl: lnURL.value,
      },
    };
  });
  const username = ref<string>("");
  const about = ref<string>("");
  const profilePic = ref<URL>();
  const lnURL = ref<string>("");
  const lnAddress = ref<string>("");
  const privKey = ref<string>("");
  const decodedPrivKey = computed<string>(() => {
    return nip19.decode(privKey.value).data.toString();
  });
  const pubKey = ref<string>("");
  const decodedPubKey = computed<string>(() => {
    return nip19.decode(pubKey.value).data.toString();
  });
  const ids = ref<string[]>([]);
  const friends = ref<Author[]>([]);
  const decodedFriends = computed<Author[]>(() => {
    const decodedFriendArray: Author[] = friends.value.map((friend) => {
      const decodeNPub = nip19.decode(friend.pubkey.toString()).data.toString();
      return {
        nickname: friend.nickname,
        pubkey: decodeNPub,
        profile: friend.profile,
      };
    });
    return decodedFriendArray;
  });
  const choreEvents = ref<Event[]>([]);
  const directMessageEvents = ref<Event[]>([]);
  const receivedMessages = ref<DirectMessage[]>([]);
  const sentMessages = ref<DirectMessage[]>([]);
  const chores = ref<Chore[]>([]);
  const getProfile = ref();
  const isLoading = ref<boolean>(false);
  const loadingChores = ref<boolean>(false);
  const directMessageSub = ref<Sub>();
  const forceUpdate = ref<boolean>(false);

  async function resetState() {
    directMessageSub.value = undefined;
    relays.value = [];
    pool.value = new SimplePool();
    username.value = "";
    about.value = "";
    profilePic.value = undefined;
    lnURL.value = "";
    lnAddress.value = "";
    privKey.value = "";
    pubKey.value = "";
    ids.value = [];
    friends.value = [];
    choreEvents.value = [];
    directMessageEvents.value = [];
    receivedMessages.value = [];
    sentMessages.value = [];
    chores.value = [];
    getProfile.value = undefined;
  }
  /**
   * Querry Chore Events from all relays
   */
  async function fetchChoreEvents() {
    if (pool.value !== undefined) {
      loadingChores.value = true;
      await choreEvents.value.splice(0);
      await chores.value.splice(0);
      const authorList = await decodedFriends.value.map(
        (friend) => friend.pubkey
      );
      await authorList.push(decodedPubKey.value);
      const subscriber = await pool.value.sub(
        [...relays.value],
        [
          {
            authors: authorList,
            kinds: [1],
          },
        ]
      );

      await subscriber.on("event", async (event: Event) => {
        if (verifySignature(event)) {
          if (await event.tags.find(([value]) => value === "ChoreBit")) {
            addEvent(event, choreEvents);
          } else {
            return;
          }
        } else {
          console.log(`Discarded Unverified Event::${event}`);
        }
      });
      await subscriber.on("eose", async () => {
        await processChoreEvents();
        loadingChores.value = false;
        subscriber.unsub();
      });
    } else {
      console.log(`Relays list cannot be empty.`);
    }
  }
  /**
   * A function that processes all types of chore events and replies so that that most updated chores[] can be accessed from the store.
   */
  async function processChoreEvents() {
    const choreReplies: Chore[] = [];
    const sortedChoreEvents = await choreEvents.value.sort(
      (a, b) => a.created_at - b.created_at
    );
    await sortedChoreEvents.forEach((event) => {
      //Pull content from events
      const extractContent = JSON.parse(event.content);
      const extractChore: Chore = extractContent;
      if (extractChore.reply !== undefined && extractChore !== undefined) {
        extractChore.id = event.id;
        extractChore.sig = event.sig;
        //For accepted replies
        if (
          event.tags.find(
            ([key, value]) => key == "ChoreBit" && value === "Accepted"
          )?.[0] &&
          event.tags.find(
            ([key, eventId, relayURL, marker]) =>
              key == "e" && eventId !== "" && marker == "reply"
          )?.[1]
        ) {
          extractChore.author = nip19.npubEncode(event.pubkey);
          choreReplies.push(extractChore);
        }
        //For replies that Raise chore reward
        else if (
          event.tags.find(
            ([key, value]) => key == "ChoreBit" && value === "Raise"
          )?.[0] &&
          event.tags.find(
            ([key, eventId, relayURL, marker]) =>
              key == "e" && eventId !== "" && marker == "reply"
          )?.[1]
        ) {
          extractChore.author = nip19.npubEncode(event.pubkey);
          choreReplies.push(extractChore);
        }
        //For replies that Complete chores
        else if (
          event.tags.find(
            ([key, value]) => key == "ChoreBit" && value === "Completed"
          )?.[0] &&
          event.tags.find(
            ([key, eventId, relayURL, marker]) =>
              key == "e" && eventId !== "" && marker == "reply"
          )?.[1]
        ) {
          extractChore.author = nip19.npubEncode(event.pubkey);
          choreReplies.push(extractChore);
        }
        //For replies that Approve chores
        else if (
          event.tags.find(
            ([key, value]) => key == "ChoreBit" && value === "Approved"
          )?.[0] &&
          event.tags.find(
            ([key, eventId, relayURL, marker]) =>
              key == "e" && eventId !== "" && marker == "reply"
          )?.[1]
        ) {
          extractChore.author = nip19.npubEncode(event.pubkey);
          choreReplies.push(extractChore);
        }
        //All other chores including new posted
        else {
          extractChore.originalId = event.id;
          chores.value.push(extractChore);
        }
      } else {
        console.log(`Chore is missing data${event}`);
        return;
      }
    });
    //Process all reply events by adding them to original "posted" chore events.
    await choreReplies.forEach((choreReply) => {
      const lookupInd = chores.value.findIndex(
        (chore) => chore.id == choreReply.originalId
      );
      if (lookupInd != -1) {
        //update chore with reply info

        if (choreReply.status == "Raise") {
          const originalReward = Number(chores.value[lookupInd].reward);
          const replyAward = Number(choreReply.reward);
          chores.value[lookupInd].reward = originalReward + replyAward;
          chores.value[lookupInd].reply.push(choreReply);
        }
        if (choreReply.status === "Accepted") {
          chores.value[lookupInd].status = choreReply.status;
          chores.value[lookupInd].reply.push(choreReply);
        }
        if (choreReply.status === "Completed") {
          chores.value[lookupInd].reply.push(choreReply);
          chores.value[lookupInd].status = choreReply.status;
        }
        if (choreReply.status === "Approved") {
          chores.value[lookupInd].reply.push(choreReply);
          chores.value[lookupInd].status = choreReply.status;
        }
      }
    });
  }
  /**
   * Raise/boost chore.
   * @param chore chore event that is used to create raise/boost event.
   * @returns {object} an object that contains a lightning invoice and signed raised/boost NOSTR Event.
   */
  async function raiseChore(
    chore: Chore,
    amount: number
  ): Promise<RaisedChoreResult | null> {
    if (pool.value === undefined) {
      console.log(
        "NOSTR Relay Pool is undefined. Try adding more relays to connect."
      );
      return null;
    }
    let invoice = "";
    let signedEvent = undefined;
    //Lookup Accepted Chore Event
    const acceptedChore = chore.reply.find(
      (reply) => reply.status === ChoreStatus.Accepted
    );
    if (acceptedChore) {
      //Get event from relay pool to verify signature before zap.
      const getAcceptedChoreEvent: Event | null = await pool.value.get(
        relays.value,
        {
          ids: [acceptedChore.id],
        }
      );
      if (
        getAcceptedChoreEvent !== null &&
        verifySignature(getAcceptedChoreEvent)
      ) {
        const chore: Chore = JSON.parse(getAcceptedChoreEvent.content);
        const getOriginalChorePost: Event | null = await pool.value.get(
          relays.value,
          {
            ids: [chore.originalId],
          }
        );
        if (
          getOriginalChorePost !== null &&
          verifySignature(getOriginalChorePost)
        ) {
          chore.status = "Raise";
          chore.reward = amount;
          const raiseChoreEvent: partialEvent = {
            to: getOriginalChorePost?.pubkey || decodedPubKey.value,
            from: decodedPubKey.value,
            content: JSON.stringify(chore),
          };
          const tags: Tag[] = [
            { key: "ChoreBit", value: "Raise" },
            {
              key: "e",
              eventId: getOriginalChorePost.id,
              marker: "reply",
            },
          ];
          signedEvent = await signPublicEvent(raiseChoreEvent, 1, tags);
          //Add this line of code to run after zap receipt is confirmed
          // await publishEvent(signedEvent);

          //Below Section for adding a zapRequest Nip57
          //PK for Zaprequest found from accepted chore event.
          const profile: Event | null | undefined = await getUserProfile(
            getAcceptedChoreEvent.pubkey
          );
          if (profile) {
            invoice = await zapRequest(
              profile,
              JSON.stringify(signedEvent),
              amount,
              "Chore Boost"
            );
          } else {
            console.log(
              "Profile not found unable to Zap. Make sure you have users relays added."
            );
          }
          return { invoice: invoice, event: signedEvent };
        } else {
          console.log("Unable to verify signature on Original Chore Event.");
        }
      } else {
        console.log("Unable to verify signature on accepted Chore Event.");
      }
    } else {
      console.log(
        "Chore cannot be Boosted/Zapped since it hasn't been started by anyone."
      );
    }
    return null;
  }

  /**
   * Accept chore by ID.
   * @param choreId string id for chore. AKA nostr event id.
   */
  async function acceptChore(choreId: string) {
    if (pool.value !== undefined) {
      const subscriber = await pool.value.sub(
        [...relays.value],
        [
          {
            ids: [choreId],
          },
        ]
      );
      //Lookup chore by ID
      await subscriber.on("event", async (event: Event) => {
        if (verifySignature(event)) {
          if (await event.tags.find(([value]) => value === "ChoreBit")) {
            //Use orginal chore to make Chore Reply
            const chore: Chore = JSON.parse(event.content);
            chore.status = "Accepted";
            chore.originalId = event.id;
            chore.created = Math.floor(Date.now() / 1000);
            chore.reward =
              chores.value.find((chore) => chore.id == choreId)?.reward ||
              chore.reward;
            const acceptedChoreEvent: partialEvent = {
              to: decodedPubKey.value,
              from: decodedPubKey.value,
              content: JSON.stringify(chore),
            };
            const tags: Tag[] = [
              { key: "ChoreBit", value: "Accepted" },
              { key: "e", eventId: event.id, marker: "reply" },
            ];
            const signedEvent = await signPublicEvent(
              acceptedChoreEvent,
              1,
              tags
            );

            await publishEvent(signedEvent);
          } else {
            return;
          }
        } else {
          console.log(`Discarded Unverified Event::${event}`);
        }
      });
      await subscriber.on("eose", () => {
        subscriber.unsub();
      });
    }
  }
  /**
   * Complete chore by ID.
   * @param choreId string id for chore. AKA nostr event id.
   */
  async function completeChore(
    choreId: string,
    reward: number,
    replies: Chore[]
  ) {
    if (pool.value !== undefined) {
      const subscriber = await pool.value.sub(
        [...relays.value],
        [
          {
            ids: [choreId],
          },
        ]
      );
      //Lookup chore by ID
      await subscriber.on("event", async (event: Event) => {
        if (verifySignature(event)) {
          if (await event.tags.find(([value]) => value === "ChoreBit")) {
            //Use orginal chore to make Chore Reply
            const chore: Chore = JSON.parse(event.content);
            chore.status = "Completed";
            chore.created = Math.floor(Date.now() / 1000);
            chore.originalId = event.id;
            chore.reward = reward;
            chore.reply = replies;
            const completedChoreEvent: partialEvent = {
              to: decodedPubKey.value,
              from: decodedPubKey.value,
              content: JSON.stringify(chore),
            };
            const tags: Tag[] = [
              { key: "ChoreBit", value: "Completed" },
              { key: "e", eventId: event.id, marker: "reply" },
            ];
            const signedEvent = await signPublicEvent(
              completedChoreEvent,
              1,
              tags
            );

            await publishEvent(signedEvent);
          } else {
            return;
          }
        } else {
          console.log(`Discarded Unverified Event::${event}`);
        }
      });
      await subscriber.on("eose", () => {
        subscriber.unsub();
      });
    }
  }

  /**
   * Approve and payout chore.
   * @param chore chore event that is used to create raise/boost event.
   * @returns {object} an object that contains a lightning invoice and signed approve Chore NOSTR Event.
   */
  async function approveChore(
    chore: Chore
  ): Promise<ApproveChoreResult | null> {
    if (pool.value === undefined) {
      console.log(
        "NOSTR Relay Pool is undefined. Try adding more relays to connect."
      );
      return null;
    }
    let invoice = "";
    let signedEvent = undefined;
    //Lookup Accepted Chore Event
    const acceptedChore = chore.reply.find(
      (reply) => reply.status === ChoreStatus.Accepted
    );
    if (acceptedChore) {
      //Get event from relay pool to verify signature before zap.
      const getAcceptedChoreEvent: Event | null = await pool.value.get(
        relays.value,
        {
          ids: [acceptedChore.id],
        }
      );
      if (
        getAcceptedChoreEvent !== null &&
        verifySignature(getAcceptedChoreEvent)
      ) {
        const approvedChore: Chore = JSON.parse(getAcceptedChoreEvent.content);
        const getOriginalChorePost: Event | null = await pool.value.get(
          relays.value,
          {
            ids: [chore.originalId],
          }
        );
        if (
          getOriginalChorePost !== null &&
          verifySignature(getOriginalChorePost)
        ) {
          approvedChore.status = ChoreStatus.Approved;
          approvedChore.reply = chore.reply;
          const approvedChoreEvent: partialEvent = {
            to: getOriginalChorePost?.pubkey || decodedPubKey.value,
            from: decodedPubKey.value,
            content: JSON.stringify(approvedChore),
          };
          const tags: Tag[] = [
            { key: "ChoreBit", value: ChoreStatus.Approved },
            {
              key: "e",
              eventId: getOriginalChorePost.id,
              marker: "reply",
            },
          ];
          signedEvent = await signPublicEvent(approvedChoreEvent, 1, tags);

          //Below Section for adding a zapRequest Nip57
          //PK for Zaprequest found from accepted chore event.
          const profile: Event | null | undefined = await getUserProfile(
            getAcceptedChoreEvent.pubkey
          );
          if (profile) {
            invoice = await zapRequest(
              profile,
              JSON.stringify(signedEvent),
              approvedChore.reward,
              "Chore Approved and Paid"
            );
          } else {
            console.log(
              "Profile not found unable to Zap. Make sure you have users relays added."
            );
          }
          return { invoice: invoice, event: signedEvent };
        } else {
          console.log("Unable to verify signature on Original Chore Event.");
        }
      } else {
        console.log("Unable to verify signature on accepted Chore Event.");
      }
    } else {
      console.log(
        "Chore cannot be Boosted/Zapped since it hasn't been started by anyone."
      );
    }
    return null;
  }

  /**
   * A function that sends a http request to a recipients lightning wallet for a invoice. NIP-57
   * @param {string} profile metadata/profile kind 0.
   * @param {string} event is the associated event with the zapRequest.
   * @param {number} amount the amount in sats for the request.
   * @param {string} content optional message to send along with the request.
   */
  async function zapRequest(
    profileMetaEvent: Event,
    event: string,
    sats: number,
    content = ""
  ): Promise<string> {
    const amount = sats * 1000;
    const choreEvent: Chore = JSON.parse(event);
    const profile = JSON.parse(profileMetaEvent.content);

    await nip57.useFetchImplementation(fetch);
    const getZapEndpoint = await nip57.getZapEndpoint(profileMetaEvent);

    const zapRequestEventTemplate: any = await nip57.makeZapRequest({
      profile: profileMetaEvent.pubkey,
      event: choreEvent.id,
      amount: amount,
      comment: content,
      relays: relays.value,
    });

    zapRequestEventTemplate.pubkey = decodedPubKey.value;
    zapRequestEventTemplate.tags.push(["lnurl", profile.lud16]);
    zapRequestEventTemplate.id = await getEventHash(zapRequestEventTemplate);
    const eventSig = await signEvent(
      zapRequestEventTemplate,
      decodedPrivKey.value
    );
    zapRequestEventTemplate.sig = eventSig;

    const validateZapRequest = await nip57.validateZapRequest(
      JSON.stringify(zapRequestEventTemplate)
    );

    if (validateZapRequest != null) {
      console.warn(validateZapRequest);
    }

    const callback: string | null = getZapEndpoint; // The callback received from the recipients lnurl pay endpoint
    const lnurl = profile.lud16; // The recipient's lightning address, encoded as a lnurl

    const zapEventRequest = encodeURI(JSON.stringify(zapRequestEventTemplate));

    const response: Response = await fetch(
      `${callback}?amount=${amount}&nostr=${zapEventRequest}&lnurl=${lnurl}`
    );
    const { pr: invoice } = await response.json();
    return invoice;
  }

  /**
   * A function that looks up a zap receipt by event on NOSTR relays. NIP-57
   * @param {string} eventId nostr event ID
   * @returns {Event} a NOSTR event containing the receipt from the zap lightning payment.
   */
  async function zapReceipt(eventId: string): Promise<Event | null> {
    if (pool.value === undefined) {
      console.log(
        "NOSTR Relay Pool is undefined. Try adding more relays to connect."
      );
      return null;
    }
    const getZapReceiptEvent: Event | null = await pool.value.get(
      relays.value,
      {
        kinds: [9735],
        "#e": [eventId],
      }
    );
    return getZapReceiptEvent;
  }

  /**
   * A function that encryts a partial event and packs it into a signed event
   * @param {partialEvent} event is used to build an ecrypted event
   * @param {number} kind is the number the respresents the kind of nostr event to be referenced.
   * @param {Tag[]} tags is an array of tags that are passed into the event before its signed.
   * @returns {Event} a event that is signed by the sender.
   */
  async function signEncryptedEvent(
    event: partialEvent,
    kind: number,
    tags?: Tag[]
  ): Promise<Event> {
    const tagEvent: Partial<UnsignedEvent> = {};
    if (tags) {
      const tagsArray = tags.map((tag) => {
        if (tag.value) {
          return [tag.key, tag.value];
        }
        //support for nip10
        else if (tag.key == "e") {
          return [
            tag.key,
            tag.eventId || "",
            tag.relayURL || "",
            tag.marker || "",
          ];
        } else {
          return [tag.key];
        }
      });
      tagEvent.tags = tagsArray;
    } else {
      tagEvent.tags = [];
    }
    const ciphertext = await nip04.encrypt(
      decodedPrivKey.value,
      event.to,
      event.content
    );

    const eventUnsigned: UnsignedEvent = {
      kind: kind,
      pubkey: decodedPubKey.value,
      tags: tagEvent.tags,
      content: ciphertext,
      created_at: Math.floor(Date.now() / 1000),
    };
    const eventId = await getEventHash(eventUnsigned);
    const eventSig = await signEvent(eventUnsigned, decodedPrivKey.value);

    const signedEvent: Event = {
      id: eventId,
      kind: eventUnsigned.kind,
      pubkey: eventUnsigned.pubkey,
      tags: eventUnsigned.tags,
      content: eventUnsigned.content,
      created_at: eventUnsigned.created_at,
      sig: eventSig,
    };
    return signedEvent;
  }

  /**
   * A function that builds and signs a public facing (not encrypted) event.
   * @param {partialEvent} event is used to build a nostr event
   * @param {number} kind is the number the respresents the kind of nostr event to be referenced.
   * @param {Tag[]} tags is an array of tags that are passed into the event before its signed.
   * @returns {Event} a event that is signed by the sender.
   */
  async function signPublicEvent(
    event: partialEvent,
    kind: number,
    tags?: Tag[]
  ): Promise<Event> {
    const tagEvent: Partial<UnsignedEvent> = {};
    if (tags) {
      const tagsArray = tags.map((tag) => {
        if (tag.value) {
          return [tag.key, tag.value];
        }
        //support for nip10
        else if (tag.key == "e") {
          return [
            tag.key,
            tag.eventId || "",
            tag.relayURL || "",
            tag.marker || "",
          ];
        } else {
          return [tag.key];
        }
      });
      tagEvent.tags = tagsArray;
    } else {
      tagEvent.tags = [];
    }

    const eventUnsigned: UnsignedEvent = {
      kind: kind,
      pubkey: decodedPubKey.value,
      content: event.content,
      tags: tagEvent.tags,
      created_at: Math.floor(Date.now() / 1000),
    };

    const eventId = await getEventHash(eventUnsigned);
    const eventSig = await signEvent(eventUnsigned, decodedPrivKey.value);

    const signedEvent: Event = {
      id: eventId,
      kind: eventUnsigned.kind,
      pubkey: eventUnsigned.pubkey,
      tags: eventUnsigned.tags,
      content: eventUnsigned.content,
      created_at: eventUnsigned.created_at,
      sig: eventSig,
    };
    return signedEvent;
  }

  /**
   * Publish NOSTR Event
   * @param {Event} signedEvent a event that is signed with a private key.
   */
  async function publishEvent(signedEvent: Event) {
    if (pool.value !== undefined) {
      const publish = await pool.value.publish(relays.value, signedEvent);

      await publish.on("ok", () => {
        console.log(`Published ${JSON.stringify(signedEvent)}`);
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await publish.on("failed", (reason: any) => {
        console.log(`failed to publish to ${relays}: ${reason}`);
      });
    } else {
      console.log(`Relays list cannot be empty.`);
    }
  }

  /**
   * Send Direct message to peer
   * @param message a partial direct message
   */
  async function sendDirectMessage(message: partialDirectMessage) {
    const tags: Tag[] = [{ key: "p", value: message.to }];
    const dmEvent = await signEncryptedEvent(message, 4, tags);

    await publishEvent(dmEvent);
  }
  /**
   * A function that querrys direct messages from all @param {Relays} relays
   * that are currently added by logged in user. Function will not run if no friends are added.
   * @returns {void}
   */
  async function querryAllDirectMessages() {
    if (directMessageSub.value != undefined) {
      directMessageSub.value.unsub();
    }
    if (
      decodedPubKey.value != "" &&
      decodedFriends.value.length > 0 &&
      pool.value !== undefined
    ) {
      // await receivedMessages.value.splice(0);
      // await sentMessages.value.splice(0);

      //add your pubkey to querry author list
      const authorsList = decodedFriends.value.map((friend) => friend.pubkey);
      authorsList.push(decodedPubKey.value);

      directMessageSub.value = pool.value.sub(
        [...relays.value],
        [
          {
            authors: authorsList,
            kinds: [4],
          },
        ]
      );

      directMessageSub.value.on("event", async (event: Event) => {
        if (
          directMessageEvents.value.find(
            (directMessageEvent) => directMessageEvent.id == event.id
          )
        ) {
          console.log("Dupe");
        } else {
          directMessageEvents.value.push(event);
          await processDirectMessageEvent(event).catch((error) => {
            console.log(`Error during processing DM::${error}`);
          });
        }
      });
    } else {
      console.log(`Can't Querry Messages with empty friends List`);
    }
  }

  /**
   * Process incoming direct message events into the store and throw if there is an error
   * @param event
   */
  async function processDirectMessageEvent(event: Event) {
    if (await verifySignature(event)) {
      const receivedAt = event.created_at;
      const eventRecipient = await event.tags.find(
        ([label, pubKey]) => label === "p" && pubKey && pubKey !== ""
      )?.[1];
      if (
        eventRecipient == decodedPubKey.value &&
        eventRecipient != undefined
      ) {
        const plaintext = await nip04.decrypt(
          decodedPrivKey.value,
          event.pubkey,
          event.content
        );

        receivedMessages.value.push({
          id: event.id,
          to: eventRecipient,
          from: event.pubkey,
          content: plaintext,
          received: receivedAt,
        });
      } else {
        if (
          event.pubkey === decodedPubKey.value &&
          eventRecipient !== decodedPubKey.value &&
          eventRecipient !== undefined
        ) {
          const plaintext = await nip04.decrypt(
            decodedPrivKey.value,
            eventRecipient,
            event.content
          );

          sentMessages.value.push({
            id: event.id,
            to: eventRecipient,
            from: event.pubkey,
            content: plaintext,
            received: receivedAt,
          });
        } else {
          return;
        }
      }
    } else {
      console.log(`Discarded Unverified Event::${event}`);
    }
    return event;
  }

  /**
   * Function that looksups users profile by pk and updates the getProfile<ref>
   * @param pk pubkey of user
   */
  async function getUserProfile(pk: string) {
    if (pool.value !== undefined) {
      const profile = await pool.value.get(relays.value, {
        authors: [pk],
        kinds: [0],
      });
      return profile;
    } else {
      console.log(`Relays list cannot be empty.`);
    }
  }

  /**
   * Function that gets all your friends profiles (kind 0) and updates your friends list with the data.
   * @param pubKey list of pubKeys that you are looking up
   * @returns {Profile} profile list for those pubKeys
   */
  async function getFriendsProfiles() {
    if (pool.value !== undefined) {
      const subscriber = pool.value.sub(
        [...relays.value],
        [
          {
            authors: await decodedFriends.value.map((friend) => friend.pubkey),
            kinds: [0],
          },
        ]
      );

      subscriber.on("event", async (event: Event) => {
        if (await verifySignature(event)) {
          decodedFriends.value.find((friend, index) => {
            if (friend.pubkey == event.pubkey) {
              //assign profile info to friends. This data is cross platform.
              const profile = JSON.parse(event.content);
              friends.value[index].profile.username =
                profile.username || profile.name || "";
              friends.value[index].profile.about = profile.about || "";
              friends.value[index].profile.picture = profile.picture || "";
              friends.value[index].profile.lnurl = profile.lud06 || "";
              friends.value[index].profile.ln_address = profile.lud16 || "";
            }
          });
        } else {
          console.log(`Discarded Unverified Event::${event}`);
        }
      });
      subscriber.on("eose", async () => {
        await subscriber.unsub();
      });
    } else {
      console.log(`Relays list cannot be empty.`);
    }
  }

  /**
   * Saves friends list and relay list by sending event to current relays list.
   */
  async function saveUser() {
    const packUserPrivate = JSON.stringify({
      friends: friends.value,
      relays: relays.value,
    });

    //pack profile data and include old data
    let packProfile;
    //Lookup current profile
    const getUpdatedProfile: Event | null | undefined = await getUserProfile(
      decodedPubKey.value
    );

    if (getUpdatedProfile !== undefined && getUpdatedProfile !== null) {
      const updatedProfile = JSON.parse(getUpdatedProfile.content);
      updatedProfile.username = username.value;
      updatedProfile.about = about.value;
      updatedProfile.picture = profilePic.value;
      updatedProfile.lud06 = lnURL.value;
      updatedProfile.lud16 = lnAddress.value;
      packProfile = updatedProfile;
    } else {
      packProfile = {
        username: username.value,
        about: about.value,
        picture: profilePic.value,
        lud06: lnURL.value,
        lud16: lnAddress.value,
      };
    }
    const stringifyProfile = JSON.stringify(packProfile);

    const privateData: partialEvent = {
      to: decodedPubKey.value,
      from: decodedPubKey.value,
      content: packUserPrivate,
    };
    const publicData: partialEvent = {
      to: decodedPubKey.value,
      from: decodedPubKey.value,
      content: stringifyProfile,
    };
    const privateDataTags: Tag[] = [{ key: "p", value: privateData.to }];
    const publicDataTags: Tag[] = [{ key: "p", value: publicData.to }];
    const signedPrivateEvent = await signEncryptedEvent(
      privateData,
      3,
      privateDataTags
    );
    await publishEvent(signedPrivateEvent);
    const signedPublicEvent = await signPublicEvent(
      publicData,
      0,
      publicDataTags
    );
    await publishEvent(signedPublicEvent);

    await querryAllDirectMessages();
  }

  /**
   * Gets both private and public user meta data.
   */
  async function getUser() {
    if (pool.value !== undefined) {
      isLoading.value = true;
      const subscriber = pool.value.sub(
        [...relays.value],
        [
          {
            authors: [decodedPubKey.value],
            kinds: [0, 3],
          },
        ]
      );

      subscriber.on("event", async (event: Event) => {
        if (await verifySignature(event)) {
          const eventRecipient = await event.tags.find(
            ([k, v]) => k === "p" && v && v !== ""
          )?.[1];
          //Kind 0s
          if (event.kind == 0) {
            if (
              eventRecipient == decodedPubKey.value &&
              event.pubkey == decodedPubKey.value
            ) {
              const extractProfileData = JSON.parse(event.content);

              if (extractProfileData) {
                username.value = extractProfileData.username;
                about.value = extractProfileData.about;
                profilePic.value = extractProfileData.picture;
                lnURL.value = extractProfileData.lud06;
                lnAddress.value = extractProfileData.lud16;
              }
            } else {
              console.log(`Discarded ${event}`);
            }
          }
          //Kind 3s
          else {
            if (
              eventRecipient == decodedPubKey.value &&
              event.pubkey == decodedPubKey.value
            ) {
              const plaintext = await nip04.decrypt(
                decodedPrivKey.value,
                event.pubkey,
                event.content
              );
              const extractPrivateData: User = JSON.parse(plaintext);

              if (extractPrivateData.friends.length > 0) {
                await friends.value.splice(0);
                extractPrivateData.friends.forEach((friend) => {
                  friends.value.push(friend);
                });
              }
              if (extractPrivateData.relays.length > 0) {
                await relays.value.splice(0);
                extractPrivateData.relays.forEach((relay) => {
                  relays.value.push(relay);
                });
              }
            } else {
              console.log(`Discarded ${event}`);
            }
          }
        } else {
          console.log(`Discarded Unverified Event::${event}`);
        }
      });
      subscriber.on("eose", async () => {
        //update friends profile info
        if (friends.value.length > 0) {
          await querryAllDirectMessages();
          await getFriendsProfiles();
        }
        isLoading.value = false;
        await subscriber.unsub();
      });
    } else {
      console.log(`Relays list cannot be empty.`);
    }
  }

  async function addRelay(relay: string) {
    await relays.value.push(relay);
    await saveUser();
  }
  async function removeRelay(relayInd: number) {
    await relays.value.splice(relayInd, 1);
    await saveUser();
  }

  async function addEvent(event: Event, eventStore: Ref<Event[]>) {
    await eventStore.value.push(event);
  }

  async function addId(id: string) {
    await ids.value.push(id);
  }
  async function removeId(idInd: number) {
    await ids.value.splice(idInd, 1);
  }
  async function addFriend(friend: Author) {
    await friends.value.push(friend);
    await saveUser();
  }
  async function editFriend(friendInd: number, friend: Author) {
    friends.value[friendInd] = friend;
    await saveUser();
    forceUpdate.value = true;
    forceUpdate.value = false;
  }
  async function removeFriend(friendInd: number) {
    await friends.value.splice(friendInd, 1);
    await saveUser();
  }
  /**
   * This function is used to update client side only data. Need to still make sure to publish to relays.
   * Use this to avoid having to pull chore data i.e when applying boosts.
   */
  async function hotUpdateChoreReward(choreId: string, amount: number) {
    const getChoreIndex = chores.value.findIndex(
      (chore) => chore.id === choreId
    );
    const originalReward = Number(chores.value[getChoreIndex].reward);
    const updatedReward = Number(originalReward) + Number(amount);
    chores.value[getChoreIndex].reward = Number(updatedReward);
  }

  /**
   * This function is used to update client side only data. Need to still make sure to publish to relays.
   * Use this to avoid having to pull chore data i.e when applying boosts.
   */
  async function hotUpdateChoreApprove(choreId: string, chore: Chore) {
    const getChoreIndex = chores.value.findIndex(
      (chore) => chore.id === choreId
    );
    chores.value[getChoreIndex].status = chore.status;
    chores.value[getChoreIndex].reply.push(chore);
  }
  return {
    relays,
    ids,
    username,
    about,
    profilePic,
    lnURL,
    lnAddress,
    friends,
    UserInfo,
    addFriend,
    getFriendsProfiles,
    getUserProfile,
    saveUser,
    getUser,
    editFriend,
    removeFriend,
    addId,
    removeId,
    choreEvents,
    chores,
    directMessageEvents,
    forceUpdate,
    sendDirectMessage,
    querryAllDirectMessages,
    receivedMessages,
    sentMessages,
    resetState,
    fetchChoreEvents,
    acceptChore,
    raiseChore,
    signEncryptedEvent,
    signPublicEvent,
    publishEvent,
    addRelay,
    removeRelay,
    privKey,
    pubKey,
    decodedPubKey,
    decodedPrivKey,
    decodedFriends,
    isLoading,
    loadingChores,
    completeChore,
    approveChore,
    zapRequest,
    zapReceipt,
    hotUpdateChoreReward,
    hotUpdateChoreApprove,
  };
});
