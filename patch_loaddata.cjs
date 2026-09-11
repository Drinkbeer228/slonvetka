const fs = require('fs');
const path = './src/screens/DailyShiftPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldLoadCode = `const data = await shiftService.getShiftData(selectedDate);
      setShift(data.shift || null);
      setMetrics(data.metrics || {});`;

const newLoadCode = `const data = await shiftService.getShiftData(selectedDate);
      let loadedShift = data.shift || null;
      if (loadedShift && (!loadedShift.duty_keeper_id || loadedShift.duty_keeper_id !== profile?.id)) {
        if (!isLocked && profile?.id) {
           loadedShift = { ...loadedShift, duty_keeper_id: profile.id };
           // Trigger immediate save in background so it's locked to this user
           shiftService.saveShiftData(loadedShift, data.metrics || {}).catch(console.error);
        }
      }
      setShift(loadedShift);
      setMetrics(data.metrics || {});`;

content = content.replace(oldLoadCode, newLoadCode);
fs.writeFileSync(path, content);
