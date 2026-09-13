const fs = require('fs');
let code = fs.readFileSync('src/services/SyncManager.ts', 'utf8');

code = code.replace(
  `if (uploadError) throw uploadError;`,
  `if (uploadError) { uploadError.message = 'Storage Error: ' + uploadError.message; throw uploadError; }`
);

code = code.replace(
  `if (recordError) throw recordError;`,
  `if (recordError) { recordError.message = 'Record Error: ' + recordError.message; throw recordError; }`
);

code = code.replace(
  `if (photoMetaError) throw photoMetaError;`,
  `if (photoMetaError) { photoMetaError.message = 'Photo Meta Error: ' + photoMetaError.message; throw photoMetaError; }`
);

fs.writeFileSync('src/services/SyncManager.ts', code);
