
async function test() {
  const source = Buffer.from(`
#include <iostream>
using namespace std;
int main() {
    int a, b;
    if (!(cin >> a >> b)) {
        cout << "INPUT_FAILED" << endl;
        return 0;
    }
    cout << "SUM: " << a + b << endl;
    return 0;
}
  `).toString('base64');
  
  const stdin = Buffer.from("10 20").toString('base64');
  
  const apiKey = "YOUR_KEY_HERE"; // I won't use it here, just checking logic
  
  const body = JSON.stringify({
    source_code: source,
    language_id: 54,
    stdin: stdin
  });
  
  console.log("BODY_TO_SEND:", body);
}

test();
