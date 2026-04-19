
const code = 'int a, b; cin >> a >> b;';
const stmts = code.split(/;/);
const stmt = stmts[1]; // ' cin >> a >> b'
const match = stmt.match(/(?:std::)?cin\s*((>>\s*[a-zA-Z0-9_\[\]\.\->]+\s*)+)/);
console.log(match);

