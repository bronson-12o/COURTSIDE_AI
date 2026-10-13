import test from 'node:test';
import assert from 'node:assert/strict';
import {predictPregame} from '../model.mjs';
const model={weights:[.2,.8]};
const a={id:"A",recent_margin:8};
const b={id:"B",recent_margin:-2};
test('trained pregame model is reproducible and respects form changes',()=>{const base=predictPregame(model,a,b);assert.equal(base,predictPregame(model,a,b));assert.ok(predictPregame(model,a,b,10)>base);assert.ok(predictPregame(model,a,b,-10)<base);});
test('switching home team changes prediction',()=>assert.notEqual(predictPregame(model,a,b),predictPregame(model,b,a)));
test('invalid or self matchups are not predicted',()=>{assert.throws(()=>predictPregame(model,a,a),/Invalid/);assert.throws(()=>predictPregame({weights:[]},a,b),/Invalid/);});
