import fs from 'fs';
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf8');

// Replace the bad if(loading)
code = code.replace(
  /if \(loading\) \{\n    return \(\n    <div className="pb-24 space-y-6 mt-4">/g,
  `if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
      </div>
    );
  }
  return (
    <div className="pb-24 space-y-6 mt-4">`
);

fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
console.log('Fixed loading return bug');
