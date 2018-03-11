"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _index = require("./index");

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Account = function () {
  /**
   * @param {Credentials} credentials
   *    credentials to be used when interacting with the API.
   * @param {Object} options
   *    Addition Account options.
   */
  function Account(credentials) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Account);

    this.creds = credentials;
    this.options = options;

    // Used to facilitate testing of the call to the underlying object
    this._nexmo = this.options.nexmoOverride || _index2.default;

    this._nexmo.initialize(this.creds.apiKey, this.creds.apiSecret, this.options);
  }

  /**
   * TODO: document
   */


  _createClass(Account, [{
    key: "checkBalance",
    value: function checkBalance(callback) {
      return this.options.rest.get("/account/get-balance", callback);
    }
  }, {
    key: "updatePassword",
    value: function updatePassword(newSecret, callback) {
      return this.options.rest.postUseQueryString("/account/settings", { newSecret: newSecret }, callback);
    }
  }, {
    key: "updateSMSCallback",
    value: function updateSMSCallback(moCallBackUrl, callback) {
      return this.options.rest.postUseQueryString("/account/settings", { moCallBackUrl: moCallBackUrl }, callback);
    }
  }, {
    key: "updateDeliveryReceiptCallback",
    value: function updateDeliveryReceiptCallback(drCallBackUrl, callback) {
      return this.options.rest.postUseQueryString("/account/settings", { drCallBackUrl: drCallBackUrl }, callback);
    }
  }, {
    key: "topUp",
    value: function topUp(trx, callback) {
      return this.options.rest.postUseQueryString("/account/top-up", { trx: trx }, callback);
    }
  }]);

  return Account;
}();

exports.default = Account;
module.exports = exports["default"];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9BY2NvdW50LmpzIl0sIm5hbWVzIjpbIkFjY291bnQiLCJjcmVkZW50aWFscyIsIm9wdGlvbnMiLCJjcmVkcyIsIl9uZXhtbyIsIm5leG1vT3ZlcnJpZGUiLCJpbml0aWFsaXplIiwiYXBpS2V5IiwiYXBpU2VjcmV0IiwiY2FsbGJhY2siLCJyZXN0IiwiZ2V0IiwibmV3U2VjcmV0IiwicG9zdFVzZVF1ZXJ5U3RyaW5nIiwibW9DYWxsQmFja1VybCIsImRyQ2FsbEJhY2tVcmwiLCJ0cngiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OztBQUVBOzs7Ozs7OztJQUVNQSxPO0FBQ0o7Ozs7OztBQU1BLG1CQUFZQyxXQUFaLEVBQXVDO0FBQUEsUUFBZEMsT0FBYyx1RUFBSixFQUFJOztBQUFBOztBQUNyQyxTQUFLQyxLQUFMLEdBQWFGLFdBQWI7QUFDQSxTQUFLQyxPQUFMLEdBQWVBLE9BQWY7O0FBRUE7QUFDQSxTQUFLRSxNQUFMLEdBQWMsS0FBS0YsT0FBTCxDQUFhRyxhQUFiLG1CQUFkOztBQUVBLFNBQUtELE1BQUwsQ0FBWUUsVUFBWixDQUNFLEtBQUtILEtBQUwsQ0FBV0ksTUFEYixFQUVFLEtBQUtKLEtBQUwsQ0FBV0ssU0FGYixFQUdFLEtBQUtOLE9BSFA7QUFLRDs7QUFFRDs7Ozs7OztpQ0FHYU8sUSxFQUFVO0FBQ3JCLGFBQU8sS0FBS1AsT0FBTCxDQUFhUSxJQUFiLENBQWtCQyxHQUFsQixDQUFzQixzQkFBdEIsRUFBOENGLFFBQTlDLENBQVA7QUFDRDs7O21DQUVjRyxTLEVBQVdILFEsRUFBVTtBQUNsQyxhQUFPLEtBQUtQLE9BQUwsQ0FBYVEsSUFBYixDQUFrQkcsa0JBQWxCLENBQ0wsbUJBREssRUFFTCxFQUFFRCxvQkFBRixFQUZLLEVBR0xILFFBSEssQ0FBUDtBQUtEOzs7c0NBRWlCSyxhLEVBQWVMLFEsRUFBVTtBQUN6QyxhQUFPLEtBQUtQLE9BQUwsQ0FBYVEsSUFBYixDQUFrQkcsa0JBQWxCLENBQ0wsbUJBREssRUFFTCxFQUFFQyw0QkFBRixFQUZLLEVBR0xMLFFBSEssQ0FBUDtBQUtEOzs7a0RBRTZCTSxhLEVBQWVOLFEsRUFBVTtBQUNyRCxhQUFPLEtBQUtQLE9BQUwsQ0FBYVEsSUFBYixDQUFrQkcsa0JBQWxCLENBQ0wsbUJBREssRUFFTCxFQUFFRSw0QkFBRixFQUZLLEVBR0xOLFFBSEssQ0FBUDtBQUtEOzs7MEJBRUtPLEcsRUFBS1AsUSxFQUFVO0FBQ25CLGFBQU8sS0FBS1AsT0FBTCxDQUFhUSxJQUFiLENBQWtCRyxrQkFBbEIsQ0FDTCxpQkFESyxFQUVMLEVBQUVHLFFBQUYsRUFGSyxFQUdMUCxRQUhLLENBQVA7QUFLRDs7Ozs7O2tCQUdZVCxPIiwiZmlsZSI6IkFjY291bnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcblxuaW1wb3J0IG5leG1vIGZyb20gXCIuL2luZGV4XCI7XG5cbmNsYXNzIEFjY291bnQge1xuICAvKipcbiAgICogQHBhcmFtIHtDcmVkZW50aWFsc30gY3JlZGVudGlhbHNcbiAgICogICAgY3JlZGVudGlhbHMgdG8gYmUgdXNlZCB3aGVuIGludGVyYWN0aW5nIHdpdGggdGhlIEFQSS5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICogICAgQWRkaXRpb24gQWNjb3VudCBvcHRpb25zLlxuICAgKi9cbiAgY29uc3RydWN0b3IoY3JlZGVudGlhbHMsIG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMuY3JlZHMgPSBjcmVkZW50aWFscztcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG4gICAgLy8gVXNlZCB0byBmYWNpbGl0YXRlIHRlc3Rpbmcgb2YgdGhlIGNhbGwgdG8gdGhlIHVuZGVybHlpbmcgb2JqZWN0XG4gICAgdGhpcy5fbmV4bW8gPSB0aGlzLm9wdGlvbnMubmV4bW9PdmVycmlkZSB8fCBuZXhtbztcblxuICAgIHRoaXMuX25leG1vLmluaXRpYWxpemUoXG4gICAgICB0aGlzLmNyZWRzLmFwaUtleSxcbiAgICAgIHRoaXMuY3JlZHMuYXBpU2VjcmV0LFxuICAgICAgdGhpcy5vcHRpb25zXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUT0RPOiBkb2N1bWVudFxuICAgKi9cbiAgY2hlY2tCYWxhbmNlKGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5yZXN0LmdldChcIi9hY2NvdW50L2dldC1iYWxhbmNlXCIsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIHVwZGF0ZVBhc3N3b3JkKG5ld1NlY3JldCwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnJlc3QucG9zdFVzZVF1ZXJ5U3RyaW5nKFxuICAgICAgXCIvYWNjb3VudC9zZXR0aW5nc1wiLFxuICAgICAgeyBuZXdTZWNyZXQgfSxcbiAgICAgIGNhbGxiYWNrXG4gICAgKTtcbiAgfVxuXG4gIHVwZGF0ZVNNU0NhbGxiYWNrKG1vQ2FsbEJhY2tVcmwsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5yZXN0LnBvc3RVc2VRdWVyeVN0cmluZyhcbiAgICAgIFwiL2FjY291bnQvc2V0dGluZ3NcIixcbiAgICAgIHsgbW9DYWxsQmFja1VybCB9LFxuICAgICAgY2FsbGJhY2tcbiAgICApO1xuICB9XG5cbiAgdXBkYXRlRGVsaXZlcnlSZWNlaXB0Q2FsbGJhY2soZHJDYWxsQmFja1VybCwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLnJlc3QucG9zdFVzZVF1ZXJ5U3RyaW5nKFxuICAgICAgXCIvYWNjb3VudC9zZXR0aW5nc1wiLFxuICAgICAgeyBkckNhbGxCYWNrVXJsIH0sXG4gICAgICBjYWxsYmFja1xuICAgICk7XG4gIH1cblxuICB0b3BVcCh0cngsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5yZXN0LnBvc3RVc2VRdWVyeVN0cmluZyhcbiAgICAgIFwiL2FjY291bnQvdG9wLXVwXCIsXG4gICAgICB7IHRyeCB9LFxuICAgICAgY2FsbGJhY2tcbiAgICApO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEFjY291bnQ7XG4iXX0=