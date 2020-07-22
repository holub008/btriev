const assert = require('assert');
const rewire = require("rewire");

const lm = rewire("../../btriev/src/parser.js");

const btriev = require('../../btriev');
const tokens = require('../../btriev/src/tokens');