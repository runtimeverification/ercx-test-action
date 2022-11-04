const core = require('@actions/core');
const exec = require('@actions/exec');
const { promises: fs } = require('fs');


// most @actions toolkit packages have async methods
async function run() {
  try {
    core.info('Running golden tests');
    
    const output = await exec.getExecOutput(
      'forge',
      ['test', '--silent', '--match-contract', 'ERC20MockTest'],
      {ignoreReturnCode: true}
    );
    
    const actual = output.stdout;
    const expected = await fs.readFile('test/golden/ERC20MockTest.t.sol.out', 'utf8');

    if (!compare(actual, expected)) {
      core.setFailed("foundry output did not match expected output.");
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

function compare(actual, expected) {
  let actualLines = actual.split("\n");
  let expectedLines = expected.split("\n");
  if (actualLines.length !== expectedLines.length) {
    return false;
  }
  // Remove the first and last line from the output. These lines
  // contain metadata and not test cases
  actualLines = actualLines.slice(2, -2);
  expectedLines = expectedLines.slice(2, -2);
  // Construct a mapping from function signatures to success states
  // for each test case of actual foundry output
  const testResults = new Map();
  for (let line of actualLines) {
    const testResult = parseLine(line);
    testResults.set(testResult.signature, testResult.result);
  }
  // Go over each test case of the expected foundry ouput and check
  // if it matches the actual output. If not, we shortcut and return
  // false
  for (let line of expectedLines) {
    const testResult = parseLine(line);
    if (testResults.get(testResult.signature) !== testResult.result) {
      return false;
    }
  }
  return true;
}

function parseLine(line) {
  // Strip color codes from input line
  line = line.split(/\x1B\[\d+m/).join();
  let result = "";
  let signature = "";
  let brackets = 0;
  let state = "before result";
  for (let char of line) {
    if (state === "before result") {
      if (char === "[") {
        brackets++;
        state = "inside result"
      } 
    } else if (state == "inside result") {
      if (char === "[") {
        brackets++;
      } else if (char === "]") {
        brackets--;
        if (brackets === 0) {
          state = "before signature"
        }
      } else {
        result += char;
      }
    } else if (state == "before signature") {
      if (char.match(/\w/)) {
        state = "inside signature"
        signature += char;
      }
    } else if (state == "inside signature") {
      if (char.match(" ")) {
        state = "after signature";
      } else {
        signature += char;
      }
    }
  }
  return { result, signature }
}

run();
