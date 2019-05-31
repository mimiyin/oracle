const { spawn } = require('child_process');
const assert = require('assert');

const NUM_CONNECTIONS = 100;
const NUM_ROUNDS = 20;
const PAUSE_PER_ROUND_MS = 2000;

module.exports = {
  '@tags': ['online'],
  'Stress test AWS instance' : async function(browser) {
    // Load conductor page
    browser.url('http://or-cl.io/conductor');
    browser.waitForElementVisible('#wait');
    browser.waitForElementVisible('#start');
    browser.click('#wait'); // Reset to waiting to begin.

    // Load a bunch of tabs
    for (let i = 0; i < NUM_CONNECTIONS; i++) {
      browser.execute("window.open()")
    }
    const tabHandles = (await browser.windowHandles()).value;
    for (let i = 1; i < tabHandles.length; i++) {
      // note: i starts at 1 b/c we skip the first tab,
      //  which is the conductor page
      await browser.switchWindow(tabHandles[i]);
      browser.url('http://or-cl.io');
      await browser.waitForElementVisible('#wait');
      // Disable the delay increment.
      browser.execute("DELAY_INCREMENT = 0");
    }

    // Start the piece, change to a section
    await browser.switchWindow(tabHandles[0]);
    browser.assert.urlEquals('http://or-cl.io/conductor/');
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

      // Wait for 2 seconds, then make sure the server hasn't died
      browser.pause(PAUSE_PER_ROUND_MS);
      await browser.switchWindow(tabHandles[0]);
      browser.assert.urlEquals('http://or-cl.io/conductor/');
      await browser.refresh();
      browser.waitForElementVisible('#start');

      console.log(`===== Round ${j} passed with ${NUM_CONNECTIONS} simultaneous requests. =====`);
    }

    // Shut down
    child.kill();
    browser.end();
  }
}
