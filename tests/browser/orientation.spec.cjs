const {test,expect}=require('@playwright/test');
async function permission(page,result){await page.addInitScript(value=>{Object.defineProperty(window,'DeviceOrientationEvent',{configurable:true,value:{requestPermission:async()=>value}});},result);}
test('denied motion access keeps a usable menu and phone play works',async({page})=>{
  await permission(page,'denied');await page.goto('/');await page.locator('#cardboard').click();
  await expect(page.locator('#menu')).toBeVisible();await expect(page.locator('#trackingStatus')).toContainText('denied');
  expect(await page.evaluate(()=>playing)).toBe(false);
  await page.locator('#solo').click();await expect(page.locator('#menu')).toBeHidden();
});
test('granted readings use landscape basis, recenter, and release tracking for phone play',async({page},testInfo)=>{
  await permission(page,'granted');await page.goto('/');await page.locator('#cardboard').click();
  await page.evaluate(()=>{
    Object.defineProperty(screen,'orientation',{configurable:true,value:{angle:90}});
    const e=new Event('deviceorientation');Object.assign(e,{alpha:90,beta:0,gamma:-90});dispatchEvent(e);
  });
  await expect(page.locator('#trackingStatus')).toContainText('active');
  expect(await page.evaluate(()=>tracking)).toBe(true);
  expect(await page.evaluate(()=>Math.abs(pitch))).toBeLessThan(.001);
  await page.screenshot({path:testInfo.outputPath('cardboard-landscape.png')});
  await expect(page.locator('#center')).toBeVisible();await page.locator('#center').click();
  expect(await page.evaluate(()=>yaw)).toBeCloseTo(Math.PI/2);
  await page.locator('#menuBtn').click();await page.locator('#solo').click();
  expect(await page.evaluate(()=>({tracking,cameraBasis}))).toEqual({tracking:false,cameraBasis:null});
});
test('permission without sensor readings reports a timeout instead of pretending to track',async({page})=>{
  await permission(page,'granted');await page.goto('/');await page.locator('#cardboard').click();
  await expect(page.locator('#trackingStatus')).toContainText('No motion readings',{timeout:5000});
  await expect(page.locator('#menu')).toBeVisible();
  expect(await page.evaluate(()=>playing)).toBe(false);
});
test('portrait Cardboard starts are blocked with an actionable message',async({page})=>{
  await permission(page,'granted');await page.setViewportSize({width:390,height:844});await page.goto('/');
  await page.locator('#cardboard').click();await expect(page.locator('#trackingStatus')).toContainText('sideways');
  await expect(page.locator('#menu')).toBeVisible();
});
