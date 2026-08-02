const fs = require('fs');

let content = fs.readFileSync('src/index.css', 'utf-8');
content = content.replace(/\r\n/g, '\n');

// 1. product-card
content = content.replace(
    '.product-card {\n  display: block;',
    '.product-card {\n  display: flex;\n  flex-direction: column;\n  height: 100%;'
);

// 2. popular-card
content = content.replace(
    '.popular-card {\n  flex: 0 0 calc(50% - 0.35rem);\n  padding: 0 0.35rem;\n}',
    '.popular-card {\n  flex: 0 0 calc(50% - 0.35rem);\n  padding: 0 0.35rem;\n  display: flex;\n  flex-direction: column;\n}'
);

// 3. combo-card
content = content.replace(
    '.combo-card {\n  flex: 0 0 50%;\n  padding: 0 12px;\n  scroll-snap-align: start;\n}',
    '.combo-card {\n  flex: 0 0 50%;\n  padding: 0 12px;\n  scroll-snap-align: start;\n  display: flex;\n  flex-direction: column;\n}'
);

// 4. popular-card-inner
content = content.replace(
    '  transition: transform 0.3s ease, box-shadow 0.3s ease;\n  display: block;\n}\n\n.popular-card-inner:hover',
    '  transition: transform 0.3s ease, box-shadow 0.3s ease;\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  flex-grow: 1;\n}\n\n.popular-card-inner:hover'
);

// 5. combo-card-inner
content = content.replace(
    '  transition: transform 0.3s ease, box-shadow 0.3s ease;\n  display: block;\n  height: 100%;\n}\n\n.combo-card-inner:hover',
    '  transition: transform 0.3s ease, box-shadow 0.3s ease;\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  flex-grow: 1;\n}\n\n.combo-card-inner:hover'
);

// 6. product-info
content = content.replaceAll(
    '  display: flex;\n  flex-direction: column;\n  gap: 2px;',
    '  display: flex;\n  flex-direction: column;\n  flex-grow: 1;\n  justify-content: space-between;\n  gap: 2px;'
);

fs.writeFileSync('src/index.css', content, 'utf-8');

console.log("Done");
