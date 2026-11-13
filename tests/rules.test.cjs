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

test('manual 180-second match clock expires exactly and clamps at zero',()=>{
 const {MatchClock}=require('../js/rules.js');
 const clock=new MatchClock();assert.equal(clock.duration,180);
 assert.equal(clock.remaining(2000),180);
 clock.start(5000);
 assert.equal(clock.remaining(5000),180);
 assert.equal(clock.remaining(5001),180);
 assert.equal(clock.remaining(6000),179);
 assert.equal(clock.remaining(184999),1);
 assert.equal(clock.remaining(185000),0);
 assert.equal(clock.remaining(999999),0);
 assert.equal(clock.expired(184999),false);
 assert.equal(clock.expired(185000),true);
 clock.start(200000);assert.equal(clock.remaining(200000),180);
 clock.reset();assert.equal(clock.expired(1000000),false);
 assert.throws(()=>new MatchClock(0));assert.throws(()=>clock.start(NaN));
});
