'use strict';

var createHash = require('create-hash');

var _require = require('./types.js'),
  UVarInt = _require.UVarInt,
  VarInt = _require.VarInt,
  VarString = _require.VarString,
  VarBuffer = _require.VarBuffer,
  VarHexBuffer = _require.VarHexBuffer,
  Time = _require.Time,
  BlockID = _require.BlockID,
  ValidatorHashInput = _require.ValidatorHashInput,
  Version = _require.Version,
  ArrayPrefix = _require.ArrayPrefix,
  NumberPrefix = _require.NumberPrefix;

var sha256 = hashFunc('sha256');
var tmhash = sha256;

function getBlockHash(header) {
  var encodedFields = [
    Version.encode(header.version),
    Buffer.concat([ArrayPrefix, VarString.encode(header.chain_id)]),
    Buffer.concat([NumberPrefix, UVarInt.encode(header.height)]),
    Time.encode(header.time),
    BlockID.encode(header.last_block_id),
    omitEmpty(Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.last_commit_hash)])),
    omitEmpty(Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.data_hash)])),
    Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.validators_hash)]),
    Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.next_validators_hash)]),
    Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.consensus_hash)]),
    omitEmpty(Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.app_hash)])),
    omitEmpty(Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.last_results_hash)])),
    omitEmpty(Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.evidence_hash)])),
    Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.proposer_address)])
  ];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = encodedFields[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var field = _step.value;

      // console.log(field.toString("hex"));
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return treeHash(encodedFields).toString('hex').toUpperCase();
}

function getValidatorSetHash(validators) {
  var bytes = validators.map(ValidatorHashInput.encode);
  return treeHash(bytes).toString('hex').toUpperCase();
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
    const leaf = tmhash(Buffer.concat([Buffer.from([0]), hashes[0]]));
    return leaf;
  }
  var splitPoint = getSplitPoint(hashes.length);
  var left = treeHash(hashes.slice(0, splitPoint));
  var right = treeHash(hashes.slice(splitPoint));

  return tmhash(Buffer.concat([Buffer.from([1]), left, right]));
}

function hashFunc(algorithm) {
  return function () {
    var hash = createHash(algorithm);

    for (var _len = arguments.length, chunks = Array(_len), _key = 0; _key < _len; _key++) {
      chunks[_key] = arguments[_key];
    }

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = chunks[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var data = _step2.value;
        hash.update(data);
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    return hash.digest();
  };
}

module.exports = {
  getBlockHash: getBlockHash,
  getValidatorSetHash: getValidatorSetHash,
  sha256: sha256,
  tmhash: tmhash
};

const leaves = [
  sha256(
    Buffer.from(
      'CpACCo0CCiQvY29zbXdhc20ud2FzbS52MS5Nc2dFeGVjdXRlQ29udHJhY3QS5AEKK29yYWkxaGYyeDdxdTI0cXA1ZWZoNzZuZGN1YzY2ZTJxbXMyZ2s5NnNzcXUSP29yYWkxOWE1eTI5emo4cWh2Z2V3OWU3dnJnYW16ZmpmNjN0cGRyd3I2NTQ1bDU2OGRkNDBxOWM5czc4ZmszNhp0eyJwcm9wb3NlIjp7ImRhdGEiOnsiT1JBSSI6IjExMzY2NTcwIiwiSU5KIjoiMjQ1MTUxODMiLCJCVEMiOiI2Mjc3MTkxNDY0OSIsIkVUSCI6IjMwMzAxNzYzNjQiLCJXRVRIIjoiMzAzMDE3NjM2NCJ9fX0SZwpSCkYKHy9jb3Ntb3MuY3J5cHRvLnNlY3AyNTZrMS5QdWJLZXkSIwohAq//Gx6/7uovA4xkUDuAlB58vWrJEKrzOjEUjc6lfvleEgQKAggBGLrNARIRCgsKBG9yYWkSAzIwMRDanwwaQE4vdLMrK3YCDWvsKZDH80C9mVT43TPNjqVj10BrvRcvODWpNpcq+ujaU3nTxq8zKogyU5CV0P/+cPBzNN6uDSU=',
      'base64'
    )
  )
];

// getSplitPoint returns the largest power of 2 less than length
const getSplitPoint = (length) => {
  if (length < 1) {
    throw new Error('Trying to split a tree with size < 1');
  }

  const bitlen = (Math.log2(length) + 1) >> 0;
  let k = 1 << (bitlen - 1);
  if (k === length) {
    k >>= 1;
  }
  return k;
};

const leafPrefix = Buffer.from([0]);
const innerPrefix = Buffer.from([1]);

// returns tmhash(0x01 || left || right)
const innerHash = (left, right) => {
  return sha256(Buffer.concat([innerPrefix, left, right]));
};

const leafHash = (leaf) => {
  const leafBuf = Buffer.concat([leafPrefix, leaf]);
  return sha256(leafBuf);
};

const HashFromByteSlices = (items) => {
  switch (items.length) {
    case 0:
      return sha256(Buffer.from([]));
    case 1:
      return leafHash(items[0]);
    default:
      const k = getSplitPoint(items.length);
      const left = HashFromByteSlices(items.slice(0, k));
      const right = HashFromByteSlices(items.slice(k));
      return innerHash(left, right);
  }
};
