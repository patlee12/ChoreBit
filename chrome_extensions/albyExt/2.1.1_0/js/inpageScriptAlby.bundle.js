(()=>{"use strict";class e{enabled;constructor(){this.enabled=!1}enable(){return this.enabled?Promise.resolve({enabled:!0}):this.execute("enable").then((e=>("boolean"==typeof e.enabled&&(this.enabled=e.enabled),e)))}addAccount(e){if(!this.enabled)throw new Error("Provider must be enabled before calling addAccount");return this.execute("addAccount",{name:e.name,connector:e.connector,config:e.config})}execute(e,a){return function(e,a,n){return new Promise(((t,o)=>{const r=Math.random().toString().slice(4);window.postMessage({id:r,application:"LBE",prompt:!0,action:`${e}/${a}`,scope:e,args:n},"*"),window.addEventListener("message",(function a(n){n.data&&n.data.response&&"LBE"===n.data.application&&n.data.scope===e&&n.data.id===r&&(n.data.data.error?o(new Error(n.data.data.error)):t(n.data.data.data),window.removeEventListener("message",a))}))}))}("alby",e,a)}}document&&(window.alby=new e)})();