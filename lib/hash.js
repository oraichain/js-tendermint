"use strict";

var createHash = require("create-hash");

var _require = require("./types.js"),
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

var sha256 = hashFunc("sha256");
var tmhash = sha256;

function getBlockHash(header) {
  var encodedFields = [Version.encode(header.version), Buffer.concat([ArrayPrefix, VarString.encode(header.chain_id)]), Buffer.concat([NumberPrefix, UVarInt.encode(header.height)]), Time.encode(header.time), BlockID.encode(header.last_block_id), omitEmpty(Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.last_commit_hash)])), omitEmpty(Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.data_hash)])), Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.validators_hash)]), Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.next_validators_hash)]), Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.consensus_hash)]), omitEmpty(Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.app_hash)])), omitEmpty(Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.last_results_hash)])), omitEmpty(Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.evidence_hash)])), Buffer.concat([ArrayPrefix, VarHexBuffer.encode(header.proposer_address)])];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = encodedFields[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var field = _step.value;

      console.log(field.toString("hex"));
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

  return treeHash(encodedFields).toString("hex").toUpperCase();
}

function getValidatorSetHash(validators) {
  var bytes = validators.map(ValidatorHashInput.encode);
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
  var splitPoint = getSplitPoint(hashes.length);
  var left = treeHash(hashes.slice(0, splitPoint));
  var right = treeHash(hashes.slice(splitPoint));
  // inner hash
  return tmhash(Buffer.concat([Buffer.from([1]), left, right]));
}

function getSplitPoint(n) {
  if (n < 1) {
    throw Error("Trying to split tree with length < 1");
  }

  var mid = 2 ** Math.floor(Math.log2(n));
  if (mid === n) {
    mid /= 2;
  }
  return mid;
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
  treeHash: treeHash,
  tmhash: tmhash
};