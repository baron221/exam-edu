/**
 * Shared utility for evaluating code via Judge0.
 * Supports running a single code snippet against multiple test cases.
 */

export interface TestCase {
  input: string;
  expected_output: string;
}

export interface EvaluationResult {
  passed: boolean;
  score: number;
  total: number;
  results: {
    input: string;
    expected: string;
    actual: string;
    status: string;
    passed: boolean;
  }[];
}

export async function evaluateCode(
  source_code: string,
  testCases: TestCase[],
  language_id: number = 54
): Promise<EvaluationResult> {
  const apiKey = process.env.JUDGE0_API_KEY;
  if (!apiKey) {
    throw new Error("JUDGE0_API_KEY is missing in environment.");
  }

  const results = [];
  let passedCount = 0;

  for (const tc of testCases) {
    try {
      const b64_source = Buffer.from(source_code).toString('base64');
      const b64_stdin = Buffer.from(tc.input).toString('base64');

      const response = await fetch("https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true", {
        method: "POST",
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_code: b64_source,
          language_id,
          stdin: b64_stdin
        }),
      });

      if (!response.ok) {
        results.push({
          input: tc.input,
          expected: tc.expected_output,
          actual: "Network/API Error",
          status: "Error",
          passed: false
        });
        continue;
      }

      const result = await response.json();
      const actual_output = result.stdout ? Buffer.from(result.stdout, 'base64').toString('utf8').trim() : "";
      const expected = tc.expected_output.trim();

      const passed = actual_output === expected;
      if (passed) passedCount++;

      results.push({
        input: tc.input,
        expected: expected,
        actual: actual_output,
        status: result.status?.description || "Unknown",
        passed: passed
      });

    } catch (err: any) {
      results.push({
        input: tc.input,
        expected: tc.expected_output,
        actual: err.message,
        status: "Exception",
        passed: false
      });
    }
  }

  return {
    passed: passedCount === testCases.length,
    score: passedCount,
    total: testCases.length,
    results
  };
}
