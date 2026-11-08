const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
const fixture={schema:1,frames:[
 {source:'test-first',timestamp:12,width:180,height:180,notes:'keep first',points:[{name:'corner.a',u:.25,v:.25}]},
 {source:'test-second',timestamp:14,width:180,height:180,notes:'keep second',points:[{name:'corner.b',u:.75,v:.75}]}
]};
const upload=object=>({name:'references.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(object))});
test('phone-sized editor reopens imported frames and exports current edits without duplication',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:390,height:844});await page.goto('/landmarks.html');
 await page.locator('#import').setInputFiles(upload(fixture));
 await expect(page.locator('#source')).toHaveValue('test-first');
 await expect(page.locator('#points')).toContainText('corner.a');
 await page.locator('#file').setInputFiles('dactyl-icon-v2.png');
 await expect(page.locator('#status')).toContainText('1 existing points retained');
 await page.locator('#name').fill('added');await page.locator('#frame').click({position:{x:90,y:90}});
 await page.locator('#notes').fill('edited first');await page.locator('#save').click();await page.locator('#save').click();
 await expect(page.locator('#savedFrame option')).toHaveCount(3);
 await page.locator('#savedFrame').selectOption('1');
 await expect(page.locator('#points')).toContainText('corner.b');
 await expect(page.locator('#frame')).not.toHaveAttribute('src',/.+/);
 await page.locator('#notes').fill('edited second without image');
 await page.locator('#savedFrame').selectOption('0');
 await expect(page.locator('#notes')).toHaveValue('edited first');
 await expect(page.locator('#points')).toContainText('added');
 // Export includes edits even when Save was not tapped again.
 await page.locator('#time').fill('13');
 const pending=page.waitForEvent('download');await page.locator('#export').click();
 const download=await pending,data=JSON.parse(await fs.readFile(await download.path(),'utf8'));
 expect(data.frames).toHaveLength(2);expect(data.frames[0].timestamp).toBe(13);
 expect(data.frames[0].points).toEqual([{name:'corner.a',u:.25,v:.25},{name:'added',u:.5,v:.5}]);
 expect(data.frames[1].notes).toBe('edited second without image');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});
test('wrong image dimensions retain imported points and new-frame action preserves existing work',async({page})=>{
 await page.goto('/landmarks.html');
 const data=structuredClone(fixture);data.frames[0].width=1920;data.frames[0].height=1080;
 await page.locator('#import').setInputFiles(upload(data));
 await page.locator('#file').setInputFiles('dactyl-icon-v2.png');
 await expect(page.locator('#error')).toContainText('expected 1920 × 1080');
 await expect(page.locator('#points')).toContainText('corner.a');
 await page.locator('#newFrame').click();await page.locator('#file').setInputFiles('dactyl-icon-v2.png');
 await expect(page.locator('#status')).toContainText('0 existing points retained');
 await page.locator('#name').fill('new.point');await page.locator('#frame').click({position:{x:90,y:90}});
 await page.locator('#save').click();
 await expect(page.locator('#savedFrame option')).toHaveCount(4);
 await page.locator('#savedFrame').selectOption('0');
 await expect(page.locator('#points')).toContainText('corner.a');
});
