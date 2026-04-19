const code = `
#include <iostream>
using namespace std;

long long calculateFactorial(int a, int b) {
    return a+b;
    return 0; // Placeholder
}

int main() {
    int a,b;
    cout << "malumot : ";
    cin >> a >> b;

    cout << calculateFactorial(a,b);
    return 0;
}
`;
const cleanCode = code.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '');
const statements = cleanCode.split(/;/);
const prompts = [];
let lastCout = 'M: ';
for (const stmt of statements) {
    const coutMatch = stmt.match(/cout\s*<<\s*["']([^"']+)["']/);
    if (coutMatch) lastCout = coutMatch[1].replace(/\\n/g, '');
    const cinMatch = stmt.match(/(?:std::)?cin\s*((>>\s*[a-zA-Z0-9_\[\]\.\->]+\s*)+)/);
    if (cinMatch) {
        const varsCount = (cinMatch[1].match(/>>/g) || []).length;
        for (let i=0; i<varsCount; i++) {
            prompts.push(lastCout);
            lastCout = 'Next: ';
        }
    }
}
console.log(prompts);
