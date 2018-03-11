"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var https = require("https");
var http = require("http");
var request = require("request");
var querystring = require("querystring");

var HttpClient = function () {
  function HttpClient(options, credentials) {
    _classCallCheck(this, HttpClient);

    this.credentials = credentials;
    this.host = options.host || "rest.nexmo.com";
    this.port = options.port || 443;
    this.https = options.https || https;
    this.http = options.http || http;
    this.headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    };
    this.logger = options.logger;
    this.timeout = options.timeout;
    this.requestLib = request;

    if (options.userAgent) {
      this.headers["User-Agent"] = options.userAgent;
    }
  }

  _createClass(HttpClient, [{
    key: "request",
    value: function request(endpoint, method, callback) {
      var _this = this;

      var skipJsonParsing = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      if (typeof method === "function") {
        callback = method;
        endpoint.method = endpoint.method || "GET";
      } else if (typeof method !== "undefined") {
        endpoint.method = method;
      }

      if (endpoint.method === "POST" || endpoint.method === "DELETE") {
        // TODO: verify the following fix is required
        // Fix broken due ot 411 Content-Length error now sent by Nexmo API
        // PL 2016-Sept-6 - commented out Content-Length 0
        // headers['Content-Length'] = 0;
      }
      var options = {
        host: endpoint.host ? endpoint.host : this.host,
        port: this.port,
        path: endpoint.path,
        method: endpoint.method,
        headers: Object.assign({}, this.headers)
      };

      if (this.timeout !== undefined) {
        options.timeout = this.timeout;
      }

      // Allow existing headers to be overridden
      // Allow new headers to be added
      if (endpoint.headers) {
        Object.keys(endpoint.headers).forEach(function (key) {
          options.headers[key] = endpoint.headers[key];
        });
      }

      this.logger.info("Request:", options, "\nBody:", endpoint.body);
      var request;

      if (options.port === 443) {
        request = this.https.request(options);
      } else {
        request = this.http.request(options);
      }

      request.end(endpoint.body);

      // Keep an array of String or Buffers,
      // depending on content type (binary or JSON) of response
      var responseData = [];

      request.on("response", function (response) {
        var isBinary = response.headers["content-type"] === "application/octet-stream";
        if (!isBinary) {
          response.setEncoding("utf8");
        }

        response.on("data", function (chunk) {
          responseData.push(chunk);
        });

        response.on("end", function () {
          _this.logger.info("response ended:", response.statusCode);
          if (callback) {
            if (isBinary) {
              responseData = Buffer.concat(responseData);
            }

            _this.__parseResponse(response, responseData, endpoint.method, callback, skipJsonParsing);
          }
        });
        response.on("close", function (e) {
          _this.logger.error("problem with API request detailed stacktrace below ");
          _this.logger.error(e);
          callback(e);
        });
      });
      request.on("error", function (e) {
        _this.logger.error("problem with API request detailed stacktrace below ");
        _this.logger.error(e);
        callback(e);
      });
    }
  }, {
    key: "__parseResponse",
    value: function __parseResponse(httpResponse, data, method, callback, skipJsonParsing) {
      var isArrayOrBuffer = data instanceof Array || data instanceof Buffer;
      if (!isArrayOrBuffer) {
        throw new Error("data should be of type Array or Buffer");
      }

      var status = httpResponse.statusCode;
      var headers = httpResponse.headers;

      var response = null;
      var error = null;

      try {
        if (status >= 500) {
          error = { message: "Server Error", statusCode: status };
        } else if (httpResponse.headers["content-type"] === "application/octet-stream") {
          response = data;
        } else if (status === 429) {
          // 429 does not return a parsable body
          if (!headers["retry-after"]) {
            // retry based on allowed per second
            var retryAfterMillis = method === "POST" ? 1000 / 2 : 1000 / 5;
            headers["retry-after"] = retryAfterMillis;
          }
          error = { body: data.join("") };
        } else if (status === 204) {
          response = null;
        } else if (status >= 400 || status < 200) {
          error = { body: JSON.parse(data.join("")), headers: headers };
        } else if (method !== "DELETE") {
          if (!!skipJsonParsing) {
            response = data.join("");
          } else {
            response = JSON.parse(data.join(""));
          }
        } else {
          response = data;
        }
      } catch (parseError) {
        this.logger.error(parseError);
        this.logger.error("could not convert API response to JSON, above error is ignored and raw API response is returned to client");
        this.logger.error("Raw Error message from API ");
        this.logger.error("\"" + data + "\"");

        error = {
          status: status,
          message: "The API response could not be parsed.",
          body: data.join(""),
          parseError: parseError
        };
      }

      if (error) {
        error.statusCode = status;
        error.headers = headers;
      }

      if (typeof callback === "function") {
        callback(error, response);
      }
    }
  }, {
    key: "_addLimitedAccessMessageToErrors",
    value: function _addLimitedAccessMessageToErrors(callback, limitedAccessStatus) {
      return function (err, data) {
        if (err && err.status == limitedAccessStatus) {
          err._INFO_ = "This endpoint may need activating on your account. Please email support@nexmo.com for more information";
        }

        return callback(err, data);
      };
    }
  }, {
    key: "get",
    value: function get(path, params, callback) {
      var useJwt = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      if (!callback) {
        if (typeof params == "function") {
          callback = params;
          params = {};
        }
      }

      params = params || {};
      if (!useJwt) {
        params["api_key"] = this.credentials.apiKey;
        params["api_secret"] = this.credentials.apiSecret;
      }

      path = path + "?" + querystring.stringify(params);

      var headers = { "Content-Type": "application/json" };
      if (useJwt) {
        headers["Authorization"] = "Bearer " + this.credentials.generateJwt();
      }

      this.request({ path: path, headers: headers }, "GET", callback);
    }
  }, {
    key: "delete",
    value: function _delete(path, callback, useJwt) {
      var params = {};
      if (!useJwt) {
        params["api_key"] = this.credentials.apiKey;
        params["api_secret"] = this.credentials.apiSecret;
      }

      path = path + "?" + querystring.stringify(params);

      this.request({ path: path }, "DELETE", callback);
    }
  }, {
    key: "postFile",
    value: function postFile(path, options, callback, useJwt) {
      var qs = {};
      if (!useJwt) {
        qs["api_key"] = this.credentials.apiKey;
        qs["api_secret"] = this.credentials.apiSecret;
      }

      if (Object.keys(qs).length) {
        var joinChar = "?";
        if (path.indexOf(joinChar) !== -1) {
          joinChar = "&";
        }
        path = path + joinChar + querystring.stringify(qs);
      }

      var file = options.file;
      delete options.file; // We don't send this as metadata

      var formData = {};

      if (file) {
        formData["filedata"] = {
          value: file,
          options: {
            filename: options.filename || null
          }
        };
      }

      if (options.info) {
        formData.info = JSON.stringify(options.info);
      }

      if (options.url) {
        formData.url = options.url;
      }

      this.requestLib.post({
        url: "https://" + this.host + path,
        formData: formData,
        headers: {
          Authorization: "Bearer " + this.credentials.generateJwt()
        }
      }, callback);
    }
  }, {
    key: "post",
    value: function post(path, params, callback, useJwt) {
      var qs = {};
      if (!useJwt) {
        qs["api_key"] = this.credentials.apiKey;
        qs["api_secret"] = this.credentials.apiSecret;
      }

      var joinChar = "?";
      if (path.indexOf(joinChar) !== -1) {
        joinChar = "&";
      }

      path = path + joinChar + querystring.stringify(qs);

      this.request({ path: path, body: querystring.stringify(params) }, "POST", callback);
    }
  }, {
    key: "postUseQueryString",
    value: function postUseQueryString(path, params, callback, useJwt) {
      params = params || {};
      if (!useJwt) {
        params["api_key"] = this.credentials.apiKey;
        params["api_secret"] = this.credentials.apiSecret;
      }

      path = path + "?" + querystring.stringify(params);

      this.request({ path: path }, "POST", callback);
    }
  }]);

  return HttpClient;
}();

exports.default = HttpClient;
module.exports = exports["default"];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9IdHRwQ2xpZW50LmpzIl0sIm5hbWVzIjpbImh0dHBzIiwicmVxdWlyZSIsImh0dHAiLCJyZXF1ZXN0IiwicXVlcnlzdHJpbmciLCJIdHRwQ2xpZW50Iiwib3B0aW9ucyIsImNyZWRlbnRpYWxzIiwiaG9zdCIsInBvcnQiLCJoZWFkZXJzIiwiQWNjZXB0IiwibG9nZ2VyIiwidGltZW91dCIsInJlcXVlc3RMaWIiLCJ1c2VyQWdlbnQiLCJlbmRwb2ludCIsIm1ldGhvZCIsImNhbGxiYWNrIiwic2tpcEpzb25QYXJzaW5nIiwicGF0aCIsIk9iamVjdCIsImFzc2lnbiIsInVuZGVmaW5lZCIsImtleXMiLCJmb3JFYWNoIiwia2V5IiwiaW5mbyIsImJvZHkiLCJlbmQiLCJyZXNwb25zZURhdGEiLCJvbiIsImlzQmluYXJ5IiwicmVzcG9uc2UiLCJzZXRFbmNvZGluZyIsInB1c2giLCJjaHVuayIsInN0YXR1c0NvZGUiLCJCdWZmZXIiLCJjb25jYXQiLCJfX3BhcnNlUmVzcG9uc2UiLCJlcnJvciIsImUiLCJodHRwUmVzcG9uc2UiLCJkYXRhIiwiaXNBcnJheU9yQnVmZmVyIiwiQXJyYXkiLCJFcnJvciIsInN0YXR1cyIsIm1lc3NhZ2UiLCJyZXRyeUFmdGVyTWlsbGlzIiwiam9pbiIsIkpTT04iLCJwYXJzZSIsInBhcnNlRXJyb3IiLCJsaW1pdGVkQWNjZXNzU3RhdHVzIiwiZXJyIiwiX0lORk9fIiwicGFyYW1zIiwidXNlSnd0IiwiYXBpS2V5IiwiYXBpU2VjcmV0Iiwic3RyaW5naWZ5IiwiZ2VuZXJhdGVKd3QiLCJxcyIsImxlbmd0aCIsImpvaW5DaGFyIiwiaW5kZXhPZiIsImZpbGUiLCJmb3JtRGF0YSIsInZhbHVlIiwiZmlsZW5hbWUiLCJ1cmwiLCJwb3N0IiwiQXV0aG9yaXphdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLElBQUlBLFFBQVFDLFFBQVEsT0FBUixDQUFaO0FBQ0EsSUFBSUMsT0FBT0QsUUFBUSxNQUFSLENBQVg7QUFDQSxJQUFJRSxVQUFVRixRQUFRLFNBQVIsQ0FBZDtBQUNBLElBQUlHLGNBQWNILFFBQVEsYUFBUixDQUFsQjs7SUFFTUksVTtBQUNKLHNCQUFZQyxPQUFaLEVBQXFCQyxXQUFyQixFQUFrQztBQUFBOztBQUNoQyxTQUFLQSxXQUFMLEdBQW1CQSxXQUFuQjtBQUNBLFNBQUtDLElBQUwsR0FBWUYsUUFBUUUsSUFBUixJQUFnQixnQkFBNUI7QUFDQSxTQUFLQyxJQUFMLEdBQVlILFFBQVFHLElBQVIsSUFBZ0IsR0FBNUI7QUFDQSxTQUFLVCxLQUFMLEdBQWFNLFFBQVFOLEtBQVIsSUFBaUJBLEtBQTlCO0FBQ0EsU0FBS0UsSUFBTCxHQUFZSSxRQUFRSixJQUFSLElBQWdCQSxJQUE1QjtBQUNBLFNBQUtRLE9BQUwsR0FBZTtBQUNiLHNCQUFnQixtQ0FESDtBQUViQyxjQUFRO0FBRkssS0FBZjtBQUlBLFNBQUtDLE1BQUwsR0FBY04sUUFBUU0sTUFBdEI7QUFDQSxTQUFLQyxPQUFMLEdBQWVQLFFBQVFPLE9BQXZCO0FBQ0EsU0FBS0MsVUFBTCxHQUFrQlgsT0FBbEI7O0FBRUEsUUFBSUcsUUFBUVMsU0FBWixFQUF1QjtBQUNyQixXQUFLTCxPQUFMLENBQWEsWUFBYixJQUE2QkosUUFBUVMsU0FBckM7QUFDRDtBQUNGOzs7OzRCQUVPQyxRLEVBQVVDLE0sRUFBUUMsUSxFQUFtQztBQUFBOztBQUFBLFVBQXpCQyxlQUF5Qix1RUFBUCxLQUFPOztBQUMzRCxVQUFJLE9BQU9GLE1BQVAsS0FBa0IsVUFBdEIsRUFBa0M7QUFDaENDLG1CQUFXRCxNQUFYO0FBQ0FELGlCQUFTQyxNQUFULEdBQWtCRCxTQUFTQyxNQUFULElBQW1CLEtBQXJDO0FBQ0QsT0FIRCxNQUdPLElBQUksT0FBT0EsTUFBUCxLQUFrQixXQUF0QixFQUFtQztBQUN4Q0QsaUJBQVNDLE1BQVQsR0FBa0JBLE1BQWxCO0FBQ0Q7O0FBRUQsVUFBSUQsU0FBU0MsTUFBVCxLQUFvQixNQUFwQixJQUE4QkQsU0FBU0MsTUFBVCxLQUFvQixRQUF0RCxFQUFnRTtBQUM5RDtBQUNBO0FBQ0E7QUFDQTtBQUNEO0FBQ0QsVUFBSVgsVUFBVTtBQUNaRSxjQUFNUSxTQUFTUixJQUFULEdBQWdCUSxTQUFTUixJQUF6QixHQUFnQyxLQUFLQSxJQUQvQjtBQUVaQyxjQUFNLEtBQUtBLElBRkM7QUFHWlcsY0FBTUosU0FBU0ksSUFISDtBQUlaSCxnQkFBUUQsU0FBU0MsTUFKTDtBQUtaUCxpQkFBU1csT0FBT0MsTUFBUCxDQUFjLEVBQWQsRUFBa0IsS0FBS1osT0FBdkI7QUFMRyxPQUFkOztBQVFBLFVBQUksS0FBS0csT0FBTCxLQUFpQlUsU0FBckIsRUFBZ0M7QUFDOUJqQixnQkFBUU8sT0FBUixHQUFrQixLQUFLQSxPQUF2QjtBQUNEOztBQUVEO0FBQ0E7QUFDQSxVQUFJRyxTQUFTTixPQUFiLEVBQXNCO0FBQ3BCVyxlQUFPRyxJQUFQLENBQVlSLFNBQVNOLE9BQXJCLEVBQThCZSxPQUE5QixDQUFzQyxVQUFTQyxHQUFULEVBQWM7QUFDbERwQixrQkFBUUksT0FBUixDQUFnQmdCLEdBQWhCLElBQXVCVixTQUFTTixPQUFULENBQWlCZ0IsR0FBakIsQ0FBdkI7QUFDRCxTQUZEO0FBR0Q7O0FBRUQsV0FBS2QsTUFBTCxDQUFZZSxJQUFaLENBQWlCLFVBQWpCLEVBQTZCckIsT0FBN0IsRUFBc0MsU0FBdEMsRUFBaURVLFNBQVNZLElBQTFEO0FBQ0EsVUFBSXpCLE9BQUo7O0FBRUEsVUFBSUcsUUFBUUcsSUFBUixLQUFpQixHQUFyQixFQUEwQjtBQUN4Qk4sa0JBQVUsS0FBS0gsS0FBTCxDQUFXRyxPQUFYLENBQW1CRyxPQUFuQixDQUFWO0FBQ0QsT0FGRCxNQUVPO0FBQ0xILGtCQUFVLEtBQUtELElBQUwsQ0FBVUMsT0FBVixDQUFrQkcsT0FBbEIsQ0FBVjtBQUNEOztBQUVESCxjQUFRMEIsR0FBUixDQUFZYixTQUFTWSxJQUFyQjs7QUFFQTtBQUNBO0FBQ0EsVUFBSUUsZUFBZSxFQUFuQjs7QUFFQTNCLGNBQVE0QixFQUFSLENBQVcsVUFBWCxFQUF1QixvQkFBWTtBQUNqQyxZQUFJQyxXQUNGQyxTQUFTdkIsT0FBVCxDQUFpQixjQUFqQixNQUFxQywwQkFEdkM7QUFFQSxZQUFJLENBQUNzQixRQUFMLEVBQWU7QUFDYkMsbUJBQVNDLFdBQVQsQ0FBcUIsTUFBckI7QUFDRDs7QUFFREQsaUJBQVNGLEVBQVQsQ0FBWSxNQUFaLEVBQW9CLGlCQUFTO0FBQzNCRCx1QkFBYUssSUFBYixDQUFrQkMsS0FBbEI7QUFDRCxTQUZEOztBQUlBSCxpQkFBU0YsRUFBVCxDQUFZLEtBQVosRUFBbUIsWUFBTTtBQUN2QixnQkFBS25CLE1BQUwsQ0FBWWUsSUFBWixDQUFpQixpQkFBakIsRUFBb0NNLFNBQVNJLFVBQTdDO0FBQ0EsY0FBSW5CLFFBQUosRUFBYztBQUNaLGdCQUFJYyxRQUFKLEVBQWM7QUFDWkYsNkJBQWVRLE9BQU9DLE1BQVAsQ0FBY1QsWUFBZCxDQUFmO0FBQ0Q7O0FBRUQsa0JBQUtVLGVBQUwsQ0FDRVAsUUFERixFQUVFSCxZQUZGLEVBR0VkLFNBQVNDLE1BSFgsRUFJRUMsUUFKRixFQUtFQyxlQUxGO0FBT0Q7QUFDRixTQWZEO0FBZ0JBYyxpQkFBU0YsRUFBVCxDQUFZLE9BQVosRUFBcUIsYUFBSztBQUN4QixnQkFBS25CLE1BQUwsQ0FBWTZCLEtBQVosQ0FDRSxxREFERjtBQUdBLGdCQUFLN0IsTUFBTCxDQUFZNkIsS0FBWixDQUFrQkMsQ0FBbEI7QUFDQXhCLG1CQUFTd0IsQ0FBVDtBQUNELFNBTkQ7QUFPRCxPQWxDRDtBQW1DQXZDLGNBQVE0QixFQUFSLENBQVcsT0FBWCxFQUFvQixhQUFLO0FBQ3ZCLGNBQUtuQixNQUFMLENBQVk2QixLQUFaLENBQWtCLHFEQUFsQjtBQUNBLGNBQUs3QixNQUFMLENBQVk2QixLQUFaLENBQWtCQyxDQUFsQjtBQUNBeEIsaUJBQVN3QixDQUFUO0FBQ0QsT0FKRDtBQUtEOzs7b0NBRWVDLFksRUFBY0MsSSxFQUFNM0IsTSxFQUFRQyxRLEVBQVVDLGUsRUFBaUI7QUFDckUsVUFBTTBCLGtCQUFrQkQsZ0JBQWdCRSxLQUFoQixJQUF5QkYsZ0JBQWdCTixNQUFqRTtBQUNBLFVBQUksQ0FBQ08sZUFBTCxFQUFzQjtBQUNwQixjQUFNLElBQUlFLEtBQUosQ0FBVSx3Q0FBVixDQUFOO0FBQ0Q7O0FBRUQsVUFBTUMsU0FBU0wsYUFBYU4sVUFBNUI7QUFDQSxVQUFNM0IsVUFBVWlDLGFBQWFqQyxPQUE3Qjs7QUFFQSxVQUFJdUIsV0FBVyxJQUFmO0FBQ0EsVUFBSVEsUUFBUSxJQUFaOztBQUVBLFVBQUk7QUFDRixZQUFJTyxVQUFVLEdBQWQsRUFBbUI7QUFDakJQLGtCQUFRLEVBQUVRLFNBQVMsY0FBWCxFQUEyQlosWUFBWVcsTUFBdkMsRUFBUjtBQUNELFNBRkQsTUFFTyxJQUNMTCxhQUFhakMsT0FBYixDQUFxQixjQUFyQixNQUF5QywwQkFEcEMsRUFFTDtBQUNBdUIscUJBQVdXLElBQVg7QUFDRCxTQUpNLE1BSUEsSUFBSUksV0FBVyxHQUFmLEVBQW9CO0FBQ3pCO0FBQ0EsY0FBSSxDQUFDdEMsUUFBUSxhQUFSLENBQUwsRUFBNkI7QUFDM0I7QUFDQSxnQkFBTXdDLG1CQUFtQmpDLFdBQVcsTUFBWCxHQUFvQixPQUFPLENBQTNCLEdBQStCLE9BQU8sQ0FBL0Q7QUFDQVAsb0JBQVEsYUFBUixJQUF5QndDLGdCQUF6QjtBQUNEO0FBQ0RULGtCQUFRLEVBQUViLE1BQU1nQixLQUFLTyxJQUFMLENBQVUsRUFBVixDQUFSLEVBQVI7QUFDRCxTQVJNLE1BUUEsSUFBSUgsV0FBVyxHQUFmLEVBQW9CO0FBQ3pCZixxQkFBVyxJQUFYO0FBQ0QsU0FGTSxNQUVBLElBQUllLFVBQVUsR0FBVixJQUFpQkEsU0FBUyxHQUE5QixFQUFtQztBQUN4Q1Asa0JBQVEsRUFBRWIsTUFBTXdCLEtBQUtDLEtBQUwsQ0FBV1QsS0FBS08sSUFBTCxDQUFVLEVBQVYsQ0FBWCxDQUFSLEVBQW1DekMsZ0JBQW5DLEVBQVI7QUFDRCxTQUZNLE1BRUEsSUFBSU8sV0FBVyxRQUFmLEVBQXlCO0FBQzlCLGNBQUksQ0FBQyxDQUFDRSxlQUFOLEVBQXVCO0FBQ3JCYyx1QkFBV1csS0FBS08sSUFBTCxDQUFVLEVBQVYsQ0FBWDtBQUNELFdBRkQsTUFFTztBQUNMbEIsdUJBQVdtQixLQUFLQyxLQUFMLENBQVdULEtBQUtPLElBQUwsQ0FBVSxFQUFWLENBQVgsQ0FBWDtBQUNEO0FBQ0YsU0FOTSxNQU1BO0FBQ0xsQixxQkFBV1csSUFBWDtBQUNEO0FBQ0YsT0E1QkQsQ0E0QkUsT0FBT1UsVUFBUCxFQUFtQjtBQUNuQixhQUFLMUMsTUFBTCxDQUFZNkIsS0FBWixDQUFrQmEsVUFBbEI7QUFDQSxhQUFLMUMsTUFBTCxDQUFZNkIsS0FBWixDQUNFLDJHQURGO0FBR0EsYUFBSzdCLE1BQUwsQ0FBWTZCLEtBQVosQ0FBa0IsNkJBQWxCO0FBQ0EsYUFBSzdCLE1BQUwsQ0FBWTZCLEtBQVosUUFBc0JHLElBQXRCOztBQUVBSCxnQkFBUTtBQUNOTyxrQkFBUUEsTUFERjtBQUVOQyxtQkFBUyx1Q0FGSDtBQUdOckIsZ0JBQU1nQixLQUFLTyxJQUFMLENBQVUsRUFBVixDQUhBO0FBSU5HLHNCQUFZQTtBQUpOLFNBQVI7QUFNRDs7QUFFRCxVQUFJYixLQUFKLEVBQVc7QUFDVEEsY0FBTUosVUFBTixHQUFtQlcsTUFBbkI7QUFDQVAsY0FBTS9CLE9BQU4sR0FBZ0JBLE9BQWhCO0FBQ0Q7O0FBRUQsVUFBSSxPQUFPUSxRQUFQLEtBQW9CLFVBQXhCLEVBQW9DO0FBQ2xDQSxpQkFBU3VCLEtBQVQsRUFBZ0JSLFFBQWhCO0FBQ0Q7QUFDRjs7O3FEQUVnQ2YsUSxFQUFVcUMsbUIsRUFBcUI7QUFDOUQsYUFBTyxVQUFTQyxHQUFULEVBQWNaLElBQWQsRUFBb0I7QUFDekIsWUFBSVksT0FBT0EsSUFBSVIsTUFBSixJQUFjTyxtQkFBekIsRUFBOEM7QUFDNUNDLGNBQUlDLE1BQUosR0FDRSx3R0FERjtBQUVEOztBQUVELGVBQU92QyxTQUFTc0MsR0FBVCxFQUFjWixJQUFkLENBQVA7QUFDRCxPQVBEO0FBUUQ7Ozt3QkFFR3hCLEksRUFBTXNDLE0sRUFBUXhDLFEsRUFBMEI7QUFBQSxVQUFoQnlDLE1BQWdCLHVFQUFQLEtBQU87O0FBQzFDLFVBQUksQ0FBQ3pDLFFBQUwsRUFBZTtBQUNiLFlBQUksT0FBT3dDLE1BQVAsSUFBaUIsVUFBckIsRUFBaUM7QUFDL0J4QyxxQkFBV3dDLE1BQVg7QUFDQUEsbUJBQVMsRUFBVDtBQUNEO0FBQ0Y7O0FBRURBLGVBQVNBLFVBQVUsRUFBbkI7QUFDQSxVQUFJLENBQUNDLE1BQUwsRUFBYTtBQUNYRCxlQUFPLFNBQVAsSUFBb0IsS0FBS25ELFdBQUwsQ0FBaUJxRCxNQUFyQztBQUNBRixlQUFPLFlBQVAsSUFBdUIsS0FBS25ELFdBQUwsQ0FBaUJzRCxTQUF4QztBQUNEOztBQUVEekMsYUFBT0EsT0FBTyxHQUFQLEdBQWFoQixZQUFZMEQsU0FBWixDQUFzQkosTUFBdEIsQ0FBcEI7O0FBRUEsVUFBTWhELFVBQVUsRUFBRSxnQkFBZ0Isa0JBQWxCLEVBQWhCO0FBQ0EsVUFBSWlELE1BQUosRUFBWTtBQUNWakQsZ0JBQVEsZUFBUixnQkFBcUMsS0FBS0gsV0FBTCxDQUFpQndELFdBQWpCLEVBQXJDO0FBQ0Q7O0FBRUQsV0FBSzVELE9BQUwsQ0FBYSxFQUFFaUIsTUFBTUEsSUFBUixFQUFjVixnQkFBZCxFQUFiLEVBQXNDLEtBQXRDLEVBQTZDUSxRQUE3QztBQUNEOzs7NEJBRU1FLEksRUFBTUYsUSxFQUFVeUMsTSxFQUFRO0FBQzdCLFVBQUlELFNBQVMsRUFBYjtBQUNBLFVBQUksQ0FBQ0MsTUFBTCxFQUFhO0FBQ1hELGVBQU8sU0FBUCxJQUFvQixLQUFLbkQsV0FBTCxDQUFpQnFELE1BQXJDO0FBQ0FGLGVBQU8sWUFBUCxJQUF1QixLQUFLbkQsV0FBTCxDQUFpQnNELFNBQXhDO0FBQ0Q7O0FBRUR6QyxhQUFPQSxPQUFPLEdBQVAsR0FBYWhCLFlBQVkwRCxTQUFaLENBQXNCSixNQUF0QixDQUFwQjs7QUFFQSxXQUFLdkQsT0FBTCxDQUFhLEVBQUVpQixNQUFNQSxJQUFSLEVBQWIsRUFBNkIsUUFBN0IsRUFBdUNGLFFBQXZDO0FBQ0Q7Ozs2QkFFUUUsSSxFQUFNZCxPLEVBQVNZLFEsRUFBVXlDLE0sRUFBUTtBQUN4QyxVQUFJSyxLQUFLLEVBQVQ7QUFDQSxVQUFJLENBQUNMLE1BQUwsRUFBYTtBQUNYSyxXQUFHLFNBQUgsSUFBZ0IsS0FBS3pELFdBQUwsQ0FBaUJxRCxNQUFqQztBQUNBSSxXQUFHLFlBQUgsSUFBbUIsS0FBS3pELFdBQUwsQ0FBaUJzRCxTQUFwQztBQUNEOztBQUVELFVBQUl4QyxPQUFPRyxJQUFQLENBQVl3QyxFQUFaLEVBQWdCQyxNQUFwQixFQUE0QjtBQUMxQixZQUFJQyxXQUFXLEdBQWY7QUFDQSxZQUFJOUMsS0FBSytDLE9BQUwsQ0FBYUQsUUFBYixNQUEyQixDQUFDLENBQWhDLEVBQW1DO0FBQ2pDQSxxQkFBVyxHQUFYO0FBQ0Q7QUFDRDlDLGVBQU9BLE9BQU84QyxRQUFQLEdBQWtCOUQsWUFBWTBELFNBQVosQ0FBc0JFLEVBQXRCLENBQXpCO0FBQ0Q7O0FBRUQsVUFBTUksT0FBTzlELFFBQVE4RCxJQUFyQjtBQUNBLGFBQU85RCxRQUFROEQsSUFBZixDQWhCd0MsQ0FnQm5COztBQUVyQixVQUFNQyxXQUFXLEVBQWpCOztBQUVBLFVBQUlELElBQUosRUFBVTtBQUNSQyxpQkFBUyxVQUFULElBQXVCO0FBQ3JCQyxpQkFBT0YsSUFEYztBQUVyQjlELG1CQUFTO0FBQ1BpRSxzQkFBVWpFLFFBQVFpRSxRQUFSLElBQW9CO0FBRHZCO0FBRlksU0FBdkI7QUFNRDs7QUFFRCxVQUFJakUsUUFBUXFCLElBQVosRUFBa0I7QUFDaEIwQyxpQkFBUzFDLElBQVQsR0FBZ0J5QixLQUFLVSxTQUFMLENBQWV4RCxRQUFRcUIsSUFBdkIsQ0FBaEI7QUFDRDs7QUFFRCxVQUFJckIsUUFBUWtFLEdBQVosRUFBaUI7QUFDZkgsaUJBQVNHLEdBQVQsR0FBZWxFLFFBQVFrRSxHQUF2QjtBQUNEOztBQUVELFdBQUsxRCxVQUFMLENBQWdCMkQsSUFBaEIsQ0FDRTtBQUNFRCxhQUFLLGFBQWEsS0FBS2hFLElBQWxCLEdBQXlCWSxJQURoQztBQUVFaUQsa0JBQVVBLFFBRlo7QUFHRTNELGlCQUFTO0FBQ1BnRSxxQ0FBeUIsS0FBS25FLFdBQUwsQ0FBaUJ3RCxXQUFqQjtBQURsQjtBQUhYLE9BREYsRUFRRTdDLFFBUkY7QUFVRDs7O3lCQUVJRSxJLEVBQU1zQyxNLEVBQVF4QyxRLEVBQVV5QyxNLEVBQVE7QUFDbkMsVUFBSUssS0FBSyxFQUFUO0FBQ0EsVUFBSSxDQUFDTCxNQUFMLEVBQWE7QUFDWEssV0FBRyxTQUFILElBQWdCLEtBQUt6RCxXQUFMLENBQWlCcUQsTUFBakM7QUFDQUksV0FBRyxZQUFILElBQW1CLEtBQUt6RCxXQUFMLENBQWlCc0QsU0FBcEM7QUFDRDs7QUFFRCxVQUFJSyxXQUFXLEdBQWY7QUFDQSxVQUFJOUMsS0FBSytDLE9BQUwsQ0FBYUQsUUFBYixNQUEyQixDQUFDLENBQWhDLEVBQW1DO0FBQ2pDQSxtQkFBVyxHQUFYO0FBQ0Q7O0FBRUQ5QyxhQUFPQSxPQUFPOEMsUUFBUCxHQUFrQjlELFlBQVkwRCxTQUFaLENBQXNCRSxFQUF0QixDQUF6Qjs7QUFFQSxXQUFLN0QsT0FBTCxDQUNFLEVBQUVpQixNQUFNQSxJQUFSLEVBQWNRLE1BQU14QixZQUFZMEQsU0FBWixDQUFzQkosTUFBdEIsQ0FBcEIsRUFERixFQUVFLE1BRkYsRUFHRXhDLFFBSEY7QUFLRDs7O3VDQUVrQkUsSSxFQUFNc0MsTSxFQUFReEMsUSxFQUFVeUMsTSxFQUFRO0FBQ2pERCxlQUFTQSxVQUFVLEVBQW5CO0FBQ0EsVUFBSSxDQUFDQyxNQUFMLEVBQWE7QUFDWEQsZUFBTyxTQUFQLElBQW9CLEtBQUtuRCxXQUFMLENBQWlCcUQsTUFBckM7QUFDQUYsZUFBTyxZQUFQLElBQXVCLEtBQUtuRCxXQUFMLENBQWlCc0QsU0FBeEM7QUFDRDs7QUFFRHpDLGFBQU9BLE9BQU8sR0FBUCxHQUFhaEIsWUFBWTBELFNBQVosQ0FBc0JKLE1BQXRCLENBQXBCOztBQUVBLFdBQUt2RCxPQUFMLENBQWEsRUFBRWlCLE1BQU1BLElBQVIsRUFBYixFQUE2QixNQUE3QixFQUFxQ0YsUUFBckM7QUFDRDs7Ozs7O2tCQUdZYixVIiwiZmlsZSI6Ikh0dHBDbGllbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgaHR0cHMgPSByZXF1aXJlKFwiaHR0cHNcIik7XG52YXIgaHR0cCA9IHJlcXVpcmUoXCJodHRwXCIpO1xudmFyIHJlcXVlc3QgPSByZXF1aXJlKFwicmVxdWVzdFwiKTtcbnZhciBxdWVyeXN0cmluZyA9IHJlcXVpcmUoXCJxdWVyeXN0cmluZ1wiKTtcblxuY2xhc3MgSHR0cENsaWVudCB7XG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMsIGNyZWRlbnRpYWxzKSB7XG4gICAgdGhpcy5jcmVkZW50aWFscyA9IGNyZWRlbnRpYWxzO1xuICAgIHRoaXMuaG9zdCA9IG9wdGlvbnMuaG9zdCB8fCBcInJlc3QubmV4bW8uY29tXCI7XG4gICAgdGhpcy5wb3J0ID0gb3B0aW9ucy5wb3J0IHx8IDQ0MztcbiAgICB0aGlzLmh0dHBzID0gb3B0aW9ucy5odHRwcyB8fCBodHRwcztcbiAgICB0aGlzLmh0dHAgPSBvcHRpb25zLmh0dHAgfHwgaHR0cDtcbiAgICB0aGlzLmhlYWRlcnMgPSB7XG4gICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZFwiLFxuICAgICAgQWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIlxuICAgIH07XG4gICAgdGhpcy5sb2dnZXIgPSBvcHRpb25zLmxvZ2dlcjtcbiAgICB0aGlzLnRpbWVvdXQgPSBvcHRpb25zLnRpbWVvdXQ7XG4gICAgdGhpcy5yZXF1ZXN0TGliID0gcmVxdWVzdDtcblxuICAgIGlmIChvcHRpb25zLnVzZXJBZ2VudCkge1xuICAgICAgdGhpcy5oZWFkZXJzW1wiVXNlci1BZ2VudFwiXSA9IG9wdGlvbnMudXNlckFnZW50O1xuICAgIH1cbiAgfVxuXG4gIHJlcXVlc3QoZW5kcG9pbnQsIG1ldGhvZCwgY2FsbGJhY2ssIHNraXBKc29uUGFyc2luZyA9IGZhbHNlKSB7XG4gICAgaWYgKHR5cGVvZiBtZXRob2QgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgY2FsbGJhY2sgPSBtZXRob2Q7XG4gICAgICBlbmRwb2ludC5tZXRob2QgPSBlbmRwb2ludC5tZXRob2QgfHwgXCJHRVRcIjtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtZXRob2QgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGVuZHBvaW50Lm1ldGhvZCA9IG1ldGhvZDtcbiAgICB9XG5cbiAgICBpZiAoZW5kcG9pbnQubWV0aG9kID09PSBcIlBPU1RcIiB8fCBlbmRwb2ludC5tZXRob2QgPT09IFwiREVMRVRFXCIpIHtcbiAgICAgIC8vIFRPRE86IHZlcmlmeSB0aGUgZm9sbG93aW5nIGZpeCBpcyByZXF1aXJlZFxuICAgICAgLy8gRml4IGJyb2tlbiBkdWUgb3QgNDExIENvbnRlbnQtTGVuZ3RoIGVycm9yIG5vdyBzZW50IGJ5IE5leG1vIEFQSVxuICAgICAgLy8gUEwgMjAxNi1TZXB0LTYgLSBjb21tZW50ZWQgb3V0IENvbnRlbnQtTGVuZ3RoIDBcbiAgICAgIC8vIGhlYWRlcnNbJ0NvbnRlbnQtTGVuZ3RoJ10gPSAwO1xuICAgIH1cbiAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgIGhvc3Q6IGVuZHBvaW50Lmhvc3QgPyBlbmRwb2ludC5ob3N0IDogdGhpcy5ob3N0LFxuICAgICAgcG9ydDogdGhpcy5wb3J0LFxuICAgICAgcGF0aDogZW5kcG9pbnQucGF0aCxcbiAgICAgIG1ldGhvZDogZW5kcG9pbnQubWV0aG9kLFxuICAgICAgaGVhZGVyczogT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5oZWFkZXJzKVxuICAgIH07XG5cbiAgICBpZiAodGhpcy50aW1lb3V0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIG9wdGlvbnMudGltZW91dCA9IHRoaXMudGltZW91dDtcbiAgICB9XG5cbiAgICAvLyBBbGxvdyBleGlzdGluZyBoZWFkZXJzIHRvIGJlIG92ZXJyaWRkZW5cbiAgICAvLyBBbGxvdyBuZXcgaGVhZGVycyB0byBiZSBhZGRlZFxuICAgIGlmIChlbmRwb2ludC5oZWFkZXJzKSB7XG4gICAgICBPYmplY3Qua2V5cyhlbmRwb2ludC5oZWFkZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICBvcHRpb25zLmhlYWRlcnNba2V5XSA9IGVuZHBvaW50LmhlYWRlcnNba2V5XTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMubG9nZ2VyLmluZm8oXCJSZXF1ZXN0OlwiLCBvcHRpb25zLCBcIlxcbkJvZHk6XCIsIGVuZHBvaW50LmJvZHkpO1xuICAgIHZhciByZXF1ZXN0O1xuXG4gICAgaWYgKG9wdGlvbnMucG9ydCA9PT0gNDQzKSB7XG4gICAgICByZXF1ZXN0ID0gdGhpcy5odHRwcy5yZXF1ZXN0KG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXF1ZXN0ID0gdGhpcy5odHRwLnJlcXVlc3Qob3B0aW9ucyk7XG4gICAgfVxuXG4gICAgcmVxdWVzdC5lbmQoZW5kcG9pbnQuYm9keSk7XG5cbiAgICAvLyBLZWVwIGFuIGFycmF5IG9mIFN0cmluZyBvciBCdWZmZXJzLFxuICAgIC8vIGRlcGVuZGluZyBvbiBjb250ZW50IHR5cGUgKGJpbmFyeSBvciBKU09OKSBvZiByZXNwb25zZVxuICAgIHZhciByZXNwb25zZURhdGEgPSBbXTtcblxuICAgIHJlcXVlc3Qub24oXCJyZXNwb25zZVwiLCByZXNwb25zZSA9PiB7XG4gICAgICB2YXIgaXNCaW5hcnkgPVxuICAgICAgICByZXNwb25zZS5oZWFkZXJzW1wiY29udGVudC10eXBlXCJdID09PSBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiO1xuICAgICAgaWYgKCFpc0JpbmFyeSkge1xuICAgICAgICByZXNwb25zZS5zZXRFbmNvZGluZyhcInV0ZjhcIik7XG4gICAgICB9XG5cbiAgICAgIHJlc3BvbnNlLm9uKFwiZGF0YVwiLCBjaHVuayA9PiB7XG4gICAgICAgIHJlc3BvbnNlRGF0YS5wdXNoKGNodW5rKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXNwb25zZS5vbihcImVuZFwiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMubG9nZ2VyLmluZm8oXCJyZXNwb25zZSBlbmRlZDpcIiwgcmVzcG9uc2Uuc3RhdHVzQ29kZSk7XG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgIGlmIChpc0JpbmFyeSkge1xuICAgICAgICAgICAgcmVzcG9uc2VEYXRhID0gQnVmZmVyLmNvbmNhdChyZXNwb25zZURhdGEpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMuX19wYXJzZVJlc3BvbnNlKFxuICAgICAgICAgICAgcmVzcG9uc2UsXG4gICAgICAgICAgICByZXNwb25zZURhdGEsXG4gICAgICAgICAgICBlbmRwb2ludC5tZXRob2QsXG4gICAgICAgICAgICBjYWxsYmFjayxcbiAgICAgICAgICAgIHNraXBKc29uUGFyc2luZ1xuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmVzcG9uc2Uub24oXCJjbG9zZVwiLCBlID0+IHtcbiAgICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoXG4gICAgICAgICAgXCJwcm9ibGVtIHdpdGggQVBJIHJlcXVlc3QgZGV0YWlsZWQgc3RhY2t0cmFjZSBiZWxvdyBcIlxuICAgICAgICApO1xuICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcihlKTtcbiAgICAgICAgY2FsbGJhY2soZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXF1ZXN0Lm9uKFwiZXJyb3JcIiwgZSA9PiB7XG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcihcInByb2JsZW0gd2l0aCBBUEkgcmVxdWVzdCBkZXRhaWxlZCBzdGFja3RyYWNlIGJlbG93IFwiKTtcbiAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGUpO1xuICAgICAgY2FsbGJhY2soZSk7XG4gICAgfSk7XG4gIH1cblxuICBfX3BhcnNlUmVzcG9uc2UoaHR0cFJlc3BvbnNlLCBkYXRhLCBtZXRob2QsIGNhbGxiYWNrLCBza2lwSnNvblBhcnNpbmcpIHtcbiAgICBjb25zdCBpc0FycmF5T3JCdWZmZXIgPSBkYXRhIGluc3RhbmNlb2YgQXJyYXkgfHwgZGF0YSBpbnN0YW5jZW9mIEJ1ZmZlcjtcbiAgICBpZiAoIWlzQXJyYXlPckJ1ZmZlcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZGF0YSBzaG91bGQgYmUgb2YgdHlwZSBBcnJheSBvciBCdWZmZXJcIik7XG4gICAgfVxuXG4gICAgY29uc3Qgc3RhdHVzID0gaHR0cFJlc3BvbnNlLnN0YXR1c0NvZGU7XG4gICAgY29uc3QgaGVhZGVycyA9IGh0dHBSZXNwb25zZS5oZWFkZXJzO1xuXG4gICAgbGV0IHJlc3BvbnNlID0gbnVsbDtcbiAgICB2YXIgZXJyb3IgPSBudWxsO1xuXG4gICAgdHJ5IHtcbiAgICAgIGlmIChzdGF0dXMgPj0gNTAwKSB7XG4gICAgICAgIGVycm9yID0geyBtZXNzYWdlOiBcIlNlcnZlciBFcnJvclwiLCBzdGF0dXNDb2RlOiBzdGF0dXMgfTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgIGh0dHBSZXNwb25zZS5oZWFkZXJzW1wiY29udGVudC10eXBlXCJdID09PSBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiXG4gICAgICApIHtcbiAgICAgICAgcmVzcG9uc2UgPSBkYXRhO1xuICAgICAgfSBlbHNlIGlmIChzdGF0dXMgPT09IDQyOSkge1xuICAgICAgICAvLyA0MjkgZG9lcyBub3QgcmV0dXJuIGEgcGFyc2FibGUgYm9keVxuICAgICAgICBpZiAoIWhlYWRlcnNbXCJyZXRyeS1hZnRlclwiXSkge1xuICAgICAgICAgIC8vIHJldHJ5IGJhc2VkIG9uIGFsbG93ZWQgcGVyIHNlY29uZFxuICAgICAgICAgIGNvbnN0IHJldHJ5QWZ0ZXJNaWxsaXMgPSBtZXRob2QgPT09IFwiUE9TVFwiID8gMTAwMCAvIDIgOiAxMDAwIC8gNTtcbiAgICAgICAgICBoZWFkZXJzW1wicmV0cnktYWZ0ZXJcIl0gPSByZXRyeUFmdGVyTWlsbGlzO1xuICAgICAgICB9XG4gICAgICAgIGVycm9yID0geyBib2R5OiBkYXRhLmpvaW4oXCJcIikgfTtcbiAgICAgIH0gZWxzZSBpZiAoc3RhdHVzID09PSAyMDQpIHtcbiAgICAgICAgcmVzcG9uc2UgPSBudWxsO1xuICAgICAgfSBlbHNlIGlmIChzdGF0dXMgPj0gNDAwIHx8IHN0YXR1cyA8IDIwMCkge1xuICAgICAgICBlcnJvciA9IHsgYm9keTogSlNPTi5wYXJzZShkYXRhLmpvaW4oXCJcIikpLCBoZWFkZXJzIH07XG4gICAgICB9IGVsc2UgaWYgKG1ldGhvZCAhPT0gXCJERUxFVEVcIikge1xuICAgICAgICBpZiAoISFza2lwSnNvblBhcnNpbmcpIHtcbiAgICAgICAgICByZXNwb25zZSA9IGRhdGEuam9pbihcIlwiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNwb25zZSA9IEpTT04ucGFyc2UoZGF0YS5qb2luKFwiXCIpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzcG9uc2UgPSBkYXRhO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKHBhcnNlRXJyb3IpIHtcbiAgICAgIHRoaXMubG9nZ2VyLmVycm9yKHBhcnNlRXJyb3IpO1xuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoXG4gICAgICAgIFwiY291bGQgbm90IGNvbnZlcnQgQVBJIHJlc3BvbnNlIHRvIEpTT04sIGFib3ZlIGVycm9yIGlzIGlnbm9yZWQgYW5kIHJhdyBBUEkgcmVzcG9uc2UgaXMgcmV0dXJuZWQgdG8gY2xpZW50XCJcbiAgICAgICk7XG4gICAgICB0aGlzLmxvZ2dlci5lcnJvcihcIlJhdyBFcnJvciBtZXNzYWdlIGZyb20gQVBJIFwiKTtcbiAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGBcIiR7ZGF0YX1cImApO1xuXG4gICAgICBlcnJvciA9IHtcbiAgICAgICAgc3RhdHVzOiBzdGF0dXMsXG4gICAgICAgIG1lc3NhZ2U6IFwiVGhlIEFQSSByZXNwb25zZSBjb3VsZCBub3QgYmUgcGFyc2VkLlwiLFxuICAgICAgICBib2R5OiBkYXRhLmpvaW4oXCJcIiksXG4gICAgICAgIHBhcnNlRXJyb3I6IHBhcnNlRXJyb3JcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGVycm9yKSB7XG4gICAgICBlcnJvci5zdGF0dXNDb2RlID0gc3RhdHVzO1xuICAgICAgZXJyb3IuaGVhZGVycyA9IGhlYWRlcnM7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBjYWxsYmFjayhlcnJvciwgcmVzcG9uc2UpO1xuICAgIH1cbiAgfVxuXG4gIF9hZGRMaW1pdGVkQWNjZXNzTWVzc2FnZVRvRXJyb3JzKGNhbGxiYWNrLCBsaW1pdGVkQWNjZXNzU3RhdHVzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgaWYgKGVyciAmJiBlcnIuc3RhdHVzID09IGxpbWl0ZWRBY2Nlc3NTdGF0dXMpIHtcbiAgICAgICAgZXJyLl9JTkZPXyA9XG4gICAgICAgICAgXCJUaGlzIGVuZHBvaW50IG1heSBuZWVkIGFjdGl2YXRpbmcgb24geW91ciBhY2NvdW50LiBQbGVhc2UgZW1haWwgc3VwcG9ydEBuZXhtby5jb20gZm9yIG1vcmUgaW5mb3JtYXRpb25cIjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhbGxiYWNrKGVyciwgZGF0YSk7XG4gICAgfTtcbiAgfVxuXG4gIGdldChwYXRoLCBwYXJhbXMsIGNhbGxiYWNrLCB1c2VKd3QgPSBmYWxzZSkge1xuICAgIGlmICghY2FsbGJhY2spIHtcbiAgICAgIGlmICh0eXBlb2YgcGFyYW1zID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBjYWxsYmFjayA9IHBhcmFtcztcbiAgICAgICAgcGFyYW1zID0ge307XG4gICAgICB9XG4gICAgfVxuXG4gICAgcGFyYW1zID0gcGFyYW1zIHx8IHt9O1xuICAgIGlmICghdXNlSnd0KSB7XG4gICAgICBwYXJhbXNbXCJhcGlfa2V5XCJdID0gdGhpcy5jcmVkZW50aWFscy5hcGlLZXk7XG4gICAgICBwYXJhbXNbXCJhcGlfc2VjcmV0XCJdID0gdGhpcy5jcmVkZW50aWFscy5hcGlTZWNyZXQ7XG4gICAgfVxuXG4gICAgcGF0aCA9IHBhdGggKyBcIj9cIiArIHF1ZXJ5c3RyaW5nLnN0cmluZ2lmeShwYXJhbXMpO1xuXG4gICAgY29uc3QgaGVhZGVycyA9IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfTtcbiAgICBpZiAodXNlSnd0KSB7XG4gICAgICBoZWFkZXJzW1wiQXV0aG9yaXphdGlvblwiXSA9IGBCZWFyZXIgJHt0aGlzLmNyZWRlbnRpYWxzLmdlbmVyYXRlSnd0KCl9YDtcbiAgICB9XG5cbiAgICB0aGlzLnJlcXVlc3QoeyBwYXRoOiBwYXRoLCBoZWFkZXJzIH0sIFwiR0VUXCIsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIGRlbGV0ZShwYXRoLCBjYWxsYmFjaywgdXNlSnd0KSB7XG4gICAgbGV0IHBhcmFtcyA9IHt9O1xuICAgIGlmICghdXNlSnd0KSB7XG4gICAgICBwYXJhbXNbXCJhcGlfa2V5XCJdID0gdGhpcy5jcmVkZW50aWFscy5hcGlLZXk7XG4gICAgICBwYXJhbXNbXCJhcGlfc2VjcmV0XCJdID0gdGhpcy5jcmVkZW50aWFscy5hcGlTZWNyZXQ7XG4gICAgfVxuXG4gICAgcGF0aCA9IHBhdGggKyBcIj9cIiArIHF1ZXJ5c3RyaW5nLnN0cmluZ2lmeShwYXJhbXMpO1xuXG4gICAgdGhpcy5yZXF1ZXN0KHsgcGF0aDogcGF0aCB9LCBcIkRFTEVURVwiLCBjYWxsYmFjayk7XG4gIH1cblxuICBwb3N0RmlsZShwYXRoLCBvcHRpb25zLCBjYWxsYmFjaywgdXNlSnd0KSB7XG4gICAgbGV0IHFzID0ge307XG4gICAgaWYgKCF1c2VKd3QpIHtcbiAgICAgIHFzW1wiYXBpX2tleVwiXSA9IHRoaXMuY3JlZGVudGlhbHMuYXBpS2V5O1xuICAgICAgcXNbXCJhcGlfc2VjcmV0XCJdID0gdGhpcy5jcmVkZW50aWFscy5hcGlTZWNyZXQ7XG4gICAgfVxuXG4gICAgaWYgKE9iamVjdC5rZXlzKHFzKS5sZW5ndGgpIHtcbiAgICAgIGxldCBqb2luQ2hhciA9IFwiP1wiO1xuICAgICAgaWYgKHBhdGguaW5kZXhPZihqb2luQ2hhcikgIT09IC0xKSB7XG4gICAgICAgIGpvaW5DaGFyID0gXCImXCI7XG4gICAgICB9XG4gICAgICBwYXRoID0gcGF0aCArIGpvaW5DaGFyICsgcXVlcnlzdHJpbmcuc3RyaW5naWZ5KHFzKTtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlID0gb3B0aW9ucy5maWxlO1xuICAgIGRlbGV0ZSBvcHRpb25zLmZpbGU7IC8vIFdlIGRvbid0IHNlbmQgdGhpcyBhcyBtZXRhZGF0YVxuXG4gICAgY29uc3QgZm9ybURhdGEgPSB7fTtcblxuICAgIGlmIChmaWxlKSB7XG4gICAgICBmb3JtRGF0YVtcImZpbGVkYXRhXCJdID0ge1xuICAgICAgICB2YWx1ZTogZmlsZSxcbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgIGZpbGVuYW1lOiBvcHRpb25zLmZpbGVuYW1lIHx8IG51bGxcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5pbmZvKSB7XG4gICAgICBmb3JtRGF0YS5pbmZvID0gSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5pbmZvKTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy51cmwpIHtcbiAgICAgIGZvcm1EYXRhLnVybCA9IG9wdGlvbnMudXJsO1xuICAgIH1cblxuICAgIHRoaXMucmVxdWVzdExpYi5wb3N0KFxuICAgICAge1xuICAgICAgICB1cmw6IFwiaHR0cHM6Ly9cIiArIHRoaXMuaG9zdCArIHBhdGgsXG4gICAgICAgIGZvcm1EYXRhOiBmb3JtRGF0YSxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHt0aGlzLmNyZWRlbnRpYWxzLmdlbmVyYXRlSnd0KCl9YFxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgY2FsbGJhY2tcbiAgICApO1xuICB9XG5cbiAgcG9zdChwYXRoLCBwYXJhbXMsIGNhbGxiYWNrLCB1c2VKd3QpIHtcbiAgICBsZXQgcXMgPSB7fTtcbiAgICBpZiAoIXVzZUp3dCkge1xuICAgICAgcXNbXCJhcGlfa2V5XCJdID0gdGhpcy5jcmVkZW50aWFscy5hcGlLZXk7XG4gICAgICBxc1tcImFwaV9zZWNyZXRcIl0gPSB0aGlzLmNyZWRlbnRpYWxzLmFwaVNlY3JldDtcbiAgICB9XG5cbiAgICBsZXQgam9pbkNoYXIgPSBcIj9cIjtcbiAgICBpZiAocGF0aC5pbmRleE9mKGpvaW5DaGFyKSAhPT0gLTEpIHtcbiAgICAgIGpvaW5DaGFyID0gXCImXCI7XG4gICAgfVxuXG4gICAgcGF0aCA9IHBhdGggKyBqb2luQ2hhciArIHF1ZXJ5c3RyaW5nLnN0cmluZ2lmeShxcyk7XG5cbiAgICB0aGlzLnJlcXVlc3QoXG4gICAgICB7IHBhdGg6IHBhdGgsIGJvZHk6IHF1ZXJ5c3RyaW5nLnN0cmluZ2lmeShwYXJhbXMpIH0sXG4gICAgICBcIlBPU1RcIixcbiAgICAgIGNhbGxiYWNrXG4gICAgKTtcbiAgfVxuXG4gIHBvc3RVc2VRdWVyeVN0cmluZyhwYXRoLCBwYXJhbXMsIGNhbGxiYWNrLCB1c2VKd3QpIHtcbiAgICBwYXJhbXMgPSBwYXJhbXMgfHwge307XG4gICAgaWYgKCF1c2VKd3QpIHtcbiAgICAgIHBhcmFtc1tcImFwaV9rZXlcIl0gPSB0aGlzLmNyZWRlbnRpYWxzLmFwaUtleTtcbiAgICAgIHBhcmFtc1tcImFwaV9zZWNyZXRcIl0gPSB0aGlzLmNyZWRlbnRpYWxzLmFwaVNlY3JldDtcbiAgICB9XG5cbiAgICBwYXRoID0gcGF0aCArIFwiP1wiICsgcXVlcnlzdHJpbmcuc3RyaW5naWZ5KHBhcmFtcyk7XG5cbiAgICB0aGlzLnJlcXVlc3QoeyBwYXRoOiBwYXRoIH0sIFwiUE9TVFwiLCBjYWxsYmFjayk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgSHR0cENsaWVudDtcbiJdfQ==