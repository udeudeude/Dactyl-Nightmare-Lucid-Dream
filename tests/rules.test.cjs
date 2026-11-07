const {test}=require('node:test');
const assert=require('node:assert/strict');
const {BirdTrigger}=require('../js/rules.js');
test('no idle attack, none after nine shots, one after the tenth',()=>{
  const rule=new BirdTrigger();
  for(let i=0;i<1000;i++)assert.equal(rule.takeAttack(true),false);
  for(let i=0;i<9;i++){rule.recordShot();assert.equal(rule.takeAttack(true),false);}
  rule.recordShot();assert.equal(rule.takeAttack(true),true);assert.equal(rule.takeAttack(true),false);
});
test('immunity/carry/cooldown can defer one pending attack without losing it',()=>{
  const rule=new BirdTrigger(2);rule.recordShot();rule.recordShot();
  for(let i=0;i<100;i++){rule.recordShot();assert.equal(rule.takeAttack(false),false);}
  assert.equal(rule.shots,2);assert.equal(rule.takeAttack(true),true);assert.equal(rule.shots,0);
});
test('threshold configuration is bounded, resets the count, and supports manual b<n> tuning',()=>{
  const rule=new BirdTrigger();rule.recordShot();rule.configure(3);
  assert.equal(rule.shots,0);assert.equal(rule.threshold,3);
  for(const value of [NaN,Infinity,0,100,-1,'bad',1.5]){rule.configure(value);assert.equal(rule.threshold,10);}
  rule.configure('1');rule.recordShot();assert.equal(rule.takeAttack(true),true);
});
