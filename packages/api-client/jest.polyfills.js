const { TextEncoder, TextDecoder } = require("node:util");

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// global.fetch = require('undici').fetch;
