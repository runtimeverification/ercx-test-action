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

    const expected = await fs.readFile('test/golden/ERC20MockTest.t.sol.out', 'utf8');

    if (expected !== output.stdout) {
      core.setFailed("foundry output did not match expected output.");
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
