(function(){"use strict";function c(t){const e=t;try{if(e.type!="testMemory")return!1;for(const r of e.memory)if(!(r instanceof Uint32Array))return!1;return typeof e.repetitionCount=="number"}catch{return!1}}function a(t,e=1){const r=performance.now();for(let i=0;i<e;i++)t.forEach(s=>{const m=s.length-1;let n=0;for(let f=0;f<m;f++)if(n=s[n],n==0)throw new Error("wtf");if(n=s[n],n!=0)throw new Error("wtf")});return performance.now()-r}function u(t){return t instanceof Error?t.stack??t.toString():""+t}onmessage=t=>{const e=t.data;if(c(e))try{if(e.repetitionCount==666)throw new Error("That request is evil!");const o={type:"success",timeInMS:a(e.memory,e.repetitionCount)};postMessage(o)}catch(r){const o={type:"error",message:u(r)};postMessage(o)}}})();
