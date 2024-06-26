'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var old = require('old');
var EventEmitter = require('events');
var RpcClient = require('./rpc.js');

var _require = require('./verify.js'),
    verifyCommit = _require.verifyCommit,
    verifyCommitSigs = _require.verifyCommitSigs,
    verifyValidatorSet = _require.verifyValidatorSet,
    verify = _require.verify;

var _require2 = require('./hash.js'),
    getValidatorSetHash = _require2.getValidatorSetHash;

var _require3 = require('./common.js'),
    safeParseInt = _require3.safeParseInt;

var HOUR = 60 * 60 * 1000;
var FOUR_HOURS = 4 * HOUR;
var THIRTY_DAYS = 30 * 24 * HOUR;

// TODO: support multiple peers
// (multiple connections to listen for headers,
// get current height from multiple peers before syncing,
// randomly select peer when requesting data,
// broadcast txs to many peers)

// TODO: on error, disconnect from peer and try again

// TODO: use time heuristic to ensure nodes can't DoS by
// sending fake high heights.
// (applies to getting height when getting status in `sync()`,
// and when receiving a block in `update()`)

// talks to nodes via RPC and does light-client verification
// of block headers.

var LightNode = function (_EventEmitter) {
  _inherits(LightNode, _EventEmitter);

  function LightNode(peer, state) {
    var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, LightNode);

    var _this = _possibleConstructorReturn(this, (LightNode.__proto__ || Object.getPrototypeOf(LightNode)).call(this));

    _this.maxAge = opts.maxAge || THIRTY_DAYS;

    if (state.header.height == null) {
      throw Error('Expected state header to have a height');
    }
    state.header.height = safeParseInt(state.header.height);

    // we should be able to trust this state since it was either
    // hardcoded into the client, or previously verified/stored,
    // but it doesn't hurt to do a sanity check. commit verifification
    // not required for first block, since we might be deriving it from
    // genesis
    verifyValidatorSet(state.validators, state.header.validators_hash);
    if (state.header.height > 1 || state.commit != null) {
      verifyCommit(state.header, state.commit, state.validators);
    } else {
      // add genesis validator hash to state
      var validatorHash = getValidatorSetHash(state.validators);
      state.header.validators_hash = validatorHash.toString('hex').toUpperCase();
    }

    _this._state = state;

    _this.rpc = RpcClient(peer);
    // TODO: ensure we're using websocket
    _this.emitError = _this.emitError.bind(_this);
    _this.rpc.on('error', _this.emitError);

    _this.handleError(_this.initialSync)().then(function () {
      return _this.emit('synced');
    });
    return _this;
  }

  _createClass(LightNode, [{
    key: 'handleError',
    value: function handleError(func) {
      var _this2 = this;

      return function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return func.call.apply(func, [_this2].concat(args)).catch(function (err) {
          return _this2.emitError(err);
        });
      };
    }
  }, {
    key: 'emitError',
    value: function emitError(err) {
      this.rpc.close();
      this.emit('error', err);
    }
  }, {
    key: 'state',
    value: function state() {
      // TODO: deep clone
      return Object.assign({}, this._state);
    }
  }, {
    key: 'height',
    value: function height() {
      return this._state.header.height;
    }

    // sync from current state to latest block

  }, {
    key: 'initialSync',
    value: async function initialSync() {
      // TODO: use time heuristic (see comment at top of file)
      // TODO: get tip height from multiple peers and make sure
      //       they give us similar results
      var status = await this.rpc.status();
      var tip = safeParseInt(status.sync_info.latest_block_height);
      if (tip > this.height()) {
        await this.syncTo(tip);
      }
      this.handleError(this.subscribe)();
    }

    // binary search to find furthest block from our current state,
    // which is signed by 2/3+ voting power of our current validator set

  }, {
    key: 'syncTo',
    value: async function syncTo(nextHeight) {
      var targetHeight = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : nextHeight;

      var _ref = await this.rpc.commit({ height: nextHeight }),
          _ref$signed_header = _ref.signed_header,
          header = _ref$signed_header.header,
          commit = _ref$signed_header.commit;

      header.height = safeParseInt(header.height);

      try {
        // try to verify (throws if we can't)
        await this.update(header, commit);

        // reached target
        if (nextHeight === targetHeight) return;

        // continue syncing from this point
        return this.syncTo(targetHeight);
      } catch (err) {
        // throw real errors
        if (!err.insufficientVotingPower) {
          throw err;
        }

        // insufficient verifiable voting power error,
        // couldn't verify this header

        var height = this.height();
        if (nextHeight === height + 1) {
          // should not happen unless peer sends us fake transition
          throw Error('Could not verify transition');
        }

        // let's try going halfway back and see if we can verify
        var midpoint = height + Math.ceil((nextHeight - height) / 2);
        return this.syncTo(midpoint, targetHeight);
      }
    }

    // start verifying new blocks as they come in

  }, {
    key: 'subscribe',
    value: async function subscribe() {
      var _this3 = this;

      var query = 'tm.event = \'NewBlockHeader\'';
      var syncing = false;
      var targetHeight = this.height();
      await this.rpc.subscribe({ query: query }, this.handleError(async function (_ref2) {
        var header = _ref2.header;

        header.height = safeParseInt(header.height);
        targetHeight = header.height;

        // don't start another sync loop if we are in the middle of syncing
        if (syncing) return;
        syncing = true;

        // sync one block at a time to target
        while (_this3.height() < targetHeight) {
          await _this3.syncTo(_this3.height() + 1);
        }

        // unlock
        syncing = false;
      }));
    }
  }, {
    key: 'update',
    value: async function update(header, commit) {
      header.height = safeParseInt(header.height);
      var height = header.height;

      // make sure we aren't syncing from longer than than the unbonding period

      var prevTime = new Date(this._state.header.time).getTime();
      if (Date.now() - prevTime > this.maxAge) {
        throw Error('Our state is too old, cannot update safely');
      }

      // make sure new commit isn't too far in the future
      var nextTime = new Date(header.time).getTime();
      if (nextTime - Date.now() > FOUR_HOURS) {
        throw Error('Header time is too far in the future');
      }

      if (commit == null) {
        var res = await this.rpc.commit({ height: height });
        commit = res.signed_header.commit;
        commit.header.height = safeParseInt(commit.header.height);
      }

      var validators = this._state.validators;

      var validatorSetChanged = header.validators_hash !== this._state.header.validators_hash;
      if (validatorSetChanged) {
        var _res = await this.rpc.validators({ height: height, per_page: -1 });
        validators = _res.validators;
      }

      var newState = { header: header, commit: commit, validators: validators };
      verify(this._state, newState);

      this._state = newState;
      this.emit('update', header, commit, validators);
    }
  }, {
    key: 'close',
    value: function close() {
      this.rpc.close();
    }
  }]);

  return LightNode;
}(EventEmitter);

module.exports = old(LightNode);