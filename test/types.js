// let test = require("tape");
// let {
//   VarInt,
//   VarHexBuffer,
//   Time,
//   BlockID,
//   PubKey,
//   ValidatorHashInput,
//   CanonicalVote,
//   Version,
// } = require("../lib/types.js");

const struct = require('varstruct');
const { VarInt, Time } = require('../lib/types');
const { UVarInt } = require('../lib/varint');

var VarString = struct.VarString(UVarInt);
var VarBuffer = struct.VarBuffer(UVarInt);

// let versionFixtures = require("./fixtures/version.json");
// let voteFixtures = require("./fixtures/vote.json");
// let varintFixtures = require("./fixtures/varint.json");
// let timeFixtures = require("./fixtures/time.json");
// let blockIDFixtures = require("./fixtures/block_id.json");
// let pubkeyFixture = require("./fixtures/pubkey.json");
// let validatorHashInputFixtures = require("./fixtures/validator_hash_input.json");
// for (let vhi of validatorHashInputFixtures) {
//   vhi.value.pub_key = pubkeyFixture.value;
// }

// function EncodeTest(t, type) {
//   return (value, expected) => {
//     let actual = type.encode(value).toString("hex");
//     t.equals(actual, expected, `encode ${JSON.stringify(value, null, "  ")}`);
//   };
// }

// test("Version", (t) => {
//   for (let { value, encoding } of versionFixtures) {
//     let actual = Version.encode(value).toString("hex");
//     t.equals(actual, encoding, `encode ${JSON.stringify(value)}`);
//   }
//   t.end();
// });

// test("Vote", (t) => {
//   for (let { value, encoding } of voteFixtures) {
//     value.chain_id = "chain-id";
//     let actual = CanonicalVote.encode(value).toString("hex");
//     t.equals(actual, encoding, `encode ${JSON.stringify(value)}`);
//   }
//   t.end();
// });

// test("VarInt", (t) => {
//   for (let { value, encoding } of varintFixtures) {
//     let actual = VarInt.encode(value).toString("hex");
//     t.equals(actual, encoding, `encode ${value}`);
//   }
//   t.end();
// });

// test("VarHexBuffer", (t) => {
//   // encode
//   let data = "0001020304050607";
//   let output = Buffer.alloc(9);
//   VarHexBuffer.encode(data, output, 0);
//   t.equals(output.toString("hex"), "080001020304050607");
//   t.equals(VarHexBuffer.encode.bytes, 9);

//   // encodingLength
//   let length = VarHexBuffer.encodingLength(data);
//   t.equals(length, 9);
//   t.end();
// });

// test("Time", (t) => {
//   // TODO: failure case
//   for (let { value, encoding } of timeFixtures) {
//     let actual = Time.encode(value).toString("hex");
//     t.equals(actual, encoding, `encode ${value}`);
//   }
//   t.end();
// });

// test("BlockID", (t) => {
//   for (let { value, encoding } of blockIDFixtures) {
//     let actual = BlockID.encode(value).toString("hex");
//     t.equals(actual, encoding, `encode ${value}`);
//   }
//   t.end();
// });

// test.skip("PubKey", (t) => {
//   let encodeTest = EncodeTest(t, PubKey);
//   encodeTest(null, "00");
//   // annoyingly, tendermint uses a different encoding when the pubkey is alone
//   // vs when inside the validatorhashinput, so the following currently fails against
//   // the fixture.
//   // encodeTest(pubkeyFixture.value, pubkeyFixture.encoding)
//   t.end();
// });

// test("ValidatorHashInput", (t) => {
//   for (let { value, encoding } of validatorHashInputFixtures) {
//     let actual = ValidatorHashInput.encode(value).toString("hex");
//     t.equals(actual, encoding, `encode ${value}`);
//   }
//   t.end();
// });

console.log(VarBuffer.encode(Buffer.from('hello world')).toString('hex'));

console.log('time', Time.encode('2024-05-06T07:34:41.886200108Z').toString('hex'));

// const big = BigInt('0x10b8dfde73aeda38f81c5ce9c181ccaf2e25d0c66b8d4bfb41732f0ae61ee566');
// console.log(big.toString(16));
