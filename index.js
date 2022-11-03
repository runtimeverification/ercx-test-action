const core = require('@actions/core');
const exec = require('@actions/exec');
const { promises: fs } = require('fs');


// most @actions toolkit packages have async methods
async function run() {
  try {
    core.info('Running golden tests');
    let output = '';
    let error = '';
    const options = {
      listeners : {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
        stderr: (data: Buffer) => {
          error += data.toString();
        }
      }
    };
    await exec.exec('forge', ['test', '--siltent', '--match-contract', 'ERC20MockTest'], options);

    const expected = await fs.readFile('/test/', 'utf8');

    if (expected !== output) {
      core.setFailed("foundry output did not match expected output.");
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
