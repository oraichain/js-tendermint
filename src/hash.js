"use strict";

const createHash = require("create-hash");
const {
  UVarInt,
  VarInt,
  VarString,
  VarBuffer,
  VarHexBuffer,
  Time,
  BlockID,
  ValidatorHashInput,
  Version,
  ArrayPrefix,
  NumberPrefix,
} = require("./types.js");

const sha256 = hashFunc("sha256");
const tmhash = sha256;

function getBlockHash(header) {
  var encodedFields = [
    Version.encode(header.version),
    Buffer.concat([ArrayPrefix, VarString.encode(header.chain_id)]),
    Buffer.concat([NumberPrefix, UVarInt.encode(header.height)]),
    Time.encode(header.time),
    BlockID.encode(header.last_block_id),
    omitEmpty(
      Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.last_commit_hash)])
    ),
    omitEmpty(
      Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.data_hash)])
    ),
    Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.validators_hash)]),
    Buffer.concat([
      ArrayPrefix,
      VarHexBuffer.encode(header.next_validators_hash),
    ]),
    Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.consensus_hash)]),
    omitEmpty(
      Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.app_hash)])
    ),
    omitEmpty(
      Buffer.concat([
        ArrayPrefix,
        VarHexBuffer.encode(header.last_results_hash),
      ])
    ),
    omitEmpty(
      Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.evidence_hash)])
    ),
    Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.proposer_address)]),
  ];
  for (const field of encodedFields) {
    console.log(field.toString("hex"));
  }
  return treeHash(encodedFields).toString("hex").toUpperCase();
}

function getValidatorSetHash(validators) {
  let bytes = validators.map(ValidatorHashInput.encode);
  return treeHash(bytes).toString("hex").toUpperCase();
}

function omitEmpty(bytes) {
  if (bytes.length === 1 && bytes[0] === 0) {
    return Buffer.alloc(0);
  }
  return bytes;
}

function treeHash(hashes) {
  if (hashes.length === 0) {
    return null;
  }
  if (hashes.length === 1) {
    // leaf hash
    return tmhash(Buffer.concat([Buffer.from([0]), hashes[0]]));
  }
  let splitPoint = getSplitPoint(hashes.length);
  let left = treeHash(hashes.slice(0, splitPoint));
  let right = treeHash(hashes.slice(splitPoint));
  // inner hash
  return tmhash(Buffer.concat([Buffer.from([1]), left, right]));
}

function getSplitPoint(n) {
  if (n < 1) {
    throw Error("Trying to split tree with length < 1");
  }

  let mid = 2 ** Math.floor(Math.log2(n));
  if (mid === n) {
    mid /= 2;
  }
  return mid;
}

function hashFunc(algorithm) {
  return function (...chunks) {
    let hash = createHash(algorithm);
    for (let data of chunks) hash.update(data);
    return hash.digest();
  };
}

module.exports = {
  getBlockHash,
  getValidatorSetHash,
  sha256,
  treeHash,
  tmhash,
};
