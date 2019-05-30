const { spawn } = require('child_process');
const assert = require('assert');

const NUM_CONNECTIONS = 100;
const NUM_ROUNDS = 20;
const PAUSE_PER_ROUND_MS = 2000;

module.exports = {
  'Stress test server' : async function(browser) {
    // Start server in child process
    const child = spawn('node', ['server.js']);
    // child.stdout.on('data', data => console.log(String(data)));
    // Wait for the first stdout from the server,
    //  which should be the startup message
    const stdoutPromise = new Promise(function(resolve, reject) {
      child.stdout.once('data', data => resolve(data));
    });
    const stdout = await stdoutPromise;
    console.log("[server] " + stdout);

    let serverGotAnError = false;
    let serverExited = false;
    child.stdout.on('data', data => console.log(`[server] ${data}`));
    child.stderr.on('data', data => {
      serverGotAnError = true;
      console.log(`[SERVER ERROR!] ${data}`)
    });
    child.on('exit', (code, signal) => {
      serverExited = true;
      console.log(`server exited with code ${code}, signal ${signal}`);
    });

    // Load conductor page
    browser.url('http://localhost:8000/conductor');
    browser.waitForElementVisible('#start');

    // Load a bunch of tabs
    for (let i = 0; i < NUM_CONNECTIONS; i++) {
      browser.execute("window.open()")
    }
    const tabHandles = (await browser.windowHandles()).value;
    for (let i = 1; i < tabHandles.length; i++) {
      // note: i starts at 1 b/c we skip the first tab,
      //  which is the conductor page
      await browser.switchWindow(tabHandles[i]);
      browser.url('http://localhost:8000');
      await browser.waitForElementVisible('#wait');
      // Disable the delay increment.
      browser.execute("DELAY_INCREMENT = 0");
    }

    // Start the piece, change to a section
    await browser.switchWindow(tabHandles[0]);
    browser.assert.urlEquals('http://localhost:8000/conductor/');
    browser.assert.visible('#start');
    browser.click('#start');
    browser.click('button.part[round="0"][part="2"]');

    // ----- Ready to Stress Test! -----
    for (let j = 0; j < NUM_ROUNDS; j++) {
      // Send a bunch of requests
      for (let i = 1; i < tabHandles.length; i++) {
        await browser.switchWindow(tabHandles[i]);
        await browser.waitForElementVisible('div.scene div.option[disabled="false"]');
        browser.click('div.scene div.option[disabled="false"]');
      }

      // Wait for 2 seconds, then make sure the child process hasn't died
      browser.pause(PAUSE_PER_ROUND_MS);
      assert(!serverGotAnError);
      assert(!serverExited);

      console.log(`===== Round ${j} passed with ${NUM_CONNECTIONS} simultaneous requests. =====`);
    }

    // Shut down
    child.kill();
    browser.end();
  }
}
