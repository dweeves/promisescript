'use strict';
var ES6Promise = require('es6-promise').Promise,
	doc = global.document,
	cached = {};

function loadScript(script) {
	return new ES6Promise(function(resolve, reject) {
		script.onload = function() {
			this.onload = this.onerror = null;
			resolve();
		};

		script.onerror = function() {
			this.onload = this.onerror = null;
			reject(new Error('Failed to load ' + script.src));
		};
	});
}

function loadScriptIE(script) {
	return new ES6Promise(function(resolve) {
		script.onreadystatechange = function() {
			if (this.readyState !== 'loaded' && this.readyState !== 'complete') {
				return;
			}

			this.onreadystatechange = null;
			resolve();
		};
	});
}

function scriptResolver(src) {
	return new ES6Promise(function(resolve) {
		var head = doc.head || doc.getElementsByTagName('head')[0];
		var script = doc.createElement('script');
		script.type = 'text/javascript';
		script.charset = 'utf8';
		script.async = true;
		script.src = src;

		var loader = 'onload' in script ? loadScript : loadScriptIE;
		resolve(loader(script));

		head.appendChild(script);
	});
}

module.exports = function promisescript(srcs) {
	var promises = [],
		shouldReturnArray = true,
		promise,
		i,
		length,
		src;

	if (typeof srcs === 'string') {
		srcs = [srcs];
		shouldReturnArray = false;
	}

	length = srcs.length;
	for (i = 0; i < length; i++) {
		src = srcs[i];

		// if the script is cached, resolve with the original promise;
		if (cached[src]) {
			promises.push(cached[src]);
			continue;
		}

		promise = scriptResolver(src);

		cached[src] = promise;
		promises.push(promise);
	}

	if (!shouldReturnArray) {
		return promises[0];
	}

	return promises;
};
