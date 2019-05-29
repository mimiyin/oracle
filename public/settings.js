// How many cues
let NUM_ROUNDS = 4;
let NUM_PARTS = 5;

// Length of each part in seconds
let PART_LEN = 120;

// CHORUS
// Show query for 5 seconds
let QUERY_TS = 1000 * 5;
// Chorus formatting
let CHORUS_HEIGHT_MARGIN = 275;

// SUPPLICANT
// Disable options for 3 seconds
let DISABLED_TS = 1000 * 3;
// How much to delay people for each successful query they make
let DELAY_INCREMENT = 1000 * 1;

// RESPONSE
let RESPOND_TH = 0.34;
let RESPOND_DELAY = QUERY_TS * 2;
let ROUNDS = {1 : true, 2 : true };

// VOICE
let VOICE_CHROME = 40;
let VOICE_SAFARI = 44;
let VOICE = VOICE_CHROME;
// Range for delaying speech for chorus effect
let SPEECH_DELAY = 50;
// Default speech settings
let DEFAULT_RATE = 0.8;
let DEFAULT_PITCH = 1;
let DEFAULT_VOLUME = 1;

// BABBLE
let BABBLE_CHROME = 40;
let BABBLE_RATE = 1.5;
let BABBLE_PITCH = 1;
let BABBLE_VOLUME = 0.25;

// Sound effects
let DING_VOL = 0.25;
let CLICK_VOL = 0.125;
