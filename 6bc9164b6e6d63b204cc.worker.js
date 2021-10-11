/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "sayHello": () => (/* binding */ sayHello)
/* harmony export */ });
function sayHello(href, referrer) {
  const payload = {
    guest_timezone_offset: new Date().getTimezoneOffset(),
    user_agent: navigator.userAgent,
    url: href,
    referrer: referrer,
  }
  fetch("https://fast-woodland-61382.herokuapp.com/visits", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  })
}

onmessage = function(e) {
  if (false) {}

  let href, referrer
  ;[href, referrer] = e.data
  if (href) {
    sayHello(href, referrer)
  }
}

addEventListener("message", function (e) {var _e$data = e.data,type = _e$data.type,method = _e$data.method,id = _e$data.id,params = _e$data.params,f,p;if (type === "RPC" && method) {if (f = __webpack_exports__[method]) {p = Promise.resolve().then(function () {return f.apply(__webpack_exports__, params);});} else {p = Promise.reject("No such method");}p.then(function (result) {postMessage({type: "RPC",id: id,result: result});}).catch(function (e) {var message;try {message = e.message.toString();} catch (ex) {message = null;}var error = {message: message};if (e.stack) {error.stack = e.stack;error.name = e.name;}if (e.status) {error.status = e.status;error.responseJson = e.responseJson;}postMessage({type: "RPC",id: id,error: error});});}});postMessage({type: "RPC",method: "ready"});
/******/ })()
;
//# sourceMappingURL=6bc9164b6e6d63b204cc.worker.js.map