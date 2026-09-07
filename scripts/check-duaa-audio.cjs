const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const handlers = {};
const control = {value:'',addEventListener(){}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/assets/duaa/duaa.js'),'utf8'), {
 document:{querySelector:()=>control,querySelectorAll:()=>[],getElementById:()=>null,addEventListener:(n,f)=>{handlers[n]=f;}},
 window:{addEventListener(){}},location:{hash:''},duaaText:{topic:'topic',topics:'topics'},console:{warn(){}},
});
(async()=>{
 const section={hidden:false,querySelectorAll:()=>recordings};
 const recordings=Array.from({length:3},()=>({tagName:'AUDIO',currentTime:12,plays:0,closest:()=>section,async play(){this.plays++;}}));
 await handlers.ended({target:recordings[0]});assert.equal(recordings[1].plays,1);assert.equal(recordings[1].currentTime,0);
 await handlers.ended({target:recordings[1]});assert.equal(recordings[2].plays,1);
 await handlers.ended({target:recordings[2]});assert.equal(recordings[0].plays,0);
 section.hidden=true;await handlers.ended({target:recordings[0]});assert.equal(recordings[1].plays,1);
 section.hidden=false;recordings[1].play=async()=>{throw Error('blocked');};await handlers.ended({target:recordings[0]});
 console.log('Passed: independent players advance within their section and handle blocked playback.');
})().catch(error=>{console.error(error);process.exitCode=1;});
