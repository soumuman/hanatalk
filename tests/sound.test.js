import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareSound,playAddition,setSoundEnabled} from '../js/sound.js';

test('gesture unlock, quiet single sound, three-note bloom, and mute',async()=>{
  const oscillators=[];let resumes=0;
  const param=()=>({setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(){}});
  globalThis.AudioContext=class {
    state='suspended';currentTime=10;sampleRate=44100;destination={};
    resume(){resumes++;this.state='running';return Promise.resolve();}
    createBuffer(){return {};}
    createBufferSource(){return {connect(){},disconnect(){},start(){}};}
    createGain(){return {gain:param(),connect(){},disconnect(){}};}
    createOscillator(){const osc={frequency:param(),connect(){},disconnect(){},start(time){this.started=time;},stop(time){this.stopped=time;}};oscillators.push(osc);return osc;}
  };
  prepareSound();assert.equal(resumes,1);
  playAddition(1);assert.equal(oscillators.length,1);assert.equal(oscillators[0].type,'sine');assert.ok(Math.abs(oscillators[0].stopped-oscillators[0].started-.33)<.001);
  playAddition(5);assert.equal(oscillators.length,4);assert.ok(Math.abs(oscillators[3].stopped-oscillators[1].started-1.21)<.001);
  playAddition(6);assert.equal(oscillators.length,5);
  setSoundEnabled(false);prepareSound();playAddition(5);assert.equal(oscillators.length,5);
  setSoundEnabled(true);prepareSound();playAddition(1);assert.equal(oscillators.length,6);
  delete globalThis.AudioContext;
});
