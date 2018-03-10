"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _Credentials = require("./Credentials");

var _Credentials2 = _interopRequireDefault(_Credentials);

var _JwtGenerator = require("./JwtGenerator");

var _JwtGenerator2 = _interopRequireDefault(_JwtGenerator);

var _Message = require("./Message");

var _Message2 = _interopRequireDefault(_Message);

var _Voice = require("./Voice");

var _Voice2 = _interopRequireDefault(_Voice);

var _Number = require("./Number");

var _Number2 = _interopRequireDefault(_Number);

var _Verify = require("./Verify");

var _Verify2 = _interopRequireDefault(_Verify);

var _NumberInsight = require("./NumberInsight");

var _NumberInsight2 = _interopRequireDefault(_NumberInsight);

var _App = require("./App");

var _App2 = _interopRequireDefault(_App);

var _Account = require("./Account");

var _Account2 = _interopRequireDefault(_Account);

var _CallsResource = require("./CallsResource");

var _CallsResource2 = _interopRequireDefault(_CallsResource);

var _FilesResource = require("./FilesResource");

var _FilesResource2 = _interopRequireDefault(_FilesResource);

var _Conversion = require("./Conversion");

var _Conversion2 = _interopRequireDefault(_Conversion);

var _Media = require("./Media");

var _Media2 = _interopRequireDefault(_Media);

var _HttpClient = require("./HttpClient");

var _HttpClient2 = _interopRequireDefault(_HttpClient);

var _NullLogger = require("./NullLogger");

var _NullLogger2 = _interopRequireDefault(_NullLogger);

var _ConsoleLogger = require("./ConsoleLogger");

var _ConsoleLogger2 = _interopRequireDefault(_ConsoleLogger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var jwtGeneratorInstance = new _JwtGenerator2.default();

var Nexmo = function () {
  /**
   * @param {Credentials} credentials - Nexmo API credentials
   * @param {string} credentials.apiKey - the Nexmo API key
   * @param {string} credentials.apiSecret - the Nexmo API secret
   * @param {Object} options - Additional options
   * @param {boolean} options.debug - `true` to turn on debug logging
   * @param {Object} options.logger - Set a custom logger.
   * @param {string} options.appendToUserAgent - A value to append to the user agent.
   *                    The value will be prefixed with a `/`
   */
  function Nexmo(credentials) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { debug: false };

    _classCallCheck(this, Nexmo);

    this.credentials = _Credentials2.default.parse(credentials);
    this.options = options;

    // If no logger has been supplied but debug has been set
    // default to using the ConsoleLogger
    if (!this.options.logger && this.options.debug) {
      this.options.logger = new _ConsoleLogger2.default();
    } else if (!this.options.logger) {
      // Swallow the logging
      this.options.logger = new _NullLogger2.default();
    }

    var userAgent = "nexmo-node/UNKNOWN node/UNKNOWN";
    try {
      var packageDetails = require(_path2.default.join(__dirname, "..", "package.json"));
      userAgent = "nexmo-node/" + packageDetails.version + " node/" + process.version.replace("v", "");
    } catch (e) {
      console.warn("Could not load package details");
    }
    this.options.userAgent = userAgent;
    if (this.options.appendToUserAgent) {
      this.options.userAgent += " " + this.options.appendToUserAgent;
    }

    // This is legacy, everything should use rest or api going forward
    this.options.httpClient = new _HttpClient2.default(Object.assign({ host: "rest.nexmo.com" }, this.options), this.credentials);

    // We have two different hosts, so we use two different HttpClients
    this.options.api = new _HttpClient2.default(Object.assign({ host: "api.nexmo.com" }, this.options), this.credentials);
    this.options.rest = new _HttpClient2.default(Object.assign({ host: "rest.nexmo.com" }, this.options), this.credentials);

    this.message = new _Message2.default(this.credentials, this.options);
    this.voice = new _Voice2.default(this.credentials, this.options);
    this.number = new _Number2.default(this.credentials, this.options);
    this.verify = new _Verify2.default(this.credentials, this.options);
    this.numberInsight = new _NumberInsight2.default(this.credentials, this.options);
    this.applications = new _App2.default(this.credentials, this.options);
    this.account = new _Account2.default(this.credentials, this.options);
    this.calls = new _CallsResource2.default(this.credentials, this.options);
    this.files = new _FilesResource2.default(this.credentials, this.options);
    this.conversion = new _Conversion2.default(this.credentials, this.options);
    this.media = new _Media2.default(this.credentials, this.options);

    /**
     * @deprecated Please use nexmo.applications
     */
    this.app = this.applications;
  }

  /**
   * Generate a JSON Web Token (JWT).
   *
   * The private key used upon Nexmo instance construction will be used to sign
   * the JWT. The application_id you used upon Nexmo instance creation will be
   * included in the claims for the JWT, however this can be overridden by passing
   * an application_id as part of the claims.
   *
   * @param {Object} claims - name/value pair claims to sign within the JWT
   *
   * @returns {String} the generated token
   */


  _createClass(Nexmo, [{
    key: "generateJwt",
    value: function generateJwt() {
      var claims = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if (claims.application_id === undefined) {
        claims.application_id = this.credentials.applicationId;
      }
      return Nexmo.generateJwt(this.credentials.privateKey, claims);
    }
  }]);

  return Nexmo;
}();

/**
 * Generate a JSON Web Token (JWT).
 *
 * @param {String|Buffer} privateKey - the path to the private key certificate
 *          to be used when signing the claims.
 * @param {Object} claims - name/value pair claims to sign within the JWT
 *
 * @returns {String} the generated token
 */


Nexmo.generateJwt = function (privateKey, claims) {
  if (!(privateKey instanceof Buffer)) {
    if (!_fs2.default.existsSync(privateKey)) {
      throw new Error("File \"" + privateKey + "\" not found.");
    } else {
      privateKey = _fs2.default.readFileSync(privateKey);
    }
  }
  return jwtGeneratorInstance.generate(privateKey, claims);
};

exports.default = Nexmo;
module.exports = exports["default"];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9OZXhtby5qcyJdLCJuYW1lcyI6WyJqd3RHZW5lcmF0b3JJbnN0YW5jZSIsIk5leG1vIiwiY3JlZGVudGlhbHMiLCJvcHRpb25zIiwiZGVidWciLCJwYXJzZSIsImxvZ2dlciIsInVzZXJBZ2VudCIsInBhY2thZ2VEZXRhaWxzIiwicmVxdWlyZSIsImpvaW4iLCJfX2Rpcm5hbWUiLCJ2ZXJzaW9uIiwicHJvY2VzcyIsInJlcGxhY2UiLCJlIiwiY29uc29sZSIsIndhcm4iLCJhcHBlbmRUb1VzZXJBZ2VudCIsImh0dHBDbGllbnQiLCJPYmplY3QiLCJhc3NpZ24iLCJob3N0IiwiYXBpIiwicmVzdCIsIm1lc3NhZ2UiLCJ2b2ljZSIsIm51bWJlciIsInZlcmlmeSIsIm51bWJlckluc2lnaHQiLCJhcHBsaWNhdGlvbnMiLCJhY2NvdW50IiwiY2FsbHMiLCJmaWxlcyIsImNvbnZlcnNpb24iLCJtZWRpYSIsImFwcCIsImNsYWltcyIsImFwcGxpY2F0aW9uX2lkIiwidW5kZWZpbmVkIiwiYXBwbGljYXRpb25JZCIsImdlbmVyYXRlSnd0IiwicHJpdmF0ZUtleSIsIkJ1ZmZlciIsImV4aXN0c1N5bmMiLCJFcnJvciIsInJlYWRGaWxlU3luYyIsImdlbmVyYXRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFFQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7QUFFQSxJQUFNQSx1QkFBdUIsNEJBQTdCOztJQUVNQyxLO0FBQ0o7Ozs7Ozs7Ozs7QUFVQSxpQkFBWUMsV0FBWixFQUFxRDtBQUFBLFFBQTVCQyxPQUE0Qix1RUFBbEIsRUFBRUMsT0FBTyxLQUFULEVBQWtCOztBQUFBOztBQUNuRCxTQUFLRixXQUFMLEdBQW1CLHNCQUFZRyxLQUFaLENBQWtCSCxXQUFsQixDQUFuQjtBQUNBLFNBQUtDLE9BQUwsR0FBZUEsT0FBZjs7QUFFQTtBQUNBO0FBQ0EsUUFBSSxDQUFDLEtBQUtBLE9BQUwsQ0FBYUcsTUFBZCxJQUF3QixLQUFLSCxPQUFMLENBQWFDLEtBQXpDLEVBQWdEO0FBQzlDLFdBQUtELE9BQUwsQ0FBYUcsTUFBYixHQUFzQiw2QkFBdEI7QUFDRCxLQUZELE1BRU8sSUFBSSxDQUFDLEtBQUtILE9BQUwsQ0FBYUcsTUFBbEIsRUFBMEI7QUFDL0I7QUFDQSxXQUFLSCxPQUFMLENBQWFHLE1BQWIsR0FBc0IsMEJBQXRCO0FBQ0Q7O0FBRUQsUUFBSUMsWUFBWSxpQ0FBaEI7QUFDQSxRQUFJO0FBQ0YsVUFBSUMsaUJBQWlCQyxRQUFRLGVBQUtDLElBQUwsQ0FBVUMsU0FBVixFQUFxQixJQUFyQixFQUEyQixjQUEzQixDQUFSLENBQXJCO0FBQ0FKLGtDQUNFQyxlQUFlSSxPQURqQixjQUVTQyxRQUFRRCxPQUFSLENBQWdCRSxPQUFoQixDQUF3QixHQUF4QixFQUE2QixFQUE3QixDQUZUO0FBR0QsS0FMRCxDQUtFLE9BQU9DLENBQVAsRUFBVTtBQUNWQyxjQUFRQyxJQUFSLENBQWEsZ0NBQWI7QUFDRDtBQUNELFNBQUtkLE9BQUwsQ0FBYUksU0FBYixHQUF5QkEsU0FBekI7QUFDQSxRQUFJLEtBQUtKLE9BQUwsQ0FBYWUsaUJBQWpCLEVBQW9DO0FBQ2xDLFdBQUtmLE9BQUwsQ0FBYUksU0FBYixVQUE4QixLQUFLSixPQUFMLENBQWFlLGlCQUEzQztBQUNEOztBQUVEO0FBQ0EsU0FBS2YsT0FBTCxDQUFhZ0IsVUFBYixHQUEwQix5QkFDeEJDLE9BQU9DLE1BQVAsQ0FBYyxFQUFFQyxNQUFNLGdCQUFSLEVBQWQsRUFBMEMsS0FBS25CLE9BQS9DLENBRHdCLEVBRXhCLEtBQUtELFdBRm1CLENBQTFCOztBQUtBO0FBQ0EsU0FBS0MsT0FBTCxDQUFhb0IsR0FBYixHQUFtQix5QkFDakJILE9BQU9DLE1BQVAsQ0FBYyxFQUFFQyxNQUFNLGVBQVIsRUFBZCxFQUF5QyxLQUFLbkIsT0FBOUMsQ0FEaUIsRUFFakIsS0FBS0QsV0FGWSxDQUFuQjtBQUlBLFNBQUtDLE9BQUwsQ0FBYXFCLElBQWIsR0FBb0IseUJBQ2xCSixPQUFPQyxNQUFQLENBQWMsRUFBRUMsTUFBTSxnQkFBUixFQUFkLEVBQTBDLEtBQUtuQixPQUEvQyxDQURrQixFQUVsQixLQUFLRCxXQUZhLENBQXBCOztBQUtBLFNBQUt1QixPQUFMLEdBQWUsc0JBQVksS0FBS3ZCLFdBQWpCLEVBQThCLEtBQUtDLE9BQW5DLENBQWY7QUFDQSxTQUFLdUIsS0FBTCxHQUFhLG9CQUFVLEtBQUt4QixXQUFmLEVBQTRCLEtBQUtDLE9BQWpDLENBQWI7QUFDQSxTQUFLd0IsTUFBTCxHQUFjLHFCQUFXLEtBQUt6QixXQUFoQixFQUE2QixLQUFLQyxPQUFsQyxDQUFkO0FBQ0EsU0FBS3lCLE1BQUwsR0FBYyxxQkFBVyxLQUFLMUIsV0FBaEIsRUFBNkIsS0FBS0MsT0FBbEMsQ0FBZDtBQUNBLFNBQUswQixhQUFMLEdBQXFCLDRCQUFrQixLQUFLM0IsV0FBdkIsRUFBb0MsS0FBS0MsT0FBekMsQ0FBckI7QUFDQSxTQUFLMkIsWUFBTCxHQUFvQixrQkFBUSxLQUFLNUIsV0FBYixFQUEwQixLQUFLQyxPQUEvQixDQUFwQjtBQUNBLFNBQUs0QixPQUFMLEdBQWUsc0JBQVksS0FBSzdCLFdBQWpCLEVBQThCLEtBQUtDLE9BQW5DLENBQWY7QUFDQSxTQUFLNkIsS0FBTCxHQUFhLDRCQUFrQixLQUFLOUIsV0FBdkIsRUFBb0MsS0FBS0MsT0FBekMsQ0FBYjtBQUNBLFNBQUs4QixLQUFMLEdBQWEsNEJBQWtCLEtBQUsvQixXQUF2QixFQUFvQyxLQUFLQyxPQUF6QyxDQUFiO0FBQ0EsU0FBSytCLFVBQUwsR0FBa0IseUJBQWUsS0FBS2hDLFdBQXBCLEVBQWlDLEtBQUtDLE9BQXRDLENBQWxCO0FBQ0EsU0FBS2dDLEtBQUwsR0FBYSxvQkFBVSxLQUFLakMsV0FBZixFQUE0QixLQUFLQyxPQUFqQyxDQUFiOztBQUVBOzs7QUFHQSxTQUFLaUMsR0FBTCxHQUFXLEtBQUtOLFlBQWhCO0FBQ0Q7O0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7a0NBWXlCO0FBQUEsVUFBYk8sTUFBYSx1RUFBSixFQUFJOztBQUN2QixVQUFJQSxPQUFPQyxjQUFQLEtBQTBCQyxTQUE5QixFQUF5QztBQUN2Q0YsZUFBT0MsY0FBUCxHQUF3QixLQUFLcEMsV0FBTCxDQUFpQnNDLGFBQXpDO0FBQ0Q7QUFDRCxhQUFPdkMsTUFBTXdDLFdBQU4sQ0FBa0IsS0FBS3ZDLFdBQUwsQ0FBaUJ3QyxVQUFuQyxFQUErQ0wsTUFBL0MsQ0FBUDtBQUNEOzs7Ozs7QUFHSDs7Ozs7Ozs7Ozs7QUFTQXBDLE1BQU13QyxXQUFOLEdBQW9CLFVBQUNDLFVBQUQsRUFBYUwsTUFBYixFQUF3QjtBQUMxQyxNQUFJLEVBQUVLLHNCQUFzQkMsTUFBeEIsQ0FBSixFQUFxQztBQUNuQyxRQUFJLENBQUMsYUFBR0MsVUFBSCxDQUFjRixVQUFkLENBQUwsRUFBZ0M7QUFDOUIsWUFBTSxJQUFJRyxLQUFKLGFBQW1CSCxVQUFuQixtQkFBTjtBQUNELEtBRkQsTUFFTztBQUNMQSxtQkFBYSxhQUFHSSxZQUFILENBQWdCSixVQUFoQixDQUFiO0FBQ0Q7QUFDRjtBQUNELFNBQU8xQyxxQkFBcUIrQyxRQUFyQixDQUE4QkwsVUFBOUIsRUFBMENMLE1BQTFDLENBQVA7QUFDRCxDQVREOztrQkFXZXBDLEsiLCJmaWxlIjoiTmV4bW8uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuXG5pbXBvcnQgQ3JlZGVudGlhbHMgZnJvbSBcIi4vQ3JlZGVudGlhbHNcIjtcbmltcG9ydCBKd3RHZW5lcmF0b3IgZnJvbSBcIi4vSnd0R2VuZXJhdG9yXCI7XG5pbXBvcnQgTWVzc2FnZSBmcm9tIFwiLi9NZXNzYWdlXCI7XG5pbXBvcnQgVm9pY2UgZnJvbSBcIi4vVm9pY2VcIjtcbmltcG9ydCBOdW1iZXIgZnJvbSBcIi4vTnVtYmVyXCI7XG5pbXBvcnQgVmVyaWZ5IGZyb20gXCIuL1ZlcmlmeVwiO1xuaW1wb3J0IE51bWJlckluc2lnaHQgZnJvbSBcIi4vTnVtYmVySW5zaWdodFwiO1xuaW1wb3J0IEFwcCBmcm9tIFwiLi9BcHBcIjtcbmltcG9ydCBBY2NvdW50IGZyb20gXCIuL0FjY291bnRcIjtcbmltcG9ydCBDYWxsc1Jlc291cmNlIGZyb20gXCIuL0NhbGxzUmVzb3VyY2VcIjtcbmltcG9ydCBGaWxlc1Jlc291cmNlIGZyb20gXCIuL0ZpbGVzUmVzb3VyY2VcIjtcbmltcG9ydCBDb252ZXJzaW9uIGZyb20gXCIuL0NvbnZlcnNpb25cIjtcbmltcG9ydCBNZWRpYSBmcm9tIFwiLi9NZWRpYVwiO1xuaW1wb3J0IEh0dHBDbGllbnQgZnJvbSBcIi4vSHR0cENsaWVudFwiO1xuaW1wb3J0IE51bGxMb2dnZXIgZnJvbSBcIi4vTnVsbExvZ2dlclwiO1xuaW1wb3J0IENvbnNvbGVMb2dnZXIgZnJvbSBcIi4vQ29uc29sZUxvZ2dlclwiO1xuXG5jb25zdCBqd3RHZW5lcmF0b3JJbnN0YW5jZSA9IG5ldyBKd3RHZW5lcmF0b3IoKTtcblxuY2xhc3MgTmV4bW8ge1xuICAvKipcbiAgICogQHBhcmFtIHtDcmVkZW50aWFsc30gY3JlZGVudGlhbHMgLSBOZXhtbyBBUEkgY3JlZGVudGlhbHNcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNyZWRlbnRpYWxzLmFwaUtleSAtIHRoZSBOZXhtbyBBUEkga2V5XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjcmVkZW50aWFscy5hcGlTZWNyZXQgLSB0aGUgTmV4bW8gQVBJIHNlY3JldFxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIEFkZGl0aW9uYWwgb3B0aW9uc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IG9wdGlvbnMuZGVidWcgLSBgdHJ1ZWAgdG8gdHVybiBvbiBkZWJ1ZyBsb2dnaW5nXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLmxvZ2dlciAtIFNldCBhIGN1c3RvbSBsb2dnZXIuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmFwcGVuZFRvVXNlckFnZW50IC0gQSB2YWx1ZSB0byBhcHBlbmQgdG8gdGhlIHVzZXIgYWdlbnQuXG4gICAqICAgICAgICAgICAgICAgICAgICBUaGUgdmFsdWUgd2lsbCBiZSBwcmVmaXhlZCB3aXRoIGEgYC9gXG4gICAqL1xuICBjb25zdHJ1Y3RvcihjcmVkZW50aWFscywgb3B0aW9ucyA9IHsgZGVidWc6IGZhbHNlIH0pIHtcbiAgICB0aGlzLmNyZWRlbnRpYWxzID0gQ3JlZGVudGlhbHMucGFyc2UoY3JlZGVudGlhbHMpO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgICAvLyBJZiBubyBsb2dnZXIgaGFzIGJlZW4gc3VwcGxpZWQgYnV0IGRlYnVnIGhhcyBiZWVuIHNldFxuICAgIC8vIGRlZmF1bHQgdG8gdXNpbmcgdGhlIENvbnNvbGVMb2dnZXJcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5sb2dnZXIgJiYgdGhpcy5vcHRpb25zLmRlYnVnKSB7XG4gICAgICB0aGlzLm9wdGlvbnMubG9nZ2VyID0gbmV3IENvbnNvbGVMb2dnZXIoKTtcbiAgICB9IGVsc2UgaWYgKCF0aGlzLm9wdGlvbnMubG9nZ2VyKSB7XG4gICAgICAvLyBTd2FsbG93IHRoZSBsb2dnaW5nXG4gICAgICB0aGlzLm9wdGlvbnMubG9nZ2VyID0gbmV3IE51bGxMb2dnZXIoKTtcbiAgICB9XG5cbiAgICBsZXQgdXNlckFnZW50ID0gXCJuZXhtby1ub2RlL1VOS05PV04gbm9kZS9VTktOT1dOXCI7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBwYWNrYWdlRGV0YWlscyA9IHJlcXVpcmUocGF0aC5qb2luKF9fZGlybmFtZSwgXCIuLlwiLCBcInBhY2thZ2UuanNvblwiKSk7XG4gICAgICB1c2VyQWdlbnQgPSBgbmV4bW8tbm9kZS8ke1xuICAgICAgICBwYWNrYWdlRGV0YWlscy52ZXJzaW9uXG4gICAgICB9IG5vZGUvJHtwcm9jZXNzLnZlcnNpb24ucmVwbGFjZShcInZcIiwgXCJcIil9YDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJDb3VsZCBub3QgbG9hZCBwYWNrYWdlIGRldGFpbHNcIik7XG4gICAgfVxuICAgIHRoaXMub3B0aW9ucy51c2VyQWdlbnQgPSB1c2VyQWdlbnQ7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5hcHBlbmRUb1VzZXJBZ2VudCkge1xuICAgICAgdGhpcy5vcHRpb25zLnVzZXJBZ2VudCArPSBgICR7dGhpcy5vcHRpb25zLmFwcGVuZFRvVXNlckFnZW50fWA7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBpcyBsZWdhY3ksIGV2ZXJ5dGhpbmcgc2hvdWxkIHVzZSByZXN0IG9yIGFwaSBnb2luZyBmb3J3YXJkXG4gICAgdGhpcy5vcHRpb25zLmh0dHBDbGllbnQgPSBuZXcgSHR0cENsaWVudChcbiAgICAgIE9iamVjdC5hc3NpZ24oeyBob3N0OiBcInJlc3QubmV4bW8uY29tXCIgfSwgdGhpcy5vcHRpb25zKSxcbiAgICAgIHRoaXMuY3JlZGVudGlhbHNcbiAgICApO1xuXG4gICAgLy8gV2UgaGF2ZSB0d28gZGlmZmVyZW50IGhvc3RzLCBzbyB3ZSB1c2UgdHdvIGRpZmZlcmVudCBIdHRwQ2xpZW50c1xuICAgIHRoaXMub3B0aW9ucy5hcGkgPSBuZXcgSHR0cENsaWVudChcbiAgICAgIE9iamVjdC5hc3NpZ24oeyBob3N0OiBcImFwaS5uZXhtby5jb21cIiB9LCB0aGlzLm9wdGlvbnMpLFxuICAgICAgdGhpcy5jcmVkZW50aWFsc1xuICAgICk7XG4gICAgdGhpcy5vcHRpb25zLnJlc3QgPSBuZXcgSHR0cENsaWVudChcbiAgICAgIE9iamVjdC5hc3NpZ24oeyBob3N0OiBcInJlc3QubmV4bW8uY29tXCIgfSwgdGhpcy5vcHRpb25zKSxcbiAgICAgIHRoaXMuY3JlZGVudGlhbHNcbiAgICApO1xuXG4gICAgdGhpcy5tZXNzYWdlID0gbmV3IE1lc3NhZ2UodGhpcy5jcmVkZW50aWFscywgdGhpcy5vcHRpb25zKTtcbiAgICB0aGlzLnZvaWNlID0gbmV3IFZvaWNlKHRoaXMuY3JlZGVudGlhbHMsIHRoaXMub3B0aW9ucyk7XG4gICAgdGhpcy5udW1iZXIgPSBuZXcgTnVtYmVyKHRoaXMuY3JlZGVudGlhbHMsIHRoaXMub3B0aW9ucyk7XG4gICAgdGhpcy52ZXJpZnkgPSBuZXcgVmVyaWZ5KHRoaXMuY3JlZGVudGlhbHMsIHRoaXMub3B0aW9ucyk7XG4gICAgdGhpcy5udW1iZXJJbnNpZ2h0ID0gbmV3IE51bWJlckluc2lnaHQodGhpcy5jcmVkZW50aWFscywgdGhpcy5vcHRpb25zKTtcbiAgICB0aGlzLmFwcGxpY2F0aW9ucyA9IG5ldyBBcHAodGhpcy5jcmVkZW50aWFscywgdGhpcy5vcHRpb25zKTtcbiAgICB0aGlzLmFjY291bnQgPSBuZXcgQWNjb3VudCh0aGlzLmNyZWRlbnRpYWxzLCB0aGlzLm9wdGlvbnMpO1xuICAgIHRoaXMuY2FsbHMgPSBuZXcgQ2FsbHNSZXNvdXJjZSh0aGlzLmNyZWRlbnRpYWxzLCB0aGlzLm9wdGlvbnMpO1xuICAgIHRoaXMuZmlsZXMgPSBuZXcgRmlsZXNSZXNvdXJjZSh0aGlzLmNyZWRlbnRpYWxzLCB0aGlzLm9wdGlvbnMpO1xuICAgIHRoaXMuY29udmVyc2lvbiA9IG5ldyBDb252ZXJzaW9uKHRoaXMuY3JlZGVudGlhbHMsIHRoaXMub3B0aW9ucyk7XG4gICAgdGhpcy5tZWRpYSA9IG5ldyBNZWRpYSh0aGlzLmNyZWRlbnRpYWxzLCB0aGlzLm9wdGlvbnMpO1xuXG4gICAgLyoqXG4gICAgICogQGRlcHJlY2F0ZWQgUGxlYXNlIHVzZSBuZXhtby5hcHBsaWNhdGlvbnNcbiAgICAgKi9cbiAgICB0aGlzLmFwcCA9IHRoaXMuYXBwbGljYXRpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIGEgSlNPTiBXZWIgVG9rZW4gKEpXVCkuXG4gICAqXG4gICAqIFRoZSBwcml2YXRlIGtleSB1c2VkIHVwb24gTmV4bW8gaW5zdGFuY2UgY29uc3RydWN0aW9uIHdpbGwgYmUgdXNlZCB0byBzaWduXG4gICAqIHRoZSBKV1QuIFRoZSBhcHBsaWNhdGlvbl9pZCB5b3UgdXNlZCB1cG9uIE5leG1vIGluc3RhbmNlIGNyZWF0aW9uIHdpbGwgYmVcbiAgICogaW5jbHVkZWQgaW4gdGhlIGNsYWltcyBmb3IgdGhlIEpXVCwgaG93ZXZlciB0aGlzIGNhbiBiZSBvdmVycmlkZGVuIGJ5IHBhc3NpbmdcbiAgICogYW4gYXBwbGljYXRpb25faWQgYXMgcGFydCBvZiB0aGUgY2xhaW1zLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gY2xhaW1zIC0gbmFtZS92YWx1ZSBwYWlyIGNsYWltcyB0byBzaWduIHdpdGhpbiB0aGUgSldUXG4gICAqXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9IHRoZSBnZW5lcmF0ZWQgdG9rZW5cbiAgICovXG4gIGdlbmVyYXRlSnd0KGNsYWltcyA9IHt9KSB7XG4gICAgaWYgKGNsYWltcy5hcHBsaWNhdGlvbl9pZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjbGFpbXMuYXBwbGljYXRpb25faWQgPSB0aGlzLmNyZWRlbnRpYWxzLmFwcGxpY2F0aW9uSWQ7XG4gICAgfVxuICAgIHJldHVybiBOZXhtby5nZW5lcmF0ZUp3dCh0aGlzLmNyZWRlbnRpYWxzLnByaXZhdGVLZXksIGNsYWltcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSBhIEpTT04gV2ViIFRva2VuIChKV1QpLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfEJ1ZmZlcn0gcHJpdmF0ZUtleSAtIHRoZSBwYXRoIHRvIHRoZSBwcml2YXRlIGtleSBjZXJ0aWZpY2F0ZVxuICogICAgICAgICAgdG8gYmUgdXNlZCB3aGVuIHNpZ25pbmcgdGhlIGNsYWltcy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBjbGFpbXMgLSBuYW1lL3ZhbHVlIHBhaXIgY2xhaW1zIHRvIHNpZ24gd2l0aGluIHRoZSBKV1RcbiAqXG4gKiBAcmV0dXJucyB7U3RyaW5nfSB0aGUgZ2VuZXJhdGVkIHRva2VuXG4gKi9cbk5leG1vLmdlbmVyYXRlSnd0ID0gKHByaXZhdGVLZXksIGNsYWltcykgPT4ge1xuICBpZiAoIShwcml2YXRlS2V5IGluc3RhbmNlb2YgQnVmZmVyKSkge1xuICAgIGlmICghZnMuZXhpc3RzU3luYyhwcml2YXRlS2V5KSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBGaWxlIFwiJHtwcml2YXRlS2V5fVwiIG5vdCBmb3VuZC5gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJpdmF0ZUtleSA9IGZzLnJlYWRGaWxlU3luYyhwcml2YXRlS2V5KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGp3dEdlbmVyYXRvckluc3RhbmNlLmdlbmVyYXRlKHByaXZhdGVLZXksIGNsYWltcyk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBOZXhtbztcbiJdfQ==