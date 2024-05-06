"use strict";

var stringify = require("json-stable-stringify");
var ed25519 = require("supercop.js");
// TODO: try to load native ed25519 implementation, fall back to supercop.js

var _require = require("./hash.js"),
    getBlockHash = _require.getBlockHash,
    getValidatorSetHash = _require.getValidatorSetHash;

var _require2 = require("./types.js"),
    VarBuffer = _require2.VarBuffer,
    CanonicalVote = _require2.CanonicalVote,
    ArrayPrefix = _require2.ArrayPrefix;

var _require3 = require("./pubkey.js"),
    getAddress = _require3.getAddress;

var _require4 = require("./common.js"),
    safeParseInt = _require4.safeParseInt;

var crypto = require("crypto");
var CryptoJS = require("crypto-js");

function base64ToHex(base64String) {
  // Decode base64 string
  var bytes = CryptoJS.enc.Base64.parse(base64String);

  // Convert to hex
  var hexString = bytes.toString(CryptoJS.enc.Hex);

  return hexString;
}

function tmhash(data) {
  var byteArray = Buffer.from(data);
  var hash = crypto.createHash("sha256");
  hash.update(byteArray);
  var hashBytes = hash.digest();
  // const base64String = hashBytes.toString("base64");
  return hashBytes.toString("hex");
}

// gets the serialized representation of a vote, which is used
// in the commit signatures
function getVoteSignBytes(chainId, vote) {
  var canonicalVote = Object.assign({}, vote);
  canonicalVote.chain_id = chainId;
  canonicalVote.height = safeParseInt(vote.height);
  // canonicalVote.round = safeParseInt(vote.round);
  canonicalVote.block_id.hash = tmhash(canonicalVote.block_id.hash);
  canonicalVote.block_id.parts.total = safeParseInt(vote.block_id.parts.total);
  canonicalVote.block_id.parts.hash = tmhash(canonicalVote.block_id.parts.hash);
  if (vote.validator_index) {
    canonicalVote.validator_index = safeParseInt(vote.validator_index);
  }
  console.log("Canonical vote: ", canonicalVote);

  var encodedVote = CanonicalVote.encode(canonicalVote);
  return VarBuffer.encode(encodedVote);
}

// verifies that a number is a positive integer, less than the
// maximum safe JS integer
function verifyPositiveInt(n) {
  if (!Number.isInteger(n)) {
    throw Error("Value must be an integer");
  }
  if (n > Number.MAX_SAFE_INTEGER) {
    throw Error("Value must be < 2^53");
  }
  if (n < 0) {
    throw Error("Value must be >= 0");
  }
}

// verifies a commit signs the given header, with 2/3+ of
// the voting power from given validator set
//
// This is for Tendermint v0.33.0 and later
function verifyCommit(header, commit, validators) {
  var blockHash = getBlockHash(header);
  console.log(blockHash);
  if (blockHash !== commit.block_id.hash) {
    throw Error("Commit does not match block hash");
  }

  var countedValidators = new Set();

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = commit.signatures[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var signature = _step.value;

      // ensure there are never multiple signatures from a single validator
      var validator_address = signature.validator_address;
      if (countedValidators.has(validator_address)) {
        throw Error("Validator has multiple signatures");
      }
      countedValidators.add(signature.validator_address);
    }

    // ensure this signature references at least one validator
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

  var validator = validators.find(function (v) {
    return countedValidators.has(v.address);
  });
  if (!validator) {
    throw Error("No recognized validators have signatures");
  }

  verifyCommitSigs(header, commit, validators);
}

// verifies a commit is signed by at least 2/3+ of the voting
// power of the given validator set
//
// This is for Tendermint v0.33.0 and later
function verifyCommitSigs(header, commit, validators) {
  var committedVotingPower = 0;

  // index validators by address
  var validatorsByAddress = new Map();
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = validators[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var validator = _step2.value;

      validatorsByAddress.set(validator.address, validator);
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

  var PrecommitType = 2;
  var BlockIDFlagAbsent = 1;
  var BlockIDFlagCommit = 2;
  var BlockIDFlagNil = 3;

  var validatorIndex = 0;
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = commit.signatures[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var cs = _step3.value;

      switch (cs.block_id_flag) {
        case BlockIDFlagAbsent:
        case BlockIDFlagCommit:
        case BlockIDFlagNil:
          break;

        default:
          throw Error("unknown block_id_flag: " + cs.block_id_flag);
      }

      var _validator = validatorsByAddress.get(cs.validator_address);

      // skip if this validator isn't in the set
      // (we allow signatures from validators not in the set,
      // because we sometimes check the commit against older
      // validator sets)
      if (!_validator) continue;

      var signature = Buffer.from(cs.signature, "base64");
      var vote = {
        type: PrecommitType,
        timestamp: cs.timestamp,
        block_id: commit.block_id,
        height: commit.height,
        round: commit.round
      };
      if (cs.timestamp !== vote.timestamp) {
        throw new Error("Timestamp not match!");
      }
      var signBytes = getVoteSignBytes(header.chain_id, vote);
      console.log("Sign bytes", signBytes.toString("hex"));
      // TODO: support secp256k1 signatures
      var pubKey = Buffer.from(_validator.pub_key.value, "base64");
      console.log("Pubkey:", base64ToHex(_validator.pub_key.value), "Signature:", base64ToHex(cs.signature));
      if (!ed25519.verify(signature, signBytes, pubKey)) {
        throw Error("Invalid signature");
      } else {
        console.log("yup");
      }

      // count this validator's voting power
      committedVotingPower += safeParseInt(_validator.voting_power);

      validatorIndex++;
    }

    // sum all validators' voting power
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  var totalVotingPower = validators.reduce(function (sum, v) {
    return sum + safeParseInt(v.voting_power);
  }, 0);
  // JS numbers have no loss of precision up to 2^53, but we
  // error at over 2^52 since we have to do arithmetic. apps
  // should be able to keep voting power lower than this anyway
  if (totalVotingPower > 2 ** 52) {
    throw Error("Total voting power must be less than 2^52");
  }

  // verify enough voting power signed
  var twoThirds = Math.ceil(totalVotingPower * 2 / 3);
  if (committedVotingPower < twoThirds) {
    var error = Error("Not enough committed voting power");
    error.insufficientVotingPower = true;
    throw error;
  }
}

// verifies that a validator set is in the correct format
// and hashes to the correct value
function verifyValidatorSet(validators, expectedHash) {
  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = validators[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var validator = _step4.value;

      if (getAddress(validator.pub_key) !== validator.address) {
        throw Error("Validator address does not match pubkey");
      }

      validator.voting_power = safeParseInt(validator.voting_power);
      verifyPositiveInt(validator.voting_power);
      if (validator.voting_power === 0) {
        throw Error("Validator voting power must be > 0");
      }
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }

  var validatorSetHash = getValidatorSetHash(validators);
  if (expectedHash != null && validatorSetHash !== expectedHash) {
    throw Error("Validator set does not match what we expected");
  }
}

// verifies transition from one block to a higher one, given
// each block's header, commit, and validator set
function verify(oldState, newState) {
  var oldHeader = oldState.header;
  var oldValidators = oldState.validators;
  var newHeader = newState.header;
  var newValidators = newState.validators;

  if (newHeader.chain_id !== oldHeader.chain_id) {
    throw Error("Chain IDs do not match");
  }
  if (newHeader.height <= oldHeader.height) {
    throw Error("New state height must be higher than old state height");
  }

  var validatorSetChanged = newHeader.validators_hash !== oldHeader.validators_hash;
  if (validatorSetChanged && newValidators == null) {
    throw Error("Must specify new validator set");
  }

  // make sure new header has a valid commit
  var validators = validatorSetChanged ? newValidators : oldValidators;
  verifyCommit(newHeader, newState.commit, validators);

  if (validatorSetChanged) {
    // make sure new validator set is valid

    // make sure new validator set has correct hash
    verifyValidatorSet(newValidators, newHeader.validators_hash);

    // if previous state's `next_validators_hash` matches the new validator
    // set hash, then we already know it is valid
    if (oldHeader.next_validators_hash !== newHeader.validators_hash) {
      // otherwise, make sure new commit is signed by 2/3+ of old validator set.
      // sometimes we will take this path to skip ahead, we don't need any
      // headers between `oldState` and `newState` if this check passes
      verifyCommitSigs(newHeader, newState.commit, oldValidators);
    }

    // TODO: also pass transition if +2/3 of old validator set is still represented in commit
  }
}

module.exports = verify;
Object.assign(module.exports, {
  verifyCommit: verifyCommit,
  verifyCommitSigs: verifyCommitSigs,
  verifyValidatorSet: verifyValidatorSet,
  verify: verify,
  getVoteSignBytes: getVoteSignBytes
});