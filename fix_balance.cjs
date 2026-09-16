const fs = require('fs');

let code = fs.readFileSync('src/screens/VetDashboard.tsx', 'utf8');

// Find the last index of `);`
const lastParenIndex = code.lastIndexOf(');');
if (lastParenIndex === -1) {
    console.log("No ); found");
    process.exit(1);
}

// Extract up to the last paren
const body = code.substring(0, lastParenIndex);

let openDivs = (body.match(/<div(\s|>)/g) || []).length;
let closeDivs = (body.match(/<\/div>/g) || []).length;

console.log(`Open: ${openDivs}, Close: ${closeDivs}`);

if (openDivs > closeDivs) {
    let missing = openDivs - closeDivs;
    console.log(`Adding ${missing} closing divs`);
    const newBody = body + '\n' + '</div>\n'.repeat(missing) + '  );\n}\n';
    fs.writeFileSync('src/screens/VetDashboard.tsx', newBody);
} else if (closeDivs > openDivs) {
    let excess = closeDivs - openDivs;
    console.log(`Removing ${excess} closing divs`);
    // Need to carefully remove excess </div> from the end of body
    let tempBody = body;
    for(let i = 0; i < excess; i++) {
        const lastDivIndex = tempBody.lastIndexOf('</div>');
        if (lastDivIndex !== -1) {
            tempBody = tempBody.substring(0, lastDivIndex) + tempBody.substring(lastDivIndex + 6);
        }
    }
    const newBody = tempBody + '\n  );\n}\n';
    fs.writeFileSync('src/screens/VetDashboard.tsx', newBody);
} else {
    console.log('Balanced!');
}
