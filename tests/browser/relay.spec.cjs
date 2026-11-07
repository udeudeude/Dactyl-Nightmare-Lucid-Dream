const { test, expect } = require('@playwright/test');
test('four browser players share server combat, reconnect and survive creator departure', async ({ browser }) => {
  test.setTimeout(30000);
  const contexts=[],pages=[],errors=[];
  try {
    for(let i=0;i<4;i++){
      const context=await browser.newContext({viewport:{width:844,height:390}});contexts.push(context);
      const page=await context.newPage();pages.push(page);page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://127.0.0.1:4173/');
      await page.locator('#transport').selectOption('relay');
      await page.locator('#relayServer').fill('ws://127.0.0.1:4174/room');
      if(i===0)await page.locator('#host').click();
      else {await page.locator('#room').fill(await pages[0].locator('#room').inputValue());await page.locator('#join').click();}
      await expect(page.locator('#status')).toContainText('Connected.');
    }
    for(const page of pages)await expect.poll(()=>page.evaluate(()=>Object.keys(others).length)).toBe(3);
    await pages[0].evaluate(()=>{Object.assign(me,{x:0,y:0,z:0});yaw=0;pitch=0;send({type:'state',...me});});
    await pages[1].evaluate(()=>{Object.assign(me,{x:0,y:0,z:2});send({type:'state',...me});});
    // Initial respawn immunity is a real four-second server timer.
    await pages[0].waitForTimeout(4100);
    await pages[0].locator('#solo').click();await pages[0].locator('#fire').click();
    await expect.poll(()=>pages[0].evaluate(()=>score)).toBe(1);
    await expect.poll(()=>pages[1].evaluate(()=>me.x)).toBe(13);
    for(const page of pages)await expect(page.locator('#roomScores')).toContainText(/P1.*: 1/);
    const id=await pages[1].evaluate(()=>dactylRelay.id);
    await pages[1].evaluate(()=>dactylRelay.socket.close());
    await expect.poll(()=>pages[1].evaluate(()=>dactylRelay.connected)).toBe(true);
    expect(await pages[1].evaluate(()=>dactylRelay.id)).toBe(id);
    await pages[0].locator('#menuBtn').click();await pages[0].locator('#leaveRoom').click();
    for(const page of pages.slice(1)){
      await expect.poll(()=>page.evaluate(()=>Object.keys(others).length)).toBe(2);
      expect(await page.evaluate(()=>dactylRelay.connected)).toBe(true);
    }
    expect(errors).toEqual([]);
  }finally{for(const context of contexts)await context.close();}
});
