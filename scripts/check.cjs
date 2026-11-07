const fs = require('node:fs');
const vm = require('node:vm');
for (const file of ['index.html', 'controller.html']) {
  const text = fs.readFileSync(file, 'utf8');
  for (const [, script] of text.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    new vm.Script(script, { filename: file });
  }
  for (const [, path] of text.matchAll(/<script\s+src="\.\/([^"?]+)"/g)) {
    new vm.Script(fs.readFileSync(path, 'utf8'), { filename: path });
  }
}
console.log('Game, controller and local scripts parse successfully.');
