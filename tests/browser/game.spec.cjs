const { test, expect } = require('@playwright/test');
test('game renders, crosses each stairway and retains finite stereo polygons', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Play on phone', exact: true }).click();
  await expect(page.locator('#menu')).toBeHidden();
  const result = await page.evaluate(() => {
    playing = false;
    let gaps = 0;
    for (const p of platforms.slice(1)) for (let i = 0; i <= 1300; i++) {
      if (ground(p.x*i/1300,p.z*i/1300) === null) gaps++;
    }
    me.x = 0; me.z = 0; me.y = 0; yaw = 0; pitch = -.35; build();
    let vertices = 0, invalid = 0;
    const original = g.lineTo.bind(g);
    g.lineTo = (x,y) => { vertices++; if (!Number.isFinite(x+y)) invalid++; original(x,y); };
    draw(0,W/2,-1); draw(W/2,W/2,1);
    return { gaps, invalid, vertices };
  });
  expect(result.gaps).toBe(0); expect(result.invalid).toBe(0); expect(result.vertices).toBeGreaterThan(50);
  expect(errors).toEqual([]);
});
test('fire cancellation, blur, and menu release held input', async ({ page }) => {
  await page.goto('/'); await page.locator('#solo').click();
  await page.evaluate(() => { fireHeld=true; keys.KeyW=true; mx=1; });
  await page.locator('#fire').dispatchEvent('pointercancel');
  expect(await page.evaluate(() => fireHeld)).toBe(false);
  await page.evaluate(() => dispatchEvent(new Event('blur')));
  expect(await page.evaluate(() => ({mx,keys}))).toEqual({mx:0,keys:{}});
  await page.locator('#menuBtn').click();
  expect(await page.evaluate(() => playing)).toBe(false);
  await page.locator('#solo').click();
  expect(await page.evaluate(() => playing)).toBe(true);
});
test('expired remote controller input is cleared before movement', async ({ page }) => {
  await page.goto('/');
  const x = await page.evaluate(() => {
    playing=true; me.x=-13; me.y=0; me.z=0; world=0; yaw=0;
    controllerConn={};controllerLast=performance.now()-2000;
    remoteInput={x:1,z:0,fire:true};last=performance.now();tick(last+16);playing=false;
    return me.x;
  });
  expect(x).toBe(-13);
});
