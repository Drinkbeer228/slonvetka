const fs = require('fs');
const file = 'src/services/shiftService.ts';
let code = fs.readFileSync(file, 'utf8');

const regexOverride = /const payloadShift = \{ \.\.\.shift \};\s+if \(realUserId && payloadShift\.duty_keeper_id\) \{\s+payloadShift\.duty_keeper_id = realUserId;\s+\}/;

if (regexOverride.test(code)) {
  code = code.replace(regexOverride, `const payloadShift = { ...shift };\n      // Если смена только создана и у нее нет дежурного - подставляем текущего\n      if (realUserId && !payloadShift.duty_keeper_id) {\n        payloadShift.duty_keeper_id = realUserId;\n      }`);
  fs.writeFileSync(file, code);
  console.log("Patched saveShiftData override");
} else {
  console.log("Could not find regexOverride");
}
