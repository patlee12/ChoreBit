(()=>{"use strict";function e(e,r,n){return new Promise(((t,s)=>{const a=Math.random().toString().slice(4);window.postMessage({id:a,application:"LBE",prompt:!0,action:`${e}/${r}`,scope:e,args:n},"*"),window.addEventListener("message",(function r(n){n.data&&n.data.response&&"LBE"===n.data.application&&n.data.scope===e&&n.data.id===a&&(n.data.data.error?s(new Error(n.data.data.error)):t(n.data.data.data),window.removeEventListener("message",r))}))}))}class r{enabled;isEnabled;executing;constructor(){this.enabled=!1,this.isEnabled=!1,this.executing=!1}enable(){return this.enabled?Promise.resolve({enabled:!0}):this.execute("enable").then((e=>("boolean"==typeof e.enabled&&(this.enabled=e.enabled,this.isEnabled=e.enabled),e)))}getInfo(){if(!this.enabled)throw new Error("Provider must be enabled before calling getInfo");return this.execute("getInfo")}signMessage(e){if(!this.enabled)throw new Error("Provider must be enabled before calling signMessage");return this.execute("signMessageOrPrompt",{message:e})}verifyMessage(e,r){if(!this.enabled)throw new Error("Provider must be enabled before calling verifyMessage");throw new Error("Alby does not support `verifyMessage`")}makeInvoice(e){if(!this.enabled)throw new Error("Provider must be enabled before calling makeInvoice");return"object"!=typeof e&&(e={amount:e}),this.execute("makeInvoice",e)}sendPayment(e){if(!this.enabled)throw new Error("Provider must be enabled before calling sendPayment");return this.execute("sendPaymentOrPrompt",{paymentRequest:e})}sendTransaction(e,r){if(!this.enabled)throw new Error("Provider must be enabled before calling sendTransaction");throw new Error("Alby does not support `sendTransaction`")}getAddress(e,r,n){if(!this.enabled)throw new Error("Provider must be enabled before calling getAddress");throw new Error("Alby does not support `getAddress`")}request(e,r){if(!this.enabled)throw new Error("Provider must be enabled before calling request");return this.execute("request",{method:e,params:r})}execute(r,n){return e("webln",r,n)}}class n{enabled;isEnabled;executing;constructor(){this.enabled=!1,this.isEnabled=!1,this.executing=!1}enable(){return this.enabled?Promise.resolve({enabled:!0}):this.execute("enable").then((e=>("boolean"==typeof e.enabled&&(this.enabled=e.enabled,this.isEnabled=e.enabled),e)))}getInfo(){if(!this.enabled)throw new Error("Provider must be enabled before calling getInfo");return this.execute("getInfo")}lnurl(e){if(!this.enabled)throw new Error("Provider must be enabled before calling lnurl");return this.execute("lnurl",{lnurlEncoded:e})}sendPayment(e){if(!this.enabled)throw new Error("Provider must be enabled before calling sendPayment");return this.execute("sendPaymentOrPrompt",{paymentRequest:e})}keysend(e){if(!this.enabled)throw new Error("Provider must be enabled before calling keysend");return this.execute("keysendOrPrompt",e)}makeInvoice(e){if(!this.enabled)throw new Error("Provider must be enabled before calling makeInvoice");return"object"!=typeof e&&(e={amount:e}),this.execute("makeInvoice",e)}signMessage(e){if(!this.enabled)throw new Error("Provider must be enabled before calling signMessage");return this.execute("signMessageOrPrompt",{message:e})}verifyMessage(e,r){if(!this.enabled)throw new Error("Provider must be enabled before calling verifyMessage");throw new Error("Alby does not support `verifyMessage`")}request(e,r){if(!this.enabled)throw new Error("Provider must be enabled before calling request");return this.execute("request",{method:e,params:r})}execute(r,n){return e("webln",r,n)}}document&&(window.webln=new n,window.webbtc=new r)})();