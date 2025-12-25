import { ORPCError, onError, os } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { CORSPlugin } from "@orpc/server/plugins";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { count, defineRelations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { env } from "bun";
import { FormatRegistry, Kind, OptionalKind, TransformKind, Type, TypeBoxError, TypeRegistry, Unsafe } from "@sinclair/typebox";
import { TransformDecodeError, Value } from "@sinclair/typebox/value";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { TypeCompiler as TypeCompiler$1 } from "elysia/type-system";
import { camelKeys } from "string-ts";
import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";
import { z } from "zod";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
var services = {};
globalThis.__nitro_vite_envs__ = services;
function lazyInherit(target, source, sourceKey) {
	for (const key$1 of [...Object.getOwnPropertyNames(source), ...Object.getOwnPropertySymbols(source)]) {
		if (key$1 === "constructor") continue;
		const targetDesc = Object.getOwnPropertyDescriptor(target, key$1);
		const desc = Object.getOwnPropertyDescriptor(source, key$1);
		let modified = false;
		if (desc.get) {
			modified = true;
			desc.get = targetDesc?.get || function() {
				return this[sourceKey][key$1];
			};
		}
		if (desc.set) {
			modified = true;
			desc.set = targetDesc?.set || function(value) {
				this[sourceKey][key$1] = value;
			};
		}
		if (!targetDesc?.value && typeof desc.value === "function") {
			modified = true;
			desc.value = function(...args) {
				return this[sourceKey][key$1](...args);
			};
		}
		if (modified) Object.defineProperty(target, key$1, desc);
	}
}
var FastURL = /* @__PURE__ */ (() => {
	const NativeURL = globalThis.URL;
	const FastURL$1 = class URL$1 {
		#url;
		#href;
		#protocol;
		#host;
		#pathname;
		#search;
		#searchParams;
		#pos;
		constructor(url) {
			if (typeof url === "string") this.#href = url;
			else {
				this.#protocol = url.protocol;
				this.#host = url.host;
				this.#pathname = url.pathname;
				this.#search = url.search;
			}
		}
		static [Symbol.hasInstance](val) {
			return val instanceof NativeURL;
		}
		get _url() {
			if (this.#url) return this.#url;
			this.#url = new NativeURL(this.href);
			this.#href = void 0;
			this.#protocol = void 0;
			this.#host = void 0;
			this.#pathname = void 0;
			this.#search = void 0;
			this.#searchParams = void 0;
			this.#pos = void 0;
			return this.#url;
		}
		get href() {
			if (this.#url) return this.#url.href;
			if (!this.#href) this.#href = `${this.#protocol || "http:"}//${this.#host || "localhost"}${this.#pathname || "/"}${this.#search || ""}`;
			return this.#href;
		}
		#getPos() {
			if (!this.#pos) {
				const url = this.href;
				const protoIndex = url.indexOf("://");
				const pathnameIndex = protoIndex === -1 ? -1 : url.indexOf("/", protoIndex + 4);
				this.#pos = [
					protoIndex,
					pathnameIndex,
					pathnameIndex === -1 ? -1 : url.indexOf("?", pathnameIndex)
				];
			}
			return this.#pos;
		}
		get pathname() {
			if (this.#url) return this.#url.pathname;
			if (this.#pathname === void 0) {
				const [, pathnameIndex, queryIndex] = this.#getPos();
				if (pathnameIndex === -1) return this._url.pathname;
				this.#pathname = this.href.slice(pathnameIndex, queryIndex === -1 ? void 0 : queryIndex);
			}
			return this.#pathname;
		}
		get search() {
			if (this.#url) return this.#url.search;
			if (this.#search === void 0) {
				const [, pathnameIndex, queryIndex] = this.#getPos();
				if (pathnameIndex === -1) return this._url.search;
				const url = this.href;
				this.#search = queryIndex === -1 || queryIndex === url.length - 1 ? "" : url.slice(queryIndex);
			}
			return this.#search;
		}
		get searchParams() {
			if (this.#url) return this.#url.searchParams;
			if (!this.#searchParams) this.#searchParams = new URLSearchParams(this.search);
			return this.#searchParams;
		}
		get protocol() {
			if (this.#url) return this.#url.protocol;
			if (this.#protocol === void 0) {
				const [protocolIndex] = this.#getPos();
				if (protocolIndex === -1) return this._url.protocol;
				this.#protocol = this.href.slice(0, protocolIndex + 1);
			}
			return this.#protocol;
		}
		toString() {
			return this.href;
		}
		toJSON() {
			return this.href;
		}
	};
	lazyInherit(FastURL$1.prototype, NativeURL.prototype, "_url");
	Object.setPrototypeOf(FastURL$1.prototype, NativeURL.prototype);
	Object.setPrototypeOf(FastURL$1, NativeURL);
	return FastURL$1;
})();
function resolvePortAndHost(opts) {
	const _port = opts.port ?? globalThis.process?.env.PORT ?? 3e3;
	const port$1 = typeof _port === "number" ? _port : Number.parseInt(_port, 10);
	if (port$1 < 0 || port$1 > 65535) throw new RangeError(`Port must be between 0 and 65535 (got "${port$1}").`);
	return {
		port: port$1,
		hostname: opts.hostname ?? globalThis.process?.env.HOST
	};
}
function fmtURL(host$1, port$1, secure) {
	if (!host$1 || !port$1) return;
	if (host$1.includes(":")) host$1 = `[${host$1}]`;
	return `http${secure ? "s" : ""}://${host$1}:${port$1}/`;
}
function printListening(opts, url) {
	if (!url || (opts.silent ?? globalThis.process?.env?.TEST)) return;
	const _url = new URL(url);
	const allInterfaces = _url.hostname === "[::]" || _url.hostname === "0.0.0.0";
	if (allInterfaces) {
		_url.hostname = "localhost";
		url = _url.href;
	}
	let listeningOn = `➜ Listening on:`;
	let additionalInfo = allInterfaces ? " (all interfaces)" : "";
	if (globalThis.process.stdout?.isTTY) {
		listeningOn = `\u001B[32m${listeningOn}\u001B[0m`;
		url = `\u001B[36m${url}\u001B[0m`;
		additionalInfo = `\u001B[2m${additionalInfo}\u001B[0m`;
	}
	console.log(`${listeningOn} ${url}${additionalInfo}`);
}
function resolveTLSOptions(opts) {
	if (!opts.tls || opts.protocol === "http") return;
	const cert$1 = resolveCertOrKey(opts.tls.cert);
	const key$1 = resolveCertOrKey(opts.tls.key);
	if (!cert$1 && !key$1) {
		if (opts.protocol === "https") throw new TypeError("TLS `cert` and `key` must be provided for `https` protocol.");
		return;
	}
	if (!cert$1 || !key$1) throw new TypeError("TLS `cert` and `key` must be provided together.");
	return {
		cert: cert$1,
		key: key$1,
		passphrase: opts.tls.passphrase
	};
}
function resolveCertOrKey(value) {
	if (!value) return;
	if (typeof value !== "string") throw new TypeError("TLS certificate and key must be strings in PEM format or file paths.");
	if (value.startsWith("-----BEGIN ")) return value;
	const { readFileSync } = process.getBuiltinModule("node:fs");
	return readFileSync(value, "utf8");
}
function createWaitUntil() {
	const promises$1 = /* @__PURE__ */ new Set();
	return {
		waitUntil: (promise) => {
			if (typeof promise?.then !== "function") return;
			promises$1.add(Promise.resolve(promise).catch(console.error).finally(() => {
				promises$1.delete(promise);
			}));
		},
		wait: () => {
			return Promise.all(promises$1);
		}
	};
}
var noColor = /* @__PURE__ */ (() => {
	const env$3 = globalThis.process?.env ?? {};
	return env$3.NO_COLOR === "1" || env$3.TERM === "dumb";
})();
var _c = (c, r$1 = 39) => (t$1) => noColor ? t$1 : `\u001B[${c}m${t$1}\u001B[${r$1}m`;
var red = /* @__PURE__ */ _c(31);
var gray = /* @__PURE__ */ _c(90);
function wrapFetch(server) {
	const fetchHandler = server.options.fetch;
	const middleware = server.options.middleware || [];
	return middleware.length === 0 ? fetchHandler : (request) => callMiddleware$1(request, fetchHandler, middleware, 0);
}
function callMiddleware$1(request, fetchHandler, middleware, index$1) {
	if (index$1 === middleware.length) return fetchHandler(request);
	return middleware[index$1](request, () => callMiddleware$1(request, fetchHandler, middleware, index$1 + 1));
}
var gracefulShutdownPlugin = (server) => {
	const config = server.options?.gracefulShutdown;
	if (!globalThis.process?.on || config === false || config === void 0 && (process.env.CI || process.env.TEST)) return;
	const gracefulShutdown = config === true || !config?.gracefulTimeout ? Number.parseInt(process.env.SERVER_SHUTDOWN_TIMEOUT || "") || 3 : config.gracefulTimeout;
	const forceShutdown = config === true || !config?.forceTimeout ? Number.parseInt(process.env.SERVER_FORCE_SHUTDOWN_TIMEOUT || "") || 5 : config.forceTimeout;
	let isShuttingDown = false;
	const shutdown = async () => {
		if (isShuttingDown) return;
		isShuttingDown = true;
		const w = process.stderr.write.bind(process.stderr);
		w(gray(`\nShutting down server in ${gracefulShutdown}s...`));
		let timeout;
		await Promise.race([server.close().finally(() => {
			clearTimeout(timeout);
			w(gray(" Server closed.\n"));
		}), new Promise((resolve$1) => {
			timeout = setTimeout(() => {
				w(gray(`\nForce closing connections in ${forceShutdown}s...`));
				timeout = setTimeout(() => {
					w(red("\nCould not close connections in time, force exiting."));
					resolve$1();
				}, forceShutdown * 1e3);
				return server.close(true);
			}, gracefulShutdown * 1e3);
		})]);
		globalThis.process.exit(0);
	};
	for (const sig of ["SIGINT", "SIGTERM"]) globalThis.process.on(sig, shutdown);
};
var FastResponse = Response;
function serve(options) {
	return new BunServer(options);
}
var BunServer = class {
	runtime = "bun";
	options;
	bun = {};
	serveOptions;
	fetch;
	#wait;
	constructor(options) {
		this.options = {
			...options,
			middleware: [...options.middleware || []]
		};
		for (const plugin of options.plugins || []) plugin(this);
		gracefulShutdownPlugin(this);
		const fetchHandler = wrapFetch(this);
		this.#wait = createWaitUntil();
		this.fetch = (request, server) => {
			Object.defineProperties(request, {
				waitUntil: { value: this.#wait.waitUntil },
				runtime: {
					enumerable: true,
					value: {
						name: "bun",
						bun: { server }
					}
				},
				ip: {
					enumerable: true,
					get() {
						return server?.requestIP(request)?.address;
					}
				}
			});
			return fetchHandler(request);
		};
		const tls = resolveTLSOptions(this.options);
		this.serveOptions = {
			...resolvePortAndHost(this.options),
			reusePort: this.options.reusePort,
			error: this.options.error,
			...this.options.bun,
			tls: {
				cert: tls?.cert,
				key: tls?.key,
				passphrase: tls?.passphrase,
				...this.options.bun?.tls
			},
			fetch: this.fetch
		};
		if (!options.manual) this.serve();
	}
	serve() {
		if (!this.bun.server) this.bun.server = Bun.serve(this.serveOptions);
		printListening(this.options, this.url);
		return Promise.resolve(this);
	}
	get url() {
		const server = this.bun?.server;
		if (!server) return;
		const address = server.address;
		if (address) return fmtURL(address.address, address.port, server.protocol === "https");
		return server.url.href;
	}
	ready() {
		return Promise.resolve(this);
	}
	async close(closeAll) {
		await Promise.all([this.#wait.wait(), Promise.resolve(this.bun?.server?.stop(closeAll))]);
	}
};
Symbol.toPrimitive;
Symbol.toPrimitive, Symbol.toStringTag;
var NullProtoObj = /* @__PURE__ */ (() => {
	const e = function() {};
	return e.prototype = Object.create(null), Object.freeze(e.prototype), e;
})();
var kEventNS = "h3.internal.event.";
var kEventRes = /* @__PURE__ */ Symbol.for(`${kEventNS}res`);
var kEventResHeaders = /* @__PURE__ */ Symbol.for(`${kEventNS}res.headers`);
var H3Event = class {
	app;
	req;
	url;
	context;
	static __is_event__ = true;
	constructor(req, context, app) {
		this.context = context || req.context || new NullProtoObj();
		this.req = req;
		this.app = app;
		const _url = req._url;
		this.url = _url && _url instanceof URL ? _url : new FastURL(req.url);
	}
	get res() {
		return this[kEventRes] ||= new H3EventResponse();
	}
	get runtime() {
		return this.req.runtime;
	}
	waitUntil(promise) {
		this.req.waitUntil?.(promise);
	}
	toString() {
		return `[${this.req.method}] ${this.req.url}`;
	}
	toJSON() {
		return this.toString();
	}
	get node() {
		return this.req.runtime?.node;
	}
	get headers() {
		return this.req.headers;
	}
	get path() {
		return this.url.pathname + this.url.search;
	}
	get method() {
		return this.req.method;
	}
};
var H3EventResponse = class {
	status;
	statusText;
	get headers() {
		return this[kEventResHeaders] ||= new Headers();
	}
};
var DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage(statusMessage = "") {
	return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}
function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
	if (!statusCode) return defaultStatusCode;
	if (typeof statusCode === "string") statusCode = +statusCode;
	if (statusCode < 100 || statusCode > 599) return defaultStatusCode;
	return statusCode;
}
var HTTPError = class HTTPError$1 extends Error {
	get name() {
		return "HTTPError";
	}
	status;
	statusText;
	headers;
	cause;
	data;
	body;
	unhandled;
	static isError(input) {
		return input instanceof Error && input?.name === "HTTPError";
	}
	static status(status$1, statusText, details) {
		return new HTTPError$1({
			...details,
			statusText,
			status: status$1
		});
	}
	constructor(arg1, arg2) {
		let messageInput;
		let details;
		if (typeof arg1 === "string") {
			messageInput = arg1;
			details = arg2;
		} else details = arg1;
		const status$1 = sanitizeStatusCode(details?.status || (details?.cause)?.status || details?.status || details?.statusCode, 500);
		const statusText = sanitizeStatusMessage(details?.statusText || (details?.cause)?.statusText || details?.statusText || details?.statusMessage);
		const message = messageInput || details?.message || (details?.cause)?.message || details?.statusText || details?.statusMessage || [
			"HTTPError",
			status$1,
			statusText
		].filter(Boolean).join(" ");
		super(message, { cause: details });
		this.cause = details;
		Error.captureStackTrace?.(this, this.constructor);
		this.status = status$1;
		this.statusText = statusText || void 0;
		const rawHeaders = details?.headers || (details?.cause)?.headers;
		this.headers = rawHeaders ? new Headers(rawHeaders) : void 0;
		this.unhandled = details?.unhandled ?? (details?.cause)?.unhandled ?? void 0;
		this.data = details?.data;
		this.body = details?.body;
	}
	get statusCode() {
		return this.status;
	}
	get statusMessage() {
		return this.statusText;
	}
	toJSON() {
		const unhandled = this.unhandled;
		return {
			status: this.status,
			statusText: this.statusText,
			unhandled,
			message: unhandled ? "HTTPError" : this.message,
			data: unhandled ? void 0 : this.data,
			...unhandled ? void 0 : this.body
		};
	}
};
function isJSONSerializable(value, _type) {
	if (value === null || value === void 0) return true;
	if (_type !== "object") return _type === "boolean" || _type === "number" || _type === "string";
	if (typeof value.toJSON === "function") return true;
	if (Array.isArray(value)) return true;
	if (typeof value.pipe === "function" || typeof value.pipeTo === "function") return false;
	if (value instanceof NullProtoObj) return true;
	const proto = Object.getPrototypeOf(value);
	return proto === Object.prototype || proto === null;
}
var kNotFound = /* @__PURE__ */ Symbol.for("h3.notFound");
var kHandled = /* @__PURE__ */ Symbol.for("h3.handled");
function toResponse(val, event, config = {}) {
	if (typeof val?.then === "function") return (val.catch?.((error) => error) || Promise.resolve(val)).then((resolvedVal) => toResponse(resolvedVal, event, config));
	const response = prepareResponse(val, event, config);
	if (typeof response?.then === "function") return toResponse(response, event, config);
	const { onResponse: onResponse$1 } = config;
	return onResponse$1 ? Promise.resolve(onResponse$1(response, event)).then(() => response) : response;
}
var HTTPResponse = class {
	#headers;
	#init;
	body;
	constructor(body, init) {
		this.body = body;
		this.#init = init;
	}
	get status() {
		return this.#init?.status || 200;
	}
	get statusText() {
		return this.#init?.statusText || "OK";
	}
	get headers() {
		return this.#headers ||= new Headers(this.#init?.headers);
	}
};
function prepareResponse(val, event, config, nested) {
	if (val === kHandled) return new FastResponse(null);
	if (val === kNotFound) val = new HTTPError({
		status: 404,
		message: `Cannot find any route matching [${event.req.method}] ${event.url}`
	});
	if (val && val instanceof Error) {
		const isHTTPError = HTTPError.isError(val);
		const error = isHTTPError ? val : new HTTPError(val);
		if (!isHTTPError) {
			error.unhandled = true;
			if (val?.stack) error.stack = val.stack;
		}
		if (error.unhandled && !config.silent) console.error(error);
		const { onError: onError$1 } = config;
		return onError$1 && !nested ? Promise.resolve(onError$1(error, event)).catch((error$1) => error$1).then((newVal) => prepareResponse(newVal ?? val, event, config, true)) : errorResponse(error, config.debug);
	}
	const preparedRes = event[kEventRes];
	const preparedHeaders = preparedRes?.[kEventResHeaders];
	if (!(val instanceof Response)) {
		const res = prepareResponseBody(val, event, config);
		const status$1 = res.status || preparedRes?.status;
		return new FastResponse(nullBody(event.req.method, status$1) ? null : res.body, {
			status: status$1,
			statusText: res.statusText || preparedRes?.statusText,
			headers: res.headers && preparedHeaders ? mergeHeaders$1(res.headers, preparedHeaders) : res.headers || preparedHeaders
		});
	}
	if (!preparedHeaders || nested || !val.ok) return val;
	try {
		mergeHeaders$1(val.headers, preparedHeaders, val.headers);
		return val;
	} catch {
		return new FastResponse(nullBody(event.req.method, val.status) ? null : val.body, {
			status: val.status,
			statusText: val.statusText,
			headers: mergeHeaders$1(val.headers, preparedHeaders)
		});
	}
}
function mergeHeaders$1(base$1, overrides, target = new Headers(base$1)) {
	for (const [name, value] of overrides) if (name === "set-cookie") target.append(name, value);
	else target.set(name, value);
	return target;
}
var frozenHeaders = () => {
	throw new Error("Headers are frozen");
};
var FrozenHeaders = class extends Headers {
	constructor(init) {
		super(init);
		this.set = this.append = this.delete = frozenHeaders;
	}
};
var emptyHeaders = /* @__PURE__ */ new FrozenHeaders({ "content-length": "0" });
var jsonHeaders = /* @__PURE__ */ new FrozenHeaders({ "content-type": "application/json;charset=UTF-8" });
function prepareResponseBody(val, event, config) {
	if (val === null || val === void 0) return {
		body: "",
		headers: emptyHeaders
	};
	const valType = typeof val;
	if (valType === "string") return { body: val };
	if (val instanceof Uint8Array) {
		event.res.headers.set("content-length", val.byteLength.toString());
		return { body: val };
	}
	if (val instanceof HTTPResponse || val?.constructor?.name === "HTTPResponse") return val;
	if (isJSONSerializable(val, valType)) return {
		body: JSON.stringify(val, void 0, config.debug ? 2 : void 0),
		headers: jsonHeaders
	};
	if (valType === "bigint") return {
		body: val.toString(),
		headers: jsonHeaders
	};
	if (val instanceof Blob) {
		const headers$1 = new Headers({
			"content-type": val.type,
			"content-length": val.size.toString()
		});
		let filename = val.name;
		if (filename) {
			filename = encodeURIComponent(filename);
			headers$1.set("content-disposition", `filename="${filename}"; filename*=UTF-8''${filename}`);
		}
		return {
			body: val.stream(),
			headers: headers$1
		};
	}
	if (valType === "symbol") return { body: val.toString() };
	if (valType === "function") return { body: `${val.name}()` };
	return { body: val };
}
function nullBody(method, status$1) {
	return method === "HEAD" || status$1 === 100 || status$1 === 101 || status$1 === 102 || status$1 === 204 || status$1 === 205 || status$1 === 304;
}
function errorResponse(error, debug) {
	return new FastResponse(JSON.stringify({
		...error.toJSON(),
		stack: debug && error.stack ? error.stack.split("\n").map((l) => l.trim()) : void 0
	}, void 0, debug ? 2 : void 0), {
		status: error.status,
		statusText: error.statusText,
		headers: error.headers ? mergeHeaders$1(jsonHeaders, error.headers) : new Headers(jsonHeaders)
	});
}
function callMiddleware(event, middleware, handler, index$1 = 0) {
	if (index$1 === middleware.length) return handler(event);
	const fn = middleware[index$1];
	let nextCalled;
	let nextResult;
	const next = () => {
		if (nextCalled) return nextResult;
		nextCalled = true;
		nextResult = callMiddleware(event, middleware, handler, index$1 + 1);
		return nextResult;
	};
	const ret = fn(event, next);
	return isUnhandledResponse(ret) ? next() : typeof ret?.then === "function" ? ret.then((resolved) => isUnhandledResponse(resolved) ? next() : resolved) : ret;
}
function isUnhandledResponse(val) {
	return val === void 0 || val === kNotFound;
}
function toMiddleware(input) {
	let h$1 = input.handler || input;
	let isFunction = typeof h$1 === "function";
	if (!isFunction && typeof input?.fetch === "function") {
		isFunction = true;
		h$1 = function _fetchHandler(event) {
			return input.fetch(event.req);
		};
	}
	if (!isFunction) return function noopMiddleware(event, next) {
		return next();
	};
	if (h$1.length === 2) return h$1;
	return function _middlewareHandler(event, next) {
		const res = h$1(event);
		return typeof res?.then === "function" ? res.then((r$1) => {
			return is404(r$1) ? next() : r$1;
		}) : is404(res) ? next() : res;
	};
}
function is404(val) {
	return isUnhandledResponse(val) || val?.status === 404 && val instanceof Response;
}
function defineHandler(input) {
	if (typeof input === "function") return handlerWithFetch(input);
	const handler = input.handler || (input.fetch ? function _fetchHandler(event) {
		return input.fetch(event.req);
	} : NoHandler);
	return Object.assign(handlerWithFetch(input.middleware?.length ? function _handlerMiddleware(event) {
		return callMiddleware(event, input.middleware, handler);
	} : handler), input);
}
function handlerWithFetch(handler) {
	if ("fetch" in handler) return handler;
	return Object.assign(handler, { fetch: (req) => {
		if (typeof req === "string") req = new URL(req, "http://_");
		if (req instanceof URL) req = new Request(req);
		const event = new H3Event(req);
		try {
			return Promise.resolve(toResponse(handler(event), event));
		} catch (error) {
			return Promise.resolve(toResponse(error, event));
		}
	} });
}
function defineLazyEventHandler(loader) {
	let handler;
	let promise;
	const resolveLazyHandler = () => {
		if (handler) return Promise.resolve(handler);
		return promise ??= Promise.resolve(loader()).then((r$1) => {
			handler = toEventHandler(r$1) || toEventHandler(r$1.default);
			if (typeof handler !== "function") throw new TypeError("Invalid lazy handler", { cause: { resolved: r$1 } });
			return handler;
		});
	};
	return defineHandler(function lazyHandler(event) {
		return handler ? handler(event) : resolveLazyHandler().then((r$1) => r$1(event));
	});
}
function toEventHandler(handler) {
	if (typeof handler === "function") return handler;
	if (typeof handler?.handler === "function") return handler.handler;
	if (typeof handler?.fetch === "function") return function _fetchHandler(event) {
		return handler.fetch(event.req);
	};
}
var NoHandler = () => kNotFound;
var H3Core = class {
	config;
	"~middleware";
	"~routes" = [];
	constructor(config = {}) {
		this["~middleware"] = [];
		this.config = config;
		this.fetch = this.fetch.bind(this);
		this.handler = this.handler.bind(this);
	}
	fetch(request) {
		return this["~request"](request);
	}
	handler(event) {
		const route = this["~findRoute"](event);
		if (route) {
			event.context.params = route.params;
			event.context.matchedRoute = route.data;
		}
		const routeHandler = route?.data.handler || NoHandler;
		const middleware = this["~getMiddleware"](event, route);
		return middleware.length > 0 ? callMiddleware(event, middleware, routeHandler) : routeHandler(event);
	}
	"~request"(request, context) {
		const event = new H3Event(request, context, this);
		let handlerRes;
		try {
			if (this.config.onRequest) {
				const hookRes = this.config.onRequest(event);
				handlerRes = typeof hookRes?.then === "function" ? hookRes.then(() => this.handler(event)) : this.handler(event);
			} else handlerRes = this.handler(event);
		} catch (error) {
			handlerRes = Promise.reject(error);
		}
		return toResponse(handlerRes, event, this.config);
	}
	"~findRoute"(_event) {}
	"~addRoute"(_route) {
		this["~routes"].push(_route);
	}
	"~getMiddleware"(_event, route) {
		const routeMiddleware = route?.data.middleware;
		const globalMiddleware$1 = this["~middleware"];
		return routeMiddleware ? [...globalMiddleware$1, ...routeMiddleware] : globalMiddleware$1;
	}
};
function callHooks(hooks, args, startIndex, task) {
	for (let i = startIndex; i < hooks.length; i += 1) try {
		const result$1 = task ? task.run(() => hooks[i](...args)) : hooks[i](...args);
		if (result$1 instanceof Promise) return result$1.then(() => callHooks(hooks, args, i + 1, task));
	} catch (error) {
		return Promise.reject(error);
	}
}
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new FastResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
var prod_default = errorHandler;
function defaultHandler(error, event, opts) {
	const isSensitive = error.unhandled;
	const status$1 = error.status || 500;
	const url = event.url || new URL(event.req.url);
	if (status$1 === 404) {
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			statusText: "Found",
			headers: { location: `${baseURL}${url.pathname.slice(1)}${url.search}` },
			body: `Redirecting...`
		};
	}
	if (isSensitive && !opts?.silent) {
		const tags = [error.unhandled && "[unhandled]"].filter(Boolean).join(" ");
		console.error(`[request error] ${tags} [${event.req.method}] ${url}\n`, error);
	}
	const headers$1 = {
		"content-type": "application/json",
		"x-content-type-options": "nosniff",
		"x-frame-options": "DENY",
		"referrer-policy": "no-referrer",
		"content-security-policy": "script-src 'none'; frame-ancestors 'none';"
	};
	if (status$1 === 404 || !event.res.headers.has("cache-control")) headers$1["cache-control"] = "no-cache";
	const body = {
		error: true,
		url: url.href,
		status: status$1,
		statusText: error.statusText,
		message: isSensitive ? "Server Error" : error.message,
		data: isSensitive ? void 0 : error.data
	};
	return {
		status: status$1,
		statusText: error.statusText,
		headers: headers$1,
		body
	};
}
var errorHandlers = [prod_default];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error$1) {
		console.error(error$1);
	}
}
String.fromCharCode;
var ENC_SLASH_RE = /%2f/gi;
function decode(text$1 = "") {
	try {
		return decodeURIComponent("" + text$1);
	} catch {
		return "" + text$1;
	}
}
function decodePath(text$1) {
	return decode(text$1.replace(ENC_SLASH_RE, "%252F"));
}
var TRAILING_SLASH_RE = /\/$|\/\?|\/#/;
var JOIN_LEADING_SLASH_RE = /^\.?\//;
function hasTrailingSlash(input = "", respectQueryAndFragment) {
	if (!respectQueryAndFragment) return input.endsWith("/");
	return TRAILING_SLASH_RE.test(input);
}
function withoutTrailingSlash(input = "", respectQueryAndFragment) {
	if (!respectQueryAndFragment) return (hasTrailingSlash(input) ? input.slice(0, -1) : input) || "/";
	if (!hasTrailingSlash(input, true)) return input || "/";
	let path = input;
	let fragment = "";
	const fragmentIndex = input.indexOf("#");
	if (fragmentIndex !== -1) {
		path = input.slice(0, fragmentIndex);
		fragment = input.slice(fragmentIndex);
	}
	const [s0, ...s] = path.split("?");
	return ((s0.endsWith("/") ? s0.slice(0, -1) : s0) || "/") + (s.length > 0 ? `?${s.join("?")}` : "") + fragment;
}
function withTrailingSlash(input = "", respectQueryAndFragment) {
	if (!respectQueryAndFragment) return input.endsWith("/") ? input : input + "/";
	if (hasTrailingSlash(input, true)) return input || "/";
	let path = input;
	let fragment = "";
	const fragmentIndex = input.indexOf("#");
	if (fragmentIndex !== -1) {
		path = input.slice(0, fragmentIndex);
		fragment = input.slice(fragmentIndex);
		if (!path) return fragment;
	}
	const [s0, ...s] = path.split("?");
	return s0 + "/" + (s.length > 0 ? `?${s.join("?")}` : "") + fragment;
}
function hasLeadingSlash(input = "") {
	return input.startsWith("/");
}
function withLeadingSlash(input = "") {
	return hasLeadingSlash(input) ? input : "/" + input;
}
function isNonEmptyURL(url) {
	return url && url !== "/";
}
function joinURL(base$1, ...input) {
	let url = base$1 || "";
	for (const segment of input.filter((url2) => isNonEmptyURL(url2))) if (url) {
		const _segment = segment.replace(JOIN_LEADING_SLASH_RE, "");
		url = withTrailingSlash(url) + _segment;
	} else url = segment;
	return url;
}
const headers = ((m$1) => function headersRouteRule(event) {
	for (const [key$1, value] of Object.entries(m$1.options || {})) event.res.headers.set(key$1, value);
});
function h(n, t$1, e, r$1, s, i, a, l) {
	return h.fromTZ(h.tp(n, t$1, e, r$1, s, i, a), l);
}
h.fromTZISO = (n, t$1, e) => h.fromTZ(k$1(n, t$1), e);
h.fromTZ = function(n, t$1) {
	let e = new Date(Date.UTC(n.y, n.m - 1, n.d, n.h, n.i, n.s)), r$1 = D(n.tz, e), s = new Date(e.getTime() - r$1), i = D(n.tz, s);
	if (i - r$1 === 0) return s;
	{
		let a = new Date(e.getTime() - i), l = D(n.tz, a);
		if (l - i === 0) return a;
		if (!t$1 && l - i > 0) return a;
		if (t$1) throw new Error("Invalid date passed to fromTZ()");
		return s;
	}
};
h.toTZ = function(n, t$1) {
	let e = n.toLocaleString("en-US", { timeZone: t$1 }).replace(/[\u202f]/, " "), r$1 = new Date(e);
	return {
		y: r$1.getFullYear(),
		m: r$1.getMonth() + 1,
		d: r$1.getDate(),
		h: r$1.getHours(),
		i: r$1.getMinutes(),
		s: r$1.getSeconds(),
		tz: t$1
	};
};
h.tp = (n, t$1, e, r$1, s, i, a) => ({
	y: n,
	m: t$1,
	d: e,
	h: r$1,
	i: s,
	s: i,
	tz: a
});
function D(n, t$1 = /* @__PURE__ */ new Date()) {
	let e = t$1.toLocaleString("en-US", {
		timeZone: n,
		timeZoneName: "shortOffset"
	}).split(" ").slice(-1)[0], r$1 = t$1.toLocaleString("en-US").replace(/[\u202f]/, " ");
	return Date.parse(`${r$1} GMT`) - Date.parse(`${r$1} ${e}`);
}
function k$1(n, t$1) {
	let e = new Date(Date.parse(n));
	if (isNaN(e)) throw new Error("minitz: Invalid ISO8601 passed to parser.");
	let r$1 = n.substring(9);
	return n.includes("Z") || r$1.includes("-") || r$1.includes("+") ? h.tp(e.getUTCFullYear(), e.getUTCMonth() + 1, e.getUTCDate(), e.getUTCHours(), e.getUTCMinutes(), e.getUTCSeconds(), "Etc/UTC") : h.tp(e.getFullYear(), e.getMonth() + 1, e.getDate(), e.getHours(), e.getMinutes(), e.getSeconds(), t$1);
}
h.minitz = h;
const tasks = { "migrate": {
	meta: { description: "" },
	resolve: () => import("../tasks/migrate.mjs").then((r$1) => r$1.default || r$1)
} };
function defineTask(def) {
	if (typeof def.run !== "function") def.run = () => {
		throw new TypeError("Task must implement a `run` method!");
	};
	return def;
}
var __runningTasks__ = {};
async function runTask(name, { payload = {}, context = {} } = {}) {
	if (__runningTasks__[name]) return __runningTasks__[name];
	if (!(name in tasks)) throw new HTTPError({
		message: `Task \`${name}\` is not available!`,
		status: 404
	});
	if (!tasks[name].resolve) throw new HTTPError({
		message: `Task \`${name}\` is not implemented!`,
		status: 501
	});
	const handler = await tasks[name].resolve();
	const taskEvent = {
		name,
		payload,
		context
	};
	__runningTasks__[name] = handler.run(taskEvent);
	try {
		return await __runningTasks__[name];
	} finally {
		delete __runningTasks__[name];
	}
}
function startScheduleRunner() {}
const user$1 = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
	image: text("image"),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$onUpdate(() => /* @__PURE__ */ new Date()).notNull(),
	role: text("role"),
	banned: integer("banned", { mode: "boolean" }).default(false),
	banReason: text("ban_reason"),
	banExpires: integer("ban_expires", { mode: "timestamp_ms" })
});
const authSchema = {
	user: user$1,
	session: sqliteTable("session", {
		id: text("id").primaryKey(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		token: text("token").notNull().unique(),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$onUpdate(() => /* @__PURE__ */ new Date()).notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id").notNull().references(() => user$1.id, { onDelete: "cascade" }),
		impersonatedBy: text("impersonated_by")
	}, (table) => [index("session_userId_idx").on(table.userId)]),
	account: sqliteTable("account", {
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id").notNull().references(() => user$1.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
		refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
		scope: text("scope"),
		password: text("password"),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
	}, (table) => [index("account_userId_idx").on(table.userId)]),
	verification: sqliteTable("verification", {
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
	}, (table) => [index("verification_identifier_idx").on(table.identifier)])
};
const article = sqliteTable("article", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	slug: text("slug").notNull().unique(),
	content: text("content").notNull(),
	excerpt: text("excerpt"),
	published: integer("published", { mode: "boolean" }).default(false).notNull(),
	publishedAt: integer("published_at", { mode: "timestamp_ms" }),
	authorId: text("author_id").notNull().references(() => user$1.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("article_authorId_idx").on(table.authorId),
	index("article_slug_idx").on(table.slug),
	index("article_published_idx").on(table.published)
]);
const tag = sqliteTable("tag", {
	id: text("id").primaryKey(),
	name: text("name").notNull().unique(),
	slug: text("slug").notNull().unique(),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [index("tag_slug_idx").on(table.slug)]);
const articleTag = sqliteTable("article_tag", {
	articleId: text("article_id").notNull().references(() => article.id, { onDelete: "cascade" }),
	tagId: text("tag_id").notNull().references(() => tag.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull()
}, (table) => [
	index("articleTag_articleId_idx").on(table.articleId),
	index("articleTag_tagId_idx").on(table.tagId),
	index("articleTag_unique_idx").on(table.articleId, table.tagId)
]);
const comment = sqliteTable("comment", {
	id: text("id").primaryKey(),
	articleId: text("article_id").notNull().references(() => article.id, { onDelete: "cascade" }),
	authorId: text("author_id").notNull().references(() => user$1.id, { onDelete: "cascade" }),
	parentId: text("parent_id").references(() => comment.id, { onDelete: "cascade" }),
	content: text("content").notNull(),
	deleted: integer("deleted", { mode: "boolean" }).default(false).notNull(),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("comment_articleId_idx").on(table.articleId),
	index("comment_authorId_idx").on(table.authorId),
	index("comment_parentId_idx").on(table.parentId)
]);
const blogSchema = {
	article,
	tag,
	articleTag,
	comment
};
const articleSelectSchema = createSelectSchema(article);
createInsertSchema(article);
createUpdateSchema(article);
const tagSelectSchema = createSelectSchema(tag);
createInsertSchema(tag);
createUpdateSchema(tag);
createSelectSchema(comment);
createInsertSchema(comment);
createUpdateSchema(comment);
const schema = {
	...authSchema,
	...blogSchema
};
const relations = defineRelations(schema, (r$1) => ({
	user: {
		sessions: r$1.many.session(),
		accounts: r$1.many.account()
	},
	session: { user: r$1.one.user({
		from: r$1.session.userId,
		to: r$1.user.id
	}) },
	account: { user: r$1.one.user({
		from: r$1.account.userId,
		to: r$1.user.id
	}) },
	article: {
		author: r$1.one.user({
			from: r$1.article.authorId,
			to: r$1.user.id
		}),
		tags: r$1.many.tag({
			from: r$1.article.id.through(r$1.articleTag.articleId),
			to: r$1.tag.id.through(r$1.articleTag.tagId)
		}),
		comments: r$1.many.comment({
			from: r$1.article.id,
			to: r$1.comment.articleId
		})
	},
	articleTag: {
		article: r$1.one.article({
			from: r$1.articleTag.articleId,
			to: r$1.article.id
		}),
		tag: r$1.one.tag({
			from: r$1.articleTag.tagId,
			to: r$1.tag.id
		})
	},
	tag: { articleTags: r$1.many.articleTag() },
	comment: {
		article: r$1.one.article({
			from: r$1.comment.articleId,
			to: r$1.article.id
		}),
		author: r$1.one.user({
			from: r$1.comment.authorId,
			to: r$1.user.id
		}),
		parent: r$1.one.comment({
			from: r$1.comment.parentId,
			to: r$1.comment.id
		}),
		children: r$1.many.comment({
			from: r$1.comment.id,
			to: r$1.comment.parentId
		})
	}
}));
var __create = Object.create;
var { getPrototypeOf: __getProtoOf, defineProperty: __defProp, getOwnPropertyNames: __getOwnPropNames } = Object;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
	target = mod != null ? __create(__getProtoOf(mod)) : {};
	let to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
		value: mod,
		enumerable: !0
	}) : target;
	for (let key$1 of __getOwnPropNames(mod)) if (!__hasOwnProp.call(to, key$1)) __defProp(to, key$1, {
		get: () => mod[key$1],
		enumerable: !0
	});
	return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
import.meta.require;
var require_fast_decode_uri_component = __commonJS((exports, module) => {
	var UTF8_ACCEPT = 12, UTF8_REJECT = 0, UTF8_DATA = [
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		2,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		3,
		4,
		4,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		5,
		6,
		7,
		7,
		7,
		7,
		7,
		7,
		7,
		7,
		7,
		7,
		7,
		7,
		8,
		7,
		7,
		10,
		9,
		9,
		9,
		11,
		4,
		4,
		4,
		4,
		4,
		4,
		4,
		4,
		4,
		4,
		4,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		12,
		0,
		0,
		0,
		0,
		24,
		36,
		48,
		60,
		72,
		84,
		96,
		0,
		12,
		12,
		12,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		24,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		24,
		24,
		24,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		24,
		24,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		48,
		48,
		48,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		48,
		48,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		48,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		127,
		63,
		63,
		63,
		0,
		31,
		15,
		15,
		15,
		7,
		7,
		7
	];
	function decodeURIComponent2(uri$1) {
		var percentPosition = uri$1.indexOf("%");
		if (percentPosition === -1) return uri$1;
		var length = uri$1.length, decoded = "", last = 0, codepoint = 0, startOfOctets = percentPosition, state = UTF8_ACCEPT;
		while (percentPosition > -1 && percentPosition < length) {
			var byte$1 = hexCodeToInt(uri$1[percentPosition + 1], 4) | hexCodeToInt(uri$1[percentPosition + 2], 0), type = UTF8_DATA[byte$1];
			if (state = UTF8_DATA[256 + state + type], codepoint = codepoint << 6 | byte$1 & UTF8_DATA[364 + type], state === UTF8_ACCEPT) decoded += uri$1.slice(last, startOfOctets), decoded += codepoint <= 65535 ? String.fromCharCode(codepoint) : String.fromCharCode(55232 + (codepoint >> 10), 56320 + (codepoint & 1023)), codepoint = 0, last = percentPosition + 3, percentPosition = startOfOctets = uri$1.indexOf("%", last);
			else if (state === UTF8_REJECT) return null;
			else {
				if (percentPosition += 3, percentPosition < length && uri$1.charCodeAt(percentPosition) === 37) continue;
				return null;
			}
		}
		return decoded + uri$1.slice(last);
	}
	var HEX = {
		"0": 0,
		"1": 1,
		"2": 2,
		"3": 3,
		"4": 4,
		"5": 5,
		"6": 6,
		"7": 7,
		"8": 8,
		"9": 9,
		a: 10,
		A: 10,
		b: 11,
		B: 11,
		c: 12,
		C: 12,
		d: 13,
		D: 13,
		e: 14,
		E: 14,
		f: 15,
		F: 15
	};
	function hexCodeToInt(c, shift) {
		var i = HEX[c];
		return i === void 0 ? 255 : i << shift;
	}
	module.exports = decodeURIComponent2;
});
var require_dist = __commonJS((exports) => {
	Object.defineProperty(exports, "__esModule", { value: !0 });
	exports.parseCookie = parseCookie$1;
	exports.parse = parseCookie$1;
	exports.stringifyCookie = stringifyCookie;
	exports.stringifySetCookie = stringifySetCookie;
	exports.serialize = stringifySetCookie;
	exports.parseSetCookie = parseSetCookie;
	exports.stringifySetCookie = stringifySetCookie;
	exports.serialize = stringifySetCookie;
	var cookieNameRegExp = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/, cookieValueRegExp = /^[\u0021-\u003A\u003C-\u007E]*$/, domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i, pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/, maxAgeRegExp = /^-?\d+$/, __toString = Object.prototype.toString, NullObject = (() => {
		let C = function() {};
		return C.prototype = Object.create(null), C;
	})();
	function parseCookie$1(str, options) {
		let obj = new NullObject(), len = str.length;
		if (len < 2) return obj;
		let dec = options?.decode || decode$1, index$1 = 0;
		do {
			let eqIdx = eqIndex(str, index$1, len);
			if (eqIdx === -1) break;
			let endIdx = endIndex(str, index$1, len);
			if (eqIdx > endIdx) {
				index$1 = str.lastIndexOf(";", eqIdx - 1) + 1;
				continue;
			}
			let key$1 = valueSlice(str, index$1, eqIdx);
			if (obj[key$1] === void 0) obj[key$1] = dec(valueSlice(str, eqIdx + 1, endIdx));
			index$1 = endIdx + 1;
		} while (index$1 < len);
		return obj;
	}
	function stringifyCookie(cookie, options) {
		let enc = options?.encode || encodeURIComponent, cookieStrings = [];
		for (let name of Object.keys(cookie)) {
			let val = cookie[name];
			if (val === void 0) continue;
			if (!cookieNameRegExp.test(name)) throw TypeError(`cookie name is invalid: ${name}`);
			let value = enc(val);
			if (!cookieValueRegExp.test(value)) throw TypeError(`cookie val is invalid: ${val}`);
			cookieStrings.push(`${name}=${value}`);
		}
		return cookieStrings.join("; ");
	}
	function stringifySetCookie(_name, _val, _opts) {
		let cookie = typeof _name === "object" ? _name : {
			..._opts,
			name: _name,
			value: String(_val)
		}, enc = (typeof _val === "object" ? _val : _opts)?.encode || encodeURIComponent;
		if (!cookieNameRegExp.test(cookie.name)) throw TypeError(`argument name is invalid: ${cookie.name}`);
		let value = cookie.value ? enc(cookie.value) : "";
		if (!cookieValueRegExp.test(value)) throw TypeError(`argument val is invalid: ${cookie.value}`);
		let str = cookie.name + "=" + value;
		if (cookie.maxAge !== void 0) {
			if (!Number.isInteger(cookie.maxAge)) throw TypeError(`option maxAge is invalid: ${cookie.maxAge}`);
			str += "; Max-Age=" + cookie.maxAge;
		}
		if (cookie.domain) {
			if (!domainValueRegExp.test(cookie.domain)) throw TypeError(`option domain is invalid: ${cookie.domain}`);
			str += "; Domain=" + cookie.domain;
		}
		if (cookie.path) {
			if (!pathValueRegExp.test(cookie.path)) throw TypeError(`option path is invalid: ${cookie.path}`);
			str += "; Path=" + cookie.path;
		}
		if (cookie.expires) {
			if (!isDate(cookie.expires) || !Number.isFinite(cookie.expires.valueOf())) throw TypeError(`option expires is invalid: ${cookie.expires}`);
			str += "; Expires=" + cookie.expires.toUTCString();
		}
		if (cookie.httpOnly) str += "; HttpOnly";
		if (cookie.secure) str += "; Secure";
		if (cookie.partitioned) str += "; Partitioned";
		if (cookie.priority) switch (typeof cookie.priority === "string" ? cookie.priority.toLowerCase() : void 0) {
			case "low":
				str += "; Priority=Low";
				break;
			case "medium":
				str += "; Priority=Medium";
				break;
			case "high":
				str += "; Priority=High";
				break;
			default: throw TypeError(`option priority is invalid: ${cookie.priority}`);
		}
		if (cookie.sameSite) switch (typeof cookie.sameSite === "string" ? cookie.sameSite.toLowerCase() : cookie.sameSite) {
			case !0:
			case "strict":
				str += "; SameSite=Strict";
				break;
			case "lax":
				str += "; SameSite=Lax";
				break;
			case "none":
				str += "; SameSite=None";
				break;
			default: throw TypeError(`option sameSite is invalid: ${cookie.sameSite}`);
		}
		return str;
	}
	function parseSetCookie(str, options) {
		let dec = options?.decode || decode$1, len = str.length, endIdx = endIndex(str, 0, len), eqIdx = eqIndex(str, 0, endIdx), setCookie = eqIdx === -1 ? {
			name: "",
			value: dec(valueSlice(str, 0, endIdx))
		} : {
			name: valueSlice(str, 0, eqIdx),
			value: dec(valueSlice(str, eqIdx + 1, endIdx))
		}, index$1 = endIdx + 1;
		while (index$1 < len) {
			let endIdx2 = endIndex(str, index$1, len), eqIdx2 = eqIndex(str, index$1, endIdx2), attr = eqIdx2 === -1 ? valueSlice(str, index$1, endIdx2) : valueSlice(str, index$1, eqIdx2), val = eqIdx2 === -1 ? void 0 : valueSlice(str, eqIdx2 + 1, endIdx2);
			switch (attr.toLowerCase()) {
				case "httponly":
					setCookie.httpOnly = !0;
					break;
				case "secure":
					setCookie.secure = !0;
					break;
				case "partitioned":
					setCookie.partitioned = !0;
					break;
				case "domain":
					setCookie.domain = val;
					break;
				case "path":
					setCookie.path = val;
					break;
				case "max-age":
					if (val && maxAgeRegExp.test(val)) setCookie.maxAge = Number(val);
					break;
				case "expires":
					if (!val) break;
					let date2 = new Date(val);
					if (Number.isFinite(date2.valueOf())) setCookie.expires = date2;
					break;
				case "priority":
					if (!val) break;
					let priority = val.toLowerCase();
					if (priority === "low" || priority === "medium" || priority === "high") setCookie.priority = priority;
					break;
				case "samesite":
					if (!val) break;
					let sameSite = val.toLowerCase();
					if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") setCookie.sameSite = sameSite;
					break;
			}
			index$1 = endIdx2 + 1;
		}
		return setCookie;
	}
	function endIndex(str, min, len) {
		let index$1 = str.indexOf(";", min);
		return index$1 === -1 ? len : index$1;
	}
	function eqIndex(str, min, max) {
		let index$1 = str.indexOf("=", min);
		return index$1 < max ? index$1 : -1;
	}
	function valueSlice(str, min, max) {
		let start = min, end = max;
		do {
			let code = str.charCodeAt(start);
			if (code !== 32 && code !== 9) break;
		} while (++start < end);
		while (end > start) {
			let code = str.charCodeAt(end - 1);
			if (code !== 32 && code !== 9) break;
			end--;
		}
		return str.slice(start, end);
	}
	function decode$1(str) {
		if (str.indexOf("%") === -1) return str;
		try {
			return decodeURIComponent(str);
		} catch (e) {
			return str;
		}
	}
	function isDate(val) {
		return __toString.call(val) === "[object Date]";
	}
});
var $ = (v$1, b$1, A, Q, O$1) => {
	let V = A.part, X = V.length, J = Q + X;
	if (X > 1) {
		if (J > b$1) return null;
		if (X < 15) {
			for (let K = 1, G = Q + 1; K < X; ++K, ++G) if (V.charCodeAt(K) !== v$1.charCodeAt(G)) return null;
		} else if (v$1.slice(Q, J) !== V) return null;
	}
	if (J === b$1) {
		if (A.store !== null) return {
			store: A.store,
			params: {}
		};
		if (A.wildcardStore !== null) return {
			store: A.wildcardStore,
			params: { "*": "" }
		};
		return null;
	}
	if (A.inert !== null) {
		let K = A.inert[v$1.charCodeAt(J)];
		if (K !== void 0) {
			let G = $(v$1, b$1, K, J, O$1);
			if (G !== null) return G;
		}
	}
	if (A.params !== null) {
		let { store: K, name: G, inert: q } = A.params, U = v$1.indexOf("/", J);
		if (U !== J) {
			if (U === -1 || U >= b$1) {
				if (K !== null) {
					let F = {};
					if (F[G] = v$1.substring(J, b$1), O$1) for (let B = 0; B < O$1.length; B++) {
						let D$1 = O$1[B](F[G], G);
						if (D$1 !== void 0) F[G] = D$1;
					}
					return {
						store: K,
						params: F
					};
				}
			} else if (q !== null) {
				let F = $(v$1, b$1, q, U, O$1);
				if (F !== null) {
					if (F.params[G] = v$1.substring(J, U), O$1) for (let B = 0; B < O$1.length; B++) {
						let D$1 = O$1[B](F.params[G], G);
						if (D$1 !== void 0) F.params[G] = D$1;
					}
					return F;
				}
			}
		}
	}
	if (A.wildcardStore !== null) return {
		store: A.wildcardStore,
		params: { "*": v$1.substring(J, b$1) }
	};
	return null;
};
__toESM(require_fast_decode_uri_component(), 1);
var isBun = typeof Bun < "u", mime = {
	aac: "audio/aac",
	abw: "application/x-abiword",
	ai: "application/postscript",
	arc: "application/octet-stream",
	avi: "video/x-msvideo",
	azw: "application/vnd.amazon.ebook",
	bin: "application/octet-stream",
	bz: "application/x-bzip",
	bz2: "application/x-bzip2",
	csh: "application/x-csh",
	css: "text/css",
	csv: "text/csv",
	doc: "application/msword",
	dll: "application/octet-stream",
	eot: "application/vnd.ms-fontobject",
	epub: "application/epub+zip",
	gif: "image/gif",
	htm: "text/html",
	html: "text/html",
	ico: "image/x-icon",
	ics: "text/calendar",
	jar: "application/java-archive",
	jpeg: "image/jpeg",
	jpg: "image/jpeg",
	js: "application/javascript",
	json: "application/json",
	mid: "audio/midi",
	midi: "audio/midi",
	mp2: "audio/mpeg",
	mp3: "audio/mpeg",
	mp4: "video/mp4",
	mpa: "video/mpeg",
	mpe: "video/mpeg",
	mpeg: "video/mpeg",
	mpkg: "application/vnd.apple.installer+xml",
	odp: "application/vnd.oasis.opendocument.presentation",
	ods: "application/vnd.oasis.opendocument.spreadsheet",
	odt: "application/vnd.oasis.opendocument.text",
	oga: "audio/ogg",
	ogv: "video/ogg",
	ogx: "application/ogg",
	otf: "font/otf",
	png: "image/png",
	pdf: "application/pdf",
	ppt: "application/vnd.ms-powerpoint",
	rar: "application/x-rar-compressed",
	rtf: "application/rtf",
	sh: "application/x-sh",
	svg: "image/svg+xml",
	swf: "application/x-shockwave-flash",
	tar: "application/x-tar",
	tif: "image/tiff",
	tiff: "image/tiff",
	ts: "application/typescript",
	ttf: "font/ttf",
	txt: "text/plain",
	vsd: "application/vnd.visio",
	wav: "audio/x-wav",
	weba: "audio/webm",
	webm: "video/webm",
	webp: "image/webp",
	woff: "font/woff",
	woff2: "font/woff2",
	xhtml: "application/xhtml+xml",
	xls: "application/vnd.ms-excel",
	xlsx: "application/vnd.ms-excel",
	xlsx_OLD: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	xml: "application/xml",
	xul: "application/vnd.mozilla.xul+xml",
	zip: "application/zip",
	"3gp": "video/3gpp",
	"3gp_DOES_NOT_CONTAIN_VIDEO": "audio/3gpp",
	"3gp2": "video/3gpp2",
	"3gp2_DOES_NOT_CONTAIN_VIDEO": "audio/3gpp2",
	"7z": "application/x-7z-compressed"
}, getFileExtension = (path) => {
	let index$1 = path.lastIndexOf(".");
	if (index$1 === -1) return "";
	return path.slice(index$1 + 1);
}, createReadStream, stat, ElysiaFile = class {
	path;
	value;
	stats;
	constructor(path) {
		this.path = path;
		if (isBun) this.value = Bun.file(path);
		else {
			if (!createReadStream || !stat) {
				if (typeof window < "u") {
					console.warn("Browser environment does not support file");
					return;
				}
				let warnMissing = (name) => console.warn(Error(`[elysia] \`file\` require \`fs${name ? "." + name : ""}\` ${name?.includes(".") ? "module " : ""}which is not available in this environment`));
				if (typeof process > "u" || typeof process.getBuiltinModule !== "function") {
					warnMissing();
					return;
				}
				let fs = process.getBuiltinModule("fs");
				if (!fs) {
					warnMissing();
					return;
				}
				if (typeof fs.createReadStream !== "function") {
					warnMissing();
					return;
				}
				if (typeof fs.promises?.stat !== "function") {
					warnMissing();
					return;
				}
				createReadStream = fs.createReadStream, stat = fs.promises.stat;
			}
			this.value = (() => createReadStream(path))(), this.stats = stat(path);
		}
	}
	get type() {
		return mime[getFileExtension(this.path)] || "application/octet-stream";
	}
	get length() {
		if (isBun) return this.value.size;
		return this.stats?.then((x) => x.size) ?? 0;
	}
}, hasHeaderShorthand = "toJSON" in new Headers(), isClass = (v$1) => typeof v$1 === "function" && /^\s*class\s+/.test(v$1.toString()) || v$1.toString && v$1.toString().startsWith("[object ") && v$1.toString() !== "[object Object]" || isNotEmpty(Object.getPrototypeOf(v$1)), isObject = (item) => item && typeof item === "object" && !Array.isArray(item), mergeDeep = (target, source, options) => {
	let skipKeys = options?.skipKeys, override = options?.override ?? !0, mergeArray = options?.mergeArray ?? !1, seen = options?.seen ?? /* @__PURE__ */ new WeakSet();
	if (!isObject(target) || !isObject(source)) return target;
	if (seen.has(source)) return target;
	seen.add(source);
	for (let [key$1, value] of Object.entries(source)) {
		if (skipKeys?.includes(key$1) || [
			"__proto__",
			"constructor",
			"prototype"
		].includes(key$1)) continue;
		if (mergeArray && Array.isArray(value)) {
			target[key$1] = Array.isArray(target[key$1]) ? [...target[key$1], ...value] : target[key$1] = value;
			continue;
		}
		if (!isObject(value) || !(key$1 in target) || isClass(value)) {
			if ((override || !(key$1 in target)) && !Object.isFrozen(target)) try {
				target[key$1] = value;
			} catch {}
			continue;
		}
		if (!Object.isFrozen(target[key$1])) try {
			target[key$1] = mergeDeep(target[key$1], value, {
				skipKeys,
				override,
				mergeArray,
				seen
			});
		} catch {}
	}
	return seen.delete(source), target;
};
[
	"start",
	"request",
	"parse",
	"transform",
	"resolve",
	"beforeHandle",
	"afterHandle",
	"mapResponse",
	"afterResponse",
	"trace",
	"error",
	"stop",
	"body",
	"headers",
	"params",
	"query",
	"response",
	"type",
	"detail"
].reduce((acc, x) => (acc[x] = !0, acc), {});
typeof Bun < "u" && Bun.hash;
var StatusMap = {
	Continue: 100,
	"Switching Protocols": 101,
	Processing: 102,
	"Early Hints": 103,
	OK: 200,
	Created: 201,
	Accepted: 202,
	"Non-Authoritative Information": 203,
	"No Content": 204,
	"Reset Content": 205,
	"Partial Content": 206,
	"Multi-Status": 207,
	"Already Reported": 208,
	"Multiple Choices": 300,
	"Moved Permanently": 301,
	Found: 302,
	"See Other": 303,
	"Not Modified": 304,
	"Temporary Redirect": 307,
	"Permanent Redirect": 308,
	"Bad Request": 400,
	Unauthorized: 401,
	"Payment Required": 402,
	Forbidden: 403,
	"Not Found": 404,
	"Method Not Allowed": 405,
	"Not Acceptable": 406,
	"Proxy Authentication Required": 407,
	"Request Timeout": 408,
	Conflict: 409,
	Gone: 410,
	"Length Required": 411,
	"Precondition Failed": 412,
	"Payload Too Large": 413,
	"URI Too Long": 414,
	"Unsupported Media Type": 415,
	"Range Not Satisfiable": 416,
	"Expectation Failed": 417,
	"I'm a teapot": 418,
	"Enhance Your Calm": 420,
	"Misdirected Request": 421,
	"Unprocessable Content": 422,
	Locked: 423,
	"Failed Dependency": 424,
	"Too Early": 425,
	"Upgrade Required": 426,
	"Precondition Required": 428,
	"Too Many Requests": 429,
	"Request Header Fields Too Large": 431,
	"Unavailable For Legal Reasons": 451,
	"Internal Server Error": 500,
	"Not Implemented": 501,
	"Bad Gateway": 502,
	"Service Unavailable": 503,
	"Gateway Timeout": 504,
	"HTTP Version Not Supported": 505,
	"Variant Also Negotiates": 506,
	"Insufficient Storage": 507,
	"Loop Detected": 508,
	"Not Extended": 510,
	"Network Authentication Required": 511
}, InvertedStatusMap = Object.fromEntries(Object.entries(StatusMap).map(([k2, v$1]) => [v$1, k2]));
new TextEncoder();
var ELYSIA_FORM_DATA = Symbol("ElysiaFormData"), form = (items) => {
	let formData = new FormData();
	if (formData[ELYSIA_FORM_DATA] = {}, items) for (let [key$1, value] of Object.entries(items)) {
		if (Array.isArray(value)) {
			formData[ELYSIA_FORM_DATA][key$1] = [];
			for (let v$1 of value) {
				if (value instanceof File) formData.append(key$1, value, value.name);
				else if (value instanceof ElysiaFile) formData.append(key$1, value.value, value.value?.name);
				else formData.append(key$1, value);
				formData[ELYSIA_FORM_DATA][key$1].push(value);
			}
			continue;
		}
		if (value instanceof File) formData.append(key$1, value, value.name);
		else if (value instanceof ElysiaFile) formData.append(key$1, value.value, value.value?.name);
		else formData.append(key$1, value);
		formData[ELYSIA_FORM_DATA][key$1] = value;
	}
	return formData;
}, randomId = typeof crypto > "u" ? () => {
	let result$1 = "", characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", charactersLength = 62;
	for (let i = 0; i < 16; i++) result$1 += characters.charAt(Math.floor(Math.random() * charactersLength));
	return result$1;
} : () => {
	let uuid = crypto.randomUUID();
	return uuid.slice(0, 8) + uuid.slice(24, 32);
}, isNotEmpty = (obj) => {
	if (!obj) return !1;
	for (let _2 in obj) return !0;
	return !1;
};
(() => {
	if (typeof Bun > "u") return !0;
	if (Bun.semver?.satisfies?.(Bun.version, ">=1.2.14")) return !0;
	return !1;
})();
var env$2 = typeof Bun < "u" ? Bun.env : typeof process < "u" ? process?.env : void 0, isProduction = (env$2?.NODE_ENV ?? env$2?.ENV) === "production", emptyHttpStatus = {
	101: void 0,
	204: void 0,
	205: void 0,
	304: void 0,
	307: void 0,
	308: void 0
};
var ElysiaCustomStatusResponse = class {
	code;
	response;
	constructor(code, response) {
		let res = response ?? (code in InvertedStatusMap ? InvertedStatusMap[code] : code);
		if (this.code = StatusMap[code] ?? code, code in emptyHttpStatus) this.response = void 0;
		else this.response = res;
	}
};
Error;
Error;
Error;
var mapValueError = (error) => {
	if (!error) return { summary: void 0 };
	let { message, path, value, type } = error;
	if (Array.isArray(path)) path = path[0];
	let property = typeof path === "string" ? path.slice(1).replaceAll("/", ".") : "unknown", isRoot = path === "";
	switch (type) {
		case 42: return {
			...error,
			summary: isRoot ? "Value should not be provided" : `Property '${property}' should not be provided`
		};
		case 45: return {
			...error,
			summary: isRoot ? "Value is missing" : `Property '${property}' is missing`
		};
		case 50:
			let quoteIndex = message.indexOf("'"), format = message.slice(quoteIndex + 1, message.indexOf("'", quoteIndex + 1));
			return {
				...error,
				summary: isRoot ? "Value should be an email" : `Property '${property}' should be ${format}`
			};
		case 54: return {
			...error,
			summary: `${message.slice(0, 9).trim()} property '${property}' to be ${message.slice(8).trim()} but found: ${value}`
		};
		case 62:
			let union = error.schema.anyOf.map((x) => `'${x?.format ?? x.type}'`).join(", ");
			return {
				...error,
				summary: isRoot ? `Value should be one of ${union}` : `Property '${property}' should be one of: ${union}`
			};
		default: return {
			summary: message,
			...error
		};
	}
};
var InvalidFileType = class InvalidFileType extends Error {
	property;
	expected;
	message;
	code = "INVALID_FILE_TYPE";
	status = 422;
	constructor(property, expected, message = `"${property}" has invalid file type`) {
		super(message);
		this.property = property;
		this.expected = expected;
		this.message = message;
		Object.setPrototypeOf(this, InvalidFileType.prototype);
	}
	toResponse(headers$1) {
		if (isProduction) return new Response(JSON.stringify({
			type: "validation",
			on: "body"
		}), {
			status: 422,
			headers: {
				...headers$1,
				"content-type": "application/json"
			}
		});
		return new Response(JSON.stringify({
			type: "validation",
			on: "body",
			summary: "Invalid file type",
			message: this.message,
			property: this.property,
			expected: this.expected
		}), {
			status: 422,
			headers: {
				...headers$1,
				"content-type": "application/json"
			}
		});
	}
};
var ValidationError = class ValidationError extends Error {
	type;
	validator;
	value;
	allowUnsafeValidationDetails;
	code = "VALIDATION";
	status = 422;
	valueError;
	get messageValue() {
		return this.valueError;
	}
	expected;
	customError;
	constructor(type, validator$1, value, allowUnsafeValidationDetails = !1, errors) {
		let message = "", error, expected, customError;
		if (validator$1?.provider === "standard" || "~standard" in validator$1 || validator$1.schema && "~standard" in validator$1.schema) {
			let standard = ("~standard" in validator$1 ? validator$1 : validator$1.schema)["~standard"];
			if (error = (errors ?? standard.validate(value).issues)?.[0], isProduction) message = JSON.stringify({
				type: "validation",
				on: type,
				found: value
			});
			else message = JSON.stringify({
				type: "validation",
				on: type,
				property: error.path?.[0] || "root",
				message: error?.message,
				summary: error?.problem,
				expected,
				found: value,
				errors
			}, null, 2);
			customError = error?.message;
		} else {
			if (value && typeof value === "object" && value instanceof ElysiaCustomStatusResponse) value = value.response;
			error = errors?.First() ?? ("Errors" in validator$1 ? validator$1.Errors(value).First() : Value.Errors(validator$1, value).First());
			let accessor = error?.path || "root", schema$1 = validator$1?.schema ?? validator$1;
			if (!isProduction && !allowUnsafeValidationDetails) try {
				expected = Value.Create(schema$1);
			} catch (error2) {
				expected = {
					type: "Could not create expected value",
					message: error2?.message,
					error: error2
				};
			}
			if (customError = error?.schema?.message || error?.schema?.error !== void 0 ? typeof error.schema.error === "function" ? error.schema.error(isProduction && !allowUnsafeValidationDetails ? {
				type: "validation",
				on: type,
				found: value
			} : {
				type: "validation",
				on: type,
				value,
				property: accessor,
				message: error?.message,
				summary: mapValueError(error).summary,
				found: value,
				expected,
				errors: "Errors" in validator$1 ? [...validator$1.Errors(value)].map(mapValueError) : [...Value.Errors(validator$1, value)].map(mapValueError)
			}, validator$1) : error.schema.error : void 0, customError !== void 0) message = typeof customError === "object" ? JSON.stringify(customError) : customError + "";
			else if (isProduction && !allowUnsafeValidationDetails) message = JSON.stringify({
				type: "validation",
				on: type,
				found: value
			});
			else message = JSON.stringify({
				type: "validation",
				on: type,
				property: accessor,
				message: error?.message,
				summary: mapValueError(error).summary,
				expected,
				found: value,
				errors: "Errors" in validator$1 ? [...validator$1.Errors(value)].map(mapValueError) : [...Value.Errors(validator$1, value)].map(mapValueError)
			}, null, 2);
		}
		super(message);
		this.type = type;
		this.validator = validator$1;
		this.value = value;
		this.allowUnsafeValidationDetails = allowUnsafeValidationDetails;
		this.valueError = error, this.expected = expected, this.customError = customError, Object.setPrototypeOf(this, ValidationError.prototype);
	}
	get all() {
		if (this.validator?.provider === "standard" || "~standard" in this.validator || "schema" in this.validator && this.validator.schema && "~standard" in this.validator.schema) return ("~standard" in this.validator ? this.validator : this.validator.schema)["~standard"].validate(this.value).issues?.map((issue) => ({
			summary: issue.message,
			path: issue.path?.join(".") || "root",
			message: issue.message,
			value: this.value
		})) || [];
		return "Errors" in this.validator ? [...this.validator.Errors(this.value)].map(mapValueError) : [...Value.Errors(this.validator, this.value)].map(mapValueError);
	}
	static simplifyModel(validator$1) {
		let model = "schema" in validator$1 ? validator$1.schema : validator$1;
		try {
			return Value.Create(model);
		} catch {
			return model;
		}
	}
	get model() {
		if ("~standard" in this.validator) return this.validator;
		return ValidationError.simplifyModel(this.validator);
	}
	toResponse(headers$1) {
		return new Response(this.message, {
			status: 400,
			headers: {
				...headers$1,
				"content-type": "application/json"
			}
		});
	}
	detail(message, allowUnsafeValidatorDetails = this.allowUnsafeValidationDetails) {
		if (!this.customError) return this.message;
		let value = this.value, expected = this.expected, errors = this.all;
		return isProduction && !allowUnsafeValidatorDetails ? {
			type: "validation",
			on: this.type,
			found: value,
			message
		} : {
			type: "validation",
			on: this.type,
			property: this.valueError?.path || "root",
			message,
			summary: mapValueError(this.valueError).summary,
			found: value,
			expected,
			errors
		};
	}
};
var tryParse = (v$1, schema$1) => {
	try {
		return JSON.parse(v$1);
	} catch {
		throw new ValidationError("property", schema$1, v$1);
	}
};
function createType(kind, func) {
	if (!TypeRegistry.Has(kind)) TypeRegistry.Set(kind, func);
	return (options = {}) => Unsafe({
		...options,
		[Kind]: kind
	});
}
var compile = (schema$1) => {
	try {
		let compiler = TypeCompiler.Compile(schema$1);
		return compiler.Create = () => Value.Create(schema$1), compiler.Error = (v$1) => new ValidationError("property", schema$1, v$1, compiler.Errors(v$1)), compiler;
	} catch {
		return {
			Check: (v$1) => Value.Check(schema$1, v$1),
			CheckThrow: (v$1) => {
				if (!Value.Check(schema$1, v$1)) throw new ValidationError("property", schema$1, v$1, Value.Errors(schema$1, v$1));
			},
			Decode: (v$1) => Value.Decode(schema$1, v$1),
			Create: () => Value.Create(schema$1),
			Error: (v$1) => new ValidationError("property", schema$1, v$1, Value.Errors(schema$1, v$1))
		};
	}
}, parseFileUnit = (size) => {
	if (typeof size === "string") switch (size.slice(-1)) {
		case "k": return +size.slice(0, size.length - 1) * 1024;
		case "m": return +size.slice(0, size.length - 1) * 1048576;
		default: return +size;
	}
	return size;
}, checkFileExtension = (type, extension) => {
	if (type.startsWith(extension)) return !0;
	return extension.charCodeAt(extension.length - 1) === 42 && extension.charCodeAt(extension.length - 2) === 47 && type.startsWith(extension.slice(0, -1));
}, _fileTypeFromBlobWarn = !1, warnIfFileTypeIsNotInstalled = () => {
	if (!_fileTypeFromBlobWarn) console.warn("[Elysia] Attempt to validate file type without 'file-type'. This may lead to security risks. We recommend installing 'file-type' to properly validate file extension."), _fileTypeFromBlobWarn = !0;
}, loadFileType = async () => import("file-type").then((x) => {
	return _fileTypeFromBlob = x.fileTypeFromBlob, _fileTypeFromBlob;
}).catch(warnIfFileTypeIsNotInstalled), _fileTypeFromBlob, fileTypeFromBlob = (file2) => {
	if (_fileTypeFromBlob) return _fileTypeFromBlob(file2);
	return loadFileType().then((mod) => {
		if (mod) return mod(file2);
	});
}, fileType = async (file2, extension, name = file2?.name ?? "") => {
	if (Array.isArray(file2)) return await Promise.all(file2.map((f$1) => fileType(f$1, extension, name))), !0;
	if (!file2) return !1;
	let result$1 = await fileTypeFromBlob(file2);
	if (!result$1) throw new InvalidFileType(name, extension);
	if (typeof extension === "string") {
		if (!checkFileExtension(result$1.mime, extension)) throw new InvalidFileType(name, extension);
	}
	for (let i = 0; i < extension.length; i++) if (checkFileExtension(result$1.mime, extension[i])) return !0;
	throw new InvalidFileType(name, extension);
}, validateFile = (options, value) => {
	if (value instanceof ElysiaFile) return !0;
	if (!(value instanceof Blob)) return !1;
	if (options.minSize && value.size < parseFileUnit(options.minSize)) return !1;
	if (options.maxSize && value.size > parseFileUnit(options.maxSize)) return !1;
	if (options.extension) {
		if (typeof options.extension === "string") return checkFileExtension(value.type, options.extension);
		for (let i = 0; i < options.extension.length; i++) if (checkFileExtension(value.type, options.extension[i])) return !0;
		return !1;
	}
	return !0;
};
var fullFormats = {
	date,
	time: getTime(!0),
	"date-time": getDateTime(!0),
	"iso-time": getTime(!1),
	"iso-date-time": getDateTime(!1),
	duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
	uri,
	"uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
	"uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
	url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
	email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
	hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
	ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
	ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
	regex,
	uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
	"json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
	"json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
	"relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
	byte,
	int32: {
		type: "number",
		validate: validateInt32
	},
	int64: {
		type: "number",
		validate: validateInt64
	},
	float: {
		type: "number",
		validate: validateNumber
	},
	double: {
		type: "number",
		validate: validateNumber
	},
	password: !0,
	binary: !0
};
function isLeapYear(year) {
	return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/, DAYS = [
	0,
	31,
	28,
	31,
	30,
	31,
	30,
	31,
	31,
	30,
	31,
	30,
	31
];
function date(str) {
	let matches = DATE.exec(str);
	if (!matches) return !1;
	let year = +matches[1], month = +matches[2], day = +matches[3];
	return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month]);
}
var TIME = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
function getTime(strictTimeZone) {
	return function(str) {
		let matches = TIME.exec(str);
		if (!matches) return !1;
		let hr = +matches[1], min = +matches[2], sec = +matches[3], tz = matches[4], tzSign = matches[5] === "-" ? -1 : 1, tzH = +(matches[6] || 0), tzM = +(matches[7] || 0);
		if (tzH > 23 || tzM > 59 || strictTimeZone && !tz) return !1;
		if (hr <= 23 && min <= 59 && sec < 60) return !0;
		let utcMin = min - tzM * tzSign, utcHr = hr - tzH * tzSign - (utcMin < 0 ? 1 : 0);
		return (utcHr === 23 || utcHr === -1) && (utcMin === 59 || utcMin === -1) && sec < 61;
	};
}
var parseDateTimeEmptySpace = (str) => {
	if (str.charCodeAt(str.length - 6) === 32) return str.slice(0, -6) + "+" + str.slice(-5);
	return str;
}, DATE_TIME_SEPARATOR = /t|\s/i;
function getDateTime(strictTimeZone) {
	let time = getTime(strictTimeZone);
	return function(str) {
		let dateTime = str.split(DATE_TIME_SEPARATOR);
		return dateTime.length === 2 && date(dateTime[0]) && time(dateTime[1]);
	};
}
var NOT_URI_FRAGMENT = /\/|:/, URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
function uri(str) {
	return NOT_URI_FRAGMENT.test(str) && URI.test(str);
}
var BYTE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
function byte(str) {
	return BYTE.lastIndex = 0, BYTE.test(str);
}
var MIN_INT32 = -2147483648, MAX_INT32 = 2147483647;
function validateInt32(value) {
	return Number.isInteger(value) && value <= MAX_INT32 && value >= MIN_INT32;
}
function validateInt64(value) {
	return Number.isInteger(value);
}
function validateNumber() {
	return !0;
}
var Z_ANCHOR = /[^\\]\\Z/;
function regex(str) {
	if (Z_ANCHOR.test(str)) return !1;
	try {
		return new RegExp(str), !0;
	} catch (e) {
		return !1;
	}
}
var isISO8601 = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/, isFormalDate = /(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{2}\s\d{4}\s\d{2}:\d{2}:\d{2}\sGMT(?:\+|-)\d{4}\s\([^)]+\)/, isShortenDate = /^(?:(?:(?:(?:0?[1-9]|[12][0-9]|3[01])[/\s-](?:0?[1-9]|1[0-2])[/\s-](?:19|20)\d{2})|(?:(?:19|20)\d{2}[/\s-](?:0?[1-9]|1[0-2])[/\s-](?:0?[1-9]|[12][0-9]|3[01]))))(?:\s(?:1[012]|0?[1-9]):[0-5][0-9](?::[0-5][0-9])?(?:\s[AP]M)?)?$/, _validateDate = fullFormats.date, _validateDateTime = fullFormats["date-time"];
if (!FormatRegistry.Has("date")) FormatRegistry.Set("date", (value) => {
	let temp = parseDateTimeEmptySpace(value).replace(/"/g, "");
	if (isISO8601.test(temp) || isFormalDate.test(temp) || isShortenDate.test(temp) || _validateDate(temp)) {
		let date2 = new Date(temp);
		if (!Number.isNaN(date2.getTime())) return !0;
	}
	return !1;
});
if (!FormatRegistry.Has("date-time")) FormatRegistry.Set("date-time", (value) => {
	let temp = value.replace(/"/g, "");
	if (isISO8601.test(temp) || isFormalDate.test(temp) || isShortenDate.test(temp) || _validateDateTime(temp)) {
		let date2 = new Date(temp);
		if (!Number.isNaN(date2.getTime())) return !0;
	}
	return !1;
});
Object.entries(fullFormats).forEach((formatEntry) => {
	let [formatName, formatValue] = formatEntry;
	if (!FormatRegistry.Has(formatName)) {
		if (formatValue instanceof RegExp) FormatRegistry.Set(formatName, (value) => formatValue.test(value));
		else if (typeof formatValue === "function") FormatRegistry.Set(formatName, formatValue);
	}
});
if (!FormatRegistry.Has("numeric")) FormatRegistry.Set("numeric", (value) => !!value && !isNaN(+value));
if (!FormatRegistry.Has("integer")) FormatRegistry.Set("integer", (value) => !!value && Number.isInteger(+value));
if (!FormatRegistry.Has("boolean")) FormatRegistry.Set("boolean", (value) => value === "true" || value === "false");
if (!FormatRegistry.Has("ObjectString")) FormatRegistry.Set("ObjectString", (value) => {
	let start = value.charCodeAt(0);
	if (start === 9 || start === 10 || start === 32) start = value.trimStart().charCodeAt(0);
	if (start !== 123 && start !== 91) return !1;
	try {
		return JSON.parse(value), !0;
	} catch {
		return !1;
	}
});
if (!FormatRegistry.Has("ArrayString")) FormatRegistry.Set("ArrayString", (value) => {
	let start = value.charCodeAt(0);
	if (start === 9 || start === 10 || start === 32) start = value.trimStart().charCodeAt(0);
	if (start !== 123 && start !== 91) return !1;
	try {
		return JSON.parse(value), !0;
	} catch {
		return !1;
	}
});
var t = Object.assign({}, Type);
createType("UnionEnum", (schema$1, value) => (typeof value === "number" || typeof value === "string" || value === null) && schema$1.enum.includes(value));
createType("ArrayBuffer", (schema$1, value) => value instanceof ArrayBuffer);
var internalFiles = createType("Files", (options, value) => {
	if (options.minItems && options.minItems > 1 && !Array.isArray(value)) return !1;
	if (!Array.isArray(value)) return validateFile(options, value);
	if (options.minItems && value.length < options.minItems) return !1;
	if (options.maxItems && value.length > options.maxItems) return !1;
	for (let i = 0; i < value.length; i++) if (!validateFile(options, value[i])) return !1;
	return !0;
}), internalFormData = createType("ElysiaForm", ({ compiler, ...schema$1 }, value) => {
	if (!(value instanceof FormData)) return !1;
	if (compiler) {
		if (!(ELYSIA_FORM_DATA in value)) throw new ValidationError("property", schema$1, value);
		if (!compiler.Check(value[ELYSIA_FORM_DATA])) throw compiler.Error(value[ELYSIA_FORM_DATA]);
	}
	return !0;
}), ElysiaType = {
	String: (property) => Type.String(property),
	Numeric: (property) => {
		let compiler = compile(Type.Number(property));
		return t.Transform(t.Union([t.String({
			format: "numeric",
			default: 0
		}), t.Number(property)], property)).Decode((value) => {
			let number = +value;
			if (isNaN(number)) return value;
			if (property && !compiler.Check(number)) throw compiler.Error(number);
			return number;
		}).Encode((value) => value);
	},
	NumericEnum(item, property) {
		let compiler = compile(Type.Enum(item, property));
		return t.Transform(t.Union([t.String({ format: "numeric" }), t.Number()], property)).Decode((value) => {
			let number = +value;
			if (isNaN(number)) throw compiler.Error(number);
			if (!compiler.Check(number)) throw compiler.Error(number);
			return number;
		}).Encode((value) => value);
	},
	Integer: (property) => {
		let compiler = compile(Type.Integer(property));
		return t.Transform(t.Union([t.String({
			format: "integer",
			default: 0
		}), Type.Integer(property)], property)).Decode((value) => {
			let number = +value;
			if (!compiler.Check(number)) throw compiler.Error(number);
			return number;
		}).Encode((value) => value);
	},
	Date: (property) => {
		let schema$1 = Type.Date(property), compiler = compile(schema$1), _default = property?.default ? new Date(property.default) : void 0;
		return t.Transform(t.Union([
			Type.Date(property),
			t.String({
				format: "date-time",
				default: _default?.toISOString()
			}),
			t.String({
				format: "date",
				default: _default?.toISOString()
			}),
			t.Number({ default: _default?.getTime() })
		], property)).Decode((value) => {
			if (typeof value === "number") {
				let date3 = new Date(value);
				if (!compiler.Check(date3)) throw compiler.Error(date3);
				return date3;
			}
			if (value instanceof Date) return value;
			let date2 = new Date(parseDateTimeEmptySpace(value));
			if (!date2 || isNaN(date2.getTime())) throw new ValidationError("property", schema$1, date2);
			if (!compiler.Check(date2)) throw compiler.Error(date2);
			return date2;
		}).Encode((value) => {
			if (value instanceof Date) return value.toISOString();
			if (typeof value === "string") {
				if (isNaN(new Date(parseDateTimeEmptySpace(value)).getTime())) throw new ValidationError("property", schema$1, value);
				return value;
			}
			if (!compiler.Check(value)) throw compiler.Error(value);
			return value;
		});
	},
	BooleanString: (property) => {
		let compiler = compile(Type.Boolean(property));
		return t.Transform(t.Union([t.Boolean(property), t.String({
			format: "boolean",
			default: !1
		})], property)).Decode((value) => {
			if (typeof value === "string") return value === "true";
			if (value !== void 0 && !compiler.Check(value)) throw compiler.Error(value);
			return value;
		}).Encode((value) => value);
	},
	ObjectString: (properties, options) => {
		let schema$1 = t.Object(properties, options), compiler = compile(schema$1);
		return t.Transform(t.Union([t.String({
			format: "ObjectString",
			default: options?.default
		}), schema$1], { elysiaMeta: "ObjectString" })).Decode((value) => {
			if (typeof value === "string") {
				if (value.charCodeAt(0) !== 123) throw new ValidationError("property", schema$1, value);
				if (!compiler.Check(value = tryParse(value, schema$1))) throw compiler.Error(value);
				return compiler.Decode(value);
			}
			return value;
		}).Encode((value) => {
			let original;
			if (typeof value === "string") value = tryParse(original = value, schema$1);
			if (!compiler.Check(value)) throw compiler.Error(value);
			return original ?? JSON.stringify(value);
		});
	},
	ArrayString: (children = t.String(), options) => {
		let schema$1 = t.Array(children, options), compiler = compile(schema$1), decode$1 = (value, isProperty = !1) => {
			if (value.charCodeAt(0) === 91) {
				if (!compiler.Check(value = tryParse(value, schema$1))) throw compiler.Error(value);
				return compiler.Decode(value);
			}
			if (isProperty) return value;
			throw new ValidationError("property", schema$1, value);
		};
		return t.Transform(t.Union([t.String({
			format: "ArrayString",
			default: options?.default
		}), schema$1], { elysiaMeta: "ArrayString" })).Decode((value) => {
			if (Array.isArray(value)) {
				let values = [];
				for (let i = 0; i < value.length; i++) {
					let v$1 = value[i];
					if (typeof v$1 === "string") {
						let t2 = decode$1(v$1, !0);
						if (Array.isArray(t2)) values = values.concat(t2);
						else values.push(t2);
						continue;
					}
					values.push(v$1);
				}
				return values;
			}
			if (typeof value === "string") return decode$1(value);
			return value;
		}).Encode((value) => {
			let original;
			if (typeof value === "string") value = tryParse(original = value, schema$1);
			if (!compiler.Check(value)) throw new ValidationError("property", schema$1, value);
			return original ?? JSON.stringify(value);
		});
	},
	ArrayQuery: (children = t.String(), options) => {
		let schema$1 = t.Array(children, options), compiler = compile(schema$1), decode$1 = (value) => {
			if (value.indexOf(",") !== -1) return compiler.Decode(value.split(","));
			return [value];
		};
		return t.Transform(t.Union([t.String({ default: options?.default }), schema$1], { elysiaMeta: "ArrayQuery" })).Decode((value) => {
			if (Array.isArray(value)) {
				let values = [];
				for (let i = 0; i < value.length; i++) {
					let v$1 = value[i];
					if (typeof v$1 === "string") {
						let t2 = decode$1(v$1);
						if (Array.isArray(t2)) values = values.concat(t2);
						else values.push(t2);
						continue;
					}
					values.push(v$1);
				}
				return values;
			}
			if (typeof value === "string") return decode$1(value);
			return value;
		}).Encode((value) => {
			let original;
			if (typeof value === "string") value = tryParse(original = value, schema$1);
			if (!compiler.Check(value)) throw new ValidationError("property", schema$1, value);
			return original ?? JSON.stringify(value);
		});
	},
	File: createType("File", validateFile),
	Files: (options = {}) => t.Transform(internalFiles(options)).Decode((value) => {
		if (Array.isArray(value)) return value;
		return [value];
	}).Encode((value) => value),
	Nullable: (schema$1, options) => t.Union([schema$1, t.Null()], {
		...options,
		nullable: !0
	}),
	MaybeEmpty: (schema$1, options) => t.Union([
		schema$1,
		t.Null(),
		t.Undefined()
	], options),
	Cookie: (properties, { domain, expires, httpOnly, maxAge, path, priority, sameSite, secure, secrets, sign, ...options } = {}) => {
		let v$1 = t.Object(properties, options);
		return v$1.config = {
			domain,
			expires,
			httpOnly,
			maxAge,
			path,
			priority,
			sameSite,
			secure,
			secrets,
			sign
		}, v$1;
	},
	UnionEnum: (values, options = {}) => {
		let type = values.every((value) => typeof value === "string") ? { type: "string" } : values.every((value) => typeof value === "number") ? { type: "number" } : values.every((value) => value === null) ? { type: "null" } : {};
		if (values.some((x) => typeof x === "object" && x !== null)) throw Error("This type does not support objects or arrays");
		return {
			default: values[0],
			...options,
			[Kind]: "UnionEnum",
			...type,
			enum: values
		};
	},
	NoValidate: (v$1, enabled = !0) => {
		return v$1.noValidate = enabled, v$1;
	},
	Form: (v$1, options = {}) => {
		let schema$1 = t.Object(v$1, {
			default: form({}),
			...options
		}), compiler = compile(schema$1);
		return t.Union([schema$1, internalFormData({ compiler })]);
	},
	ArrayBuffer(options = {}) {
		return {
			default: [
				1,
				2,
				3
			],
			...options,
			[Kind]: "ArrayBuffer"
		};
	},
	Uint8Array: (options) => {
		let compiler = compile(Type.Uint8Array(options));
		return t.Transform(t.Union([t.ArrayBuffer(), Type.Uint8Array(options)])).Decode((value) => {
			if (value instanceof ArrayBuffer) {
				if (!compiler.Check(value = new Uint8Array(value))) throw compiler.Error(value);
				return value;
			}
			return value;
		}).Encode((value) => value);
	}
};
t.BooleanString = ElysiaType.BooleanString;
t.ObjectString = ElysiaType.ObjectString;
t.ArrayString = ElysiaType.ArrayString;
t.ArrayQuery = ElysiaType.ArrayQuery;
t.Numeric = ElysiaType.Numeric;
t.NumericEnum = ElysiaType.NumericEnum;
t.Integer = ElysiaType.Integer;
t.File = (arg) => {
	if (arg?.type) loadFileType();
	return ElysiaType.File({
		default: "File",
		...arg,
		extension: arg?.type,
		type: "string",
		format: "binary"
	});
};
t.Files = (arg) => {
	if (arg?.type) loadFileType();
	return ElysiaType.Files({
		...arg,
		elysiaMeta: "Files",
		default: "Files",
		extension: arg?.type,
		type: "array",
		items: {
			...arg,
			default: "Files",
			type: "string",
			format: "binary"
		}
	});
};
t.Nullable = ElysiaType.Nullable;
t.MaybeEmpty = ElysiaType.MaybeEmpty;
t.Cookie = ElysiaType.Cookie;
t.Date = ElysiaType.Date;
t.UnionEnum = ElysiaType.UnionEnum;
t.NoValidate = ElysiaType.NoValidate;
t.Form = ElysiaType.Form;
t.ArrayBuffer = ElysiaType.ArrayBuffer;
t.Uint8Array = ElysiaType.Uint8Array;
var import_cookie = __toESM(require_dist(), 1);
__toESM(require_fast_decode_uri_component(), 1);
var hashString = (str) => {
	let hash = 2166136261, len = str.length;
	for (let i = 0; i < len; i++) hash ^= str.charCodeAt(i), hash = Math.imul(hash, 16777619);
	return hash >>> 0;
}, Cookie = class {
	name;
	jar;
	initial;
	valueHash;
	constructor(name, jar, initial = {}) {
		this.name = name;
		this.jar = jar;
		this.initial = initial;
	}
	get cookie() {
		return this.jar[this.name] ?? this.initial;
	}
	set cookie(jar) {
		if (!(this.name in this.jar)) this.jar[this.name] = this.initial;
		this.jar[this.name] = jar, this.valueHash = void 0;
	}
	get setCookie() {
		if (!(this.name in this.jar)) this.jar[this.name] = this.initial;
		return this.jar[this.name];
	}
	set setCookie(jar) {
		this.cookie = jar;
	}
	get value() {
		return this.cookie.value;
	}
	set value(value) {
		let current = this.cookie.value;
		if (current === value) return;
		if (typeof current === "object" && current !== null && typeof value === "object" && value !== null) try {
			let valueStr = JSON.stringify(value), newHash = hashString(valueStr);
			if (this.valueHash !== void 0 && this.valueHash !== newHash) this.valueHash = newHash;
			else {
				if (JSON.stringify(current) === valueStr) {
					this.valueHash = newHash;
					return;
				}
				this.valueHash = newHash;
			}
		} catch {}
		if (!(this.name in this.jar)) this.jar[this.name] = { ...this.initial };
		this.jar[this.name].value = value;
	}
	get expires() {
		return this.cookie.expires;
	}
	set expires(expires) {
		this.setCookie.expires = expires;
	}
	get maxAge() {
		return this.cookie.maxAge;
	}
	set maxAge(maxAge) {
		this.setCookie.maxAge = maxAge;
	}
	get domain() {
		return this.cookie.domain;
	}
	set domain(domain) {
		this.setCookie.domain = domain;
	}
	get path() {
		return this.cookie.path;
	}
	set path(path) {
		this.setCookie.path = path;
	}
	get secure() {
		return this.cookie.secure;
	}
	set secure(secure) {
		this.setCookie.secure = secure;
	}
	get httpOnly() {
		return this.cookie.httpOnly;
	}
	set httpOnly(httpOnly) {
		this.setCookie.httpOnly = httpOnly;
	}
	get sameSite() {
		return this.cookie.sameSite;
	}
	set sameSite(sameSite) {
		this.setCookie.sameSite = sameSite;
	}
	get priority() {
		return this.cookie.priority;
	}
	set priority(priority) {
		this.setCookie.priority = priority;
	}
	get partitioned() {
		return this.cookie.partitioned;
	}
	set partitioned(partitioned) {
		this.setCookie.partitioned = partitioned;
	}
	get secrets() {
		return this.cookie.secrets;
	}
	set secrets(secrets) {
		this.setCookie.secrets = secrets;
	}
	update(config) {
		return this.setCookie = Object.assign(this.cookie, typeof config === "function" ? config(this.cookie) : config), this;
	}
	set(config) {
		return this.setCookie = Object.assign({
			...this.initial,
			value: this.value
		}, typeof config === "function" ? config(this.cookie) : config), this;
	}
	remove() {
		if (this.value === void 0) return;
		return this.set({
			expires: /* @__PURE__ */ new Date(0),
			maxAge: 0,
			value: ""
		}), this;
	}
	toString() {
		return typeof this.value === "object" ? JSON.stringify(this.value) : this.value?.toString() ?? "";
	}
}, serializeCookie = (cookies) => {
	if (!cookies || !isNotEmpty(cookies)) return;
	let set2 = [];
	for (let [key$1, property] of Object.entries(cookies)) {
		if (!key$1 || !property) continue;
		let value = property.value;
		if (value === void 0 || value === null) continue;
		set2.push(import_cookie.serialize(key$1, typeof value === "object" ? JSON.stringify(value) : value + "", property));
	}
	if (set2.length === 0) return;
	if (set2.length === 1) return set2[0];
	return set2;
};
var env2 = isBun ? Bun.env : typeof process < "u" && process?.env ? process.env : {};
var handleFile = (response, set2) => {
	if (!isBun && response instanceof Promise) return response.then((res) => handleFile(res, set2));
	let size = response.size, immutable = set2 && (set2.status === 206 || set2.status === 304 || set2.status === 412 || set2.status === 416), defaultHeader = immutable ? {} : {
		"accept-ranges": "bytes",
		"content-range": size ? `bytes 0-${size - 1}/${size}` : void 0
	};
	if (!set2 && !size) return new Response(response);
	if (!set2) return new Response(response, { headers: defaultHeader });
	if (set2.headers instanceof Headers) {
		for (let key$1 of Object.keys(defaultHeader)) if (key$1 in set2.headers) set2.headers.append(key$1, defaultHeader[key$1]);
		if (immutable) set2.headers.delete("content-length"), set2.headers.delete("accept-ranges");
		return new Response(response, set2);
	}
	if (isNotEmpty(set2.headers)) return new Response(response, {
		status: set2.status,
		headers: Object.assign(defaultHeader, set2.headers)
	});
	return new Response(response, {
		status: set2.status,
		headers: defaultHeader
	});
}, parseSetCookies = (headers$1, setCookie) => {
	if (!headers$1) return headers$1;
	headers$1.delete("set-cookie");
	for (let i = 0; i < setCookie.length; i++) {
		let index$1 = setCookie[i].indexOf("=");
		headers$1.append("set-cookie", `${setCookie[i].slice(0, index$1)}=${setCookie[i].slice(index$1 + 1) || ""}`);
	}
	return headers$1;
}, responseToSetHeaders = (response, set2) => {
	if (set2?.headers) {
		if (response) {
			if (hasHeaderShorthand) Object.assign(set2.headers, response.headers.toJSON());
			else for (let [key$1, value] of response.headers.entries()) if (key$1 in set2.headers) set2.headers[key$1] = value;
		}
		if (set2.status === 200) set2.status = response.status;
		if (set2.headers["content-encoding"]) delete set2.headers["content-encoding"];
		return set2;
	}
	if (!response) return {
		headers: {},
		status: set2?.status ?? 200
	};
	if (hasHeaderShorthand) {
		if (set2 = {
			headers: response.headers.toJSON(),
			status: set2?.status ?? 200
		}, set2.headers["content-encoding"]) delete set2.headers["content-encoding"];
		return set2;
	}
	set2 = {
		headers: {},
		status: set2?.status ?? 200
	};
	for (let [key$1, value] of response.headers.entries()) {
		if (key$1 === "content-encoding") continue;
		if (key$1 in set2.headers) set2.headers[key$1] = value;
	}
	return set2;
}, allowRapidStream = env2.ELYSIA_RAPID_STREAM === "true", createStreamHandler = ({ mapResponse: mapResponse$1, mapCompactResponse: mapCompactResponse$1 }) => async (generator, set2, request) => {
	let init = generator.next?.();
	if (set2) handleSet(set2);
	if (init instanceof Promise) init = await init;
	if (init?.value instanceof ReadableStream) generator = init.value;
	else if (init && (typeof init?.done > "u" || init?.done)) {
		if (set2) return mapResponse$1(init.value, set2, request);
		return mapCompactResponse$1(init.value, request);
	}
	let isSSE = init?.value?.sse ?? generator?.sse ?? set2?.headers["content-type"]?.startsWith("text/event-stream"), format = isSSE ? (data) => `data: ${data}

` : (data) => data, contentType = isSSE ? "text/event-stream" : init?.value && typeof init?.value === "object" ? "application/json" : "text/plain";
	if (set2?.headers) {
		if (!set2.headers["transfer-encoding"]) set2.headers["transfer-encoding"] = "chunked";
		if (!set2.headers["content-type"]) set2.headers["content-type"] = contentType;
		if (!set2.headers["cache-control"]) set2.headers["cache-control"] = "no-cache";
	} else set2 = {
		status: 200,
		headers: {
			"content-type": contentType,
			"transfer-encoding": "chunked",
			"cache-control": "no-cache",
			connection: "keep-alive"
		}
	};
	let isBrowser = request?.headers.has("Origin");
	return new Response(new ReadableStream({ async start(controller) {
		let end = !1;
		if (request?.signal?.addEventListener("abort", () => {
			end = !0;
			try {
				controller.close();
			} catch {}
		}), !init || init.value instanceof ReadableStream);
		else if (init.value !== void 0 && init.value !== null) if (init.value.toSSE) controller.enqueue(init.value.toSSE());
		else if (typeof init.value === "object") try {
			controller.enqueue(format(JSON.stringify(init.value)));
		} catch {
			controller.enqueue(format(init.value.toString()));
		}
		else controller.enqueue(format(init.value.toString()));
		try {
			for await (let chunk of generator) {
				if (end) break;
				if (chunk === void 0 || chunk === null) continue;
				if (chunk.toSSE) controller.enqueue(chunk.toSSE());
				else {
					if (typeof chunk === "object") try {
						controller.enqueue(format(JSON.stringify(chunk)));
					} catch {
						controller.enqueue(format(chunk.toString()));
					}
					else controller.enqueue(format(chunk.toString()));
					if (!allowRapidStream && isBrowser && !isSSE) await new Promise((resolve$1) => setTimeout(() => resolve$1(), 0));
				}
			}
		} catch (error) {
			console.warn(error);
		}
		try {
			controller.close();
		} catch {}
	} }), set2);
};
async function* streamResponse(response) {
	let body = response.body;
	if (!body) return;
	let reader = body.getReader(), decoder = new TextDecoder();
	try {
		while (!0) {
			let { done, value } = await reader.read();
			if (done) break;
			if (typeof value === "string") yield value;
			else yield decoder.decode(value);
		}
	} finally {
		reader.releaseLock();
	}
}
var handleSet = (set2) => {
	if (typeof set2.status === "string") set2.status = StatusMap[set2.status];
	if (set2.cookie && isNotEmpty(set2.cookie)) {
		let cookie = serializeCookie(set2.cookie);
		if (cookie) set2.headers["set-cookie"] = cookie;
	}
	if (set2.headers["set-cookie"] && Array.isArray(set2.headers["set-cookie"])) set2.headers = parseSetCookies(new Headers(set2.headers), set2.headers["set-cookie"]);
}, createResponseHandler = (handler) => {
	let handleStream$1 = createStreamHandler(handler);
	return (response, set2, request) => {
		let isCookieSet = !1;
		if (set2.headers instanceof Headers) {
			for (let key$1 of set2.headers.keys()) if (key$1 === "set-cookie") {
				if (isCookieSet) continue;
				isCookieSet = !0;
				for (let cookie of set2.headers.getSetCookie()) response.headers.append("set-cookie", cookie);
			} else if (!response.headers.has(key$1)) response.headers.set(key$1, set2.headers?.get(key$1) ?? "");
		} else for (let key$1 in set2.headers) if (key$1 === "set-cookie") response.headers.append(key$1, set2.headers[key$1]);
		else if (!response.headers.has(key$1)) response.headers.set(key$1, set2.headers[key$1]);
		let status2 = set2.status ?? 200;
		if (response.status !== status2 && status2 !== 200 && (response.status <= 300 || response.status > 400)) {
			let newResponse = new Response(response.body, {
				headers: response.headers,
				status: set2.status
			});
			if (!newResponse.headers.has("content-length") && newResponse.headers.get("transfer-encoding") === "chunked") return handleStream$1(streamResponse(newResponse), responseToSetHeaders(newResponse, set2), request);
			return newResponse;
		}
		if (!response.headers.has("content-length") && response.headers.get("transfer-encoding") === "chunked") return handleStream$1(streamResponse(response), responseToSetHeaders(response, set2), request);
		return response;
	};
};
var handleElysiaFile = (file2, set2 = { headers: {} }) => {
	let path = file2.path, contentType = mime[path.slice(path.lastIndexOf(".") + 1)];
	if (contentType) set2.headers["content-type"] = contentType;
	if (file2.stats && set2.status !== 206 && set2.status !== 304 && set2.status !== 412 && set2.status !== 416) return file2.stats.then((stat2) => {
		let size = stat2.size;
		if (size !== void 0) set2.headers["content-range"] = `bytes 0-${size - 1}/${size}`, set2.headers["content-length"] = size;
		return handleFile(file2.value, set2);
	});
	return handleFile(file2.value, set2);
}, mapResponse = (response, set2, request) => {
	if (isNotEmpty(set2.headers) || set2.status !== 200 || set2.cookie) switch (handleSet(set2), response?.constructor?.name) {
		case "String": return set2.headers["content-type"] = "text/plain", new Response(response, set2);
		case "Array":
		case "Object": return set2.headers["content-type"] = "application/json", new Response(JSON.stringify(response), set2);
		case "ElysiaFile": return handleElysiaFile(response, set2);
		case "File": return handleFile(response, set2);
		case "Blob": return handleFile(response, set2);
		case "ElysiaCustomStatusResponse": return set2.status = response.code, mapResponse(response.response, set2, request);
		case void 0:
			if (!response) return new Response("", set2);
			return new Response(JSON.stringify(response), set2);
		case "Response": return handleResponse(response, set2, request);
		case "Error": return errorToResponse(response, set2);
		case "Promise": return response.then((x) => mapResponse(x, set2, request));
		case "Function": return mapResponse(response(), set2, request);
		case "Number":
		case "Boolean": return new Response(response.toString(), set2);
		case "Cookie":
			if (response instanceof Cookie) return new Response(response.value, set2);
			return new Response(response?.toString(), set2);
		case "FormData": return new Response(response, set2);
		default:
			if (response instanceof Response) return handleResponse(response, set2, request);
			if (response instanceof Promise) return response.then((x) => mapResponse(x, set2));
			if (response instanceof Error) return errorToResponse(response, set2);
			if (response instanceof ElysiaCustomStatusResponse) return set2.status = response.code, mapResponse(response.response, set2, request);
			if (typeof response?.next === "function" || response instanceof ReadableStream) return handleStream(response, set2, request);
			if (typeof response?.then === "function") return response.then((x) => mapResponse(x, set2));
			if (typeof response?.toResponse === "function") return mapResponse(response.toResponse(), set2);
			if ("charCodeAt" in response) {
				let code = response.charCodeAt(0);
				if (code === 123 || code === 91) {
					if (!set2.headers["Content-Type"]) set2.headers["Content-Type"] = "application/json";
					return new Response(JSON.stringify(response), set2);
				}
			}
			return new Response(response, set2);
	}
	if (typeof response?.next === "function" || response instanceof ReadableStream) return handleStream(response, set2, request);
	return mapCompactResponse(response, request);
}, mapEarlyResponse = (response, set2, request) => {
	if (response === void 0 || response === null) return;
	if (isNotEmpty(set2.headers) || set2.status !== 200 || set2.cookie) switch (handleSet(set2), response?.constructor?.name) {
		case "String": return set2.headers["content-type"] = "text/plain", new Response(response, set2);
		case "Array":
		case "Object": return set2.headers["content-type"] = "application/json", new Response(JSON.stringify(response), set2);
		case "ElysiaFile": return handleElysiaFile(response, set2);
		case "File": return handleFile(response, set2);
		case "Blob": return handleFile(response, set2);
		case "ElysiaCustomStatusResponse": return set2.status = response.code, mapEarlyResponse(response.response, set2, request);
		case void 0:
			if (!response) return;
			return new Response(JSON.stringify(response), set2);
		case "Response": return handleResponse(response, set2, request);
		case "Promise": return response.then((x) => mapEarlyResponse(x, set2));
		case "Error": return errorToResponse(response, set2);
		case "Function": return mapEarlyResponse(response(), set2);
		case "Number":
		case "Boolean": return new Response(response.toString(), set2);
		case "FormData": return new Response(response);
		case "Cookie":
			if (response instanceof Cookie) return new Response(response.value, set2);
			return new Response(response?.toString(), set2);
		default:
			if (response instanceof Response) return handleResponse(response, set2, request);
			if (response instanceof Promise) return response.then((x) => mapEarlyResponse(x, set2));
			if (response instanceof Error) return errorToResponse(response, set2);
			if (response instanceof ElysiaCustomStatusResponse) return set2.status = response.code, mapEarlyResponse(response.response, set2, request);
			if (typeof response?.next === "function" || response instanceof ReadableStream) return handleStream(response, set2, request);
			if (typeof response?.then === "function") return response.then((x) => mapEarlyResponse(x, set2));
			if (typeof response?.toResponse === "function") return mapEarlyResponse(response.toResponse(), set2);
			if ("charCodeAt" in response) {
				let code = response.charCodeAt(0);
				if (code === 123 || code === 91) {
					if (!set2.headers["Content-Type"]) set2.headers["Content-Type"] = "application/json";
					return new Response(JSON.stringify(response), set2);
				}
			}
			return new Response(response, set2);
	}
	else switch (response?.constructor?.name) {
		case "String": return set2.headers["content-type"] = "text/plain", new Response(response);
		case "Array":
		case "Object": return set2.headers["content-type"] = "application/json", new Response(JSON.stringify(response), set2);
		case "ElysiaFile": return handleElysiaFile(response, set2);
		case "File": return handleFile(response, set2);
		case "Blob": return handleFile(response, set2);
		case "ElysiaCustomStatusResponse": return set2.status = response.code, mapEarlyResponse(response.response, set2, request);
		case void 0:
			if (!response) return new Response("");
			return new Response(JSON.stringify(response), { headers: { "content-type": "application/json" } });
		case "Response": return response;
		case "Promise": return response.then((x) => {
			let r$1 = mapEarlyResponse(x, set2);
			if (r$1 !== void 0) return r$1;
		});
		case "Error": return errorToResponse(response, set2);
		case "Function": return mapCompactResponse(response(), request);
		case "Number":
		case "Boolean": return new Response(response.toString());
		case "Cookie":
			if (response instanceof Cookie) return new Response(response.value, set2);
			return new Response(response?.toString(), set2);
		case "FormData": return new Response(response);
		default:
			if (response instanceof Response) return response;
			if (response instanceof Promise) return response.then((x) => mapEarlyResponse(x, set2));
			if (response instanceof Error) return errorToResponse(response, set2);
			if (response instanceof ElysiaCustomStatusResponse) return set2.status = response.code, mapEarlyResponse(response.response, set2, request);
			if (typeof response?.next === "function" || response instanceof ReadableStream) return handleStream(response, set2, request);
			if (typeof response?.then === "function") return response.then((x) => mapEarlyResponse(x, set2));
			if (typeof response?.toResponse === "function") return mapEarlyResponse(response.toResponse(), set2);
			if ("charCodeAt" in response) {
				let code = response.charCodeAt(0);
				if (code === 123 || code === 91) {
					if (!set2.headers["Content-Type"]) set2.headers["Content-Type"] = "application/json";
					return new Response(JSON.stringify(response), set2);
				}
			}
			return new Response(response);
	}
}, mapCompactResponse = (response, request) => {
	switch (response?.constructor?.name) {
		case "String": return new Response(response, { headers: { "Content-Type": "text/plain" } });
		case "Object":
		case "Array": return new Response(JSON.stringify(response), { headers: { "Content-Type": "application/json" } });
		case "ElysiaFile": return handleElysiaFile(response);
		case "File": return handleFile(response);
		case "Blob": return handleFile(response);
		case "ElysiaCustomStatusResponse": return mapResponse(response.response, {
			status: response.code,
			headers: {}
		});
		case void 0:
			if (!response) return new Response("");
			return new Response(JSON.stringify(response), { headers: { "content-type": "application/json" } });
		case "Response": return response;
		case "Error": return errorToResponse(response);
		case "Promise": return response.then((x) => mapCompactResponse(x, request));
		case "Function": return mapCompactResponse(response(), request);
		case "Number":
		case "Boolean": return new Response(response.toString());
		case "FormData": return new Response(response);
		default:
			if (response instanceof Response) return response;
			if (response instanceof Promise) return response.then((x) => mapCompactResponse(x, request));
			if (response instanceof Error) return errorToResponse(response);
			if (response instanceof ElysiaCustomStatusResponse) return mapResponse(response.response, {
				status: response.code,
				headers: {}
			});
			if (typeof response?.next === "function" || response instanceof ReadableStream) return handleStream(response, void 0, request);
			if (typeof response?.then === "function") return response.then((x) => mapResponse(x, set));
			if (typeof response?.toResponse === "function") return mapCompactResponse(response.toResponse());
			if ("charCodeAt" in response) {
				let code = response.charCodeAt(0);
				if (code === 123 || code === 91) return new Response(JSON.stringify(response), { headers: { "Content-Type": "application/json" } });
			}
			return new Response(response);
	}
}, errorToResponse = (error, set2) => {
	if (typeof error?.toResponse === "function") {
		let raw = error.toResponse(), targetSet = set2 ?? {
			headers: {},
			status: 200,
			redirect: ""
		}, apply = (resolved) => {
			if (resolved instanceof Response) targetSet.status = resolved.status;
			return mapResponse(resolved, targetSet);
		};
		return typeof raw?.then === "function" ? raw.then(apply) : apply(raw);
	}
	return new Response(JSON.stringify({
		name: error?.name,
		message: error?.message,
		cause: error?.cause
	}), {
		status: set2?.status !== 200 ? set2?.status ?? 500 : 500,
		headers: set2?.headers
	});
}, createStaticHandler = (handle, hooks, setHeaders = {}) => {
	if (typeof handle === "function") return;
	let response = mapResponse(handle, { headers: setHeaders });
	if (!hooks.parse?.length && !hooks.transform?.length && !hooks.beforeHandle?.length && !hooks.afterHandle?.length) return () => response.clone();
}, handleResponse = createResponseHandler({
	mapResponse,
	mapCompactResponse
}), handleStream = createStreamHandler({
	mapResponse,
	mapCompactResponse
});
var WebStandardAdapter = {
	name: "web-standard",
	isWebStandard: !0,
	handler: {
		mapResponse,
		mapEarlyResponse,
		mapCompactResponse,
		createStaticHandler
	},
	composeHandler: {
		mapResponseContext: "c.request",
		preferWebstandardHeaders: !0,
		headers: `c.headers={}
for(const [k,v] of c.request.headers.entries())c.headers[k]=v
`,
		parser: {
			json(isOptional$1) {
				if (isOptional$1) return `try{c.body=await c.request.json()}catch{}
`;
				return `c.body=await c.request.json()
`;
			},
			text() {
				return `c.body=await c.request.text()
`;
			},
			urlencoded() {
				return `c.body=parseQuery(await c.request.text())
`;
			},
			arrayBuffer() {
				return `c.body=await c.request.arrayBuffer()
`;
			},
			formData(isOptional$1) {
				let fnLiteral = `
c.body={}
`;
				if (isOptional$1) fnLiteral += "let form;try{form=await c.request.formData()}catch{}";
				else fnLiteral += `const form=await c.request.formData()
`;
				return fnLiteral + `for(const key of form.keys()){if(c.body[key]) continue
const value=form.getAll(key)
if(value.length===1)c.body[key]=value[0]
else c.body[key]=value}`;
			}
		}
	},
	async stop(app, closeActiveConnections) {
		if (!app.server) throw Error("Elysia isn't running. Call `app.listen` to start the server.");
		if (app.server) {
			if (await app.server.stop(closeActiveConnections), app.server = null, app.event.stop?.length) for (let i = 0; i < app.event.stop.length; i++) app.event.stop[i].fn(app);
		}
	},
	composeGeneralHandler: {
		parameters: "r",
		createContext(app) {
			let decoratorsLiteral = "", fnLiteral = "", defaultHeaders = app.setHeaders;
			for (let key$1 of Object.keys(app.decorator)) decoratorsLiteral += `,'${key$1}':decorator['${key$1}']`;
			let standardHostname = app.config.handler?.standardHostname ?? !0, hasTrace = !!app.event.trace?.length;
			if (fnLiteral += `const u=r.url,s=u.indexOf('/',${standardHostname ? 11 : 7}),qi=u.indexOf('?',s+1),p=u.substring(s,qi===-1?undefined:qi)
`, hasTrace) fnLiteral += `const id=randomId()
`;
			if (fnLiteral += "const c={request:r,store,qi,path:p,url:u,redirect,status,set:{headers:", fnLiteral += Object.keys(defaultHeaders ?? {}).length ? "Object.assign({},app.setHeaders)" : "Object.create(null)", fnLiteral += ",status:200}", app.inference.server) fnLiteral += ",get server(){return app.getServer()}";
			if (hasTrace) fnLiteral += ",[ELYSIA_REQUEST_ID]:id";
			return fnLiteral += decoratorsLiteral, fnLiteral += `}
`, fnLiteral;
		},
		error404(hasEventHook, hasErrorHook, afterHandle = "") {
			let findDynamicRoute = "if(route===null){" + afterHandle + (hasErrorHook ? "" : "c.set.status=404") + `
return `;
			if (hasErrorHook) findDynamicRoute += `app.handleError(c,notFound,false,${this.parameters})`;
			else findDynamicRoute += hasEventHook ? "c.response=c.responseValue=new Response(error404Message,{status:c.set.status===200?404:c.set.status,headers:c.set.headers})" : "c.response=c.responseValue=error404.clone()";
			return findDynamicRoute += "}", {
				declare: hasErrorHook ? "" : `const error404Message=notFound.message.toString()
const error404=new Response(error404Message,{status:404})
`,
				code: findDynamicRoute
			};
		}
	},
	composeError: {
		mapResponseContext: "",
		validationError: "set.headers['content-type']='application/json';return mapResponse(error.message,set)",
		unknownError: "set.status=error.status??set.status??500;return mapResponse(error.message,set)"
	},
	listen() {
		return () => {
			throw Error("WebStandard does not support listen, you might want to export default Elysia.fetch instead");
		};
	}
};
__toESM(require_fast_decode_uri_component(), 1);
__toESM(require_fast_decode_uri_component(), 1);
var Kind3 = Symbol.for("TypeBox.Kind"), Hint = Symbol.for("TypeBox.Hint"), isSpecialProperty = (name) => /(\ |-|\t|\n|\.|\[|\]|\{|\})/.test(name) || !isNaN(+name[0]), joinProperty = (v1, v2, isOptional$1 = !1) => {
	if (typeof v2 === "number") return `${v1}[${v2}]`;
	if (isSpecialProperty(v2)) return `${v1}${isOptional$1 ? "?." : ""}["${v2}"]`;
	return `${v1}${isOptional$1 ? "?" : ""}.${v2}`;
}, encodeProperty = (v$1) => isSpecialProperty(v$1) ? `"${v$1}"` : v$1, sanitize = (key$1, sanitize2 = 0, schema$1) => {
	if (schema$1.type !== "string" || schema$1.const || schema$1.trusted) return key$1;
	let hof = "";
	for (let i = sanitize2 - 1; i >= 0; i--) hof += `d.h${i}(`;
	return hof + key$1 + ")".repeat(sanitize2);
}, mergeObjectIntersection = (schema$1) => {
	if (!schema$1.allOf || Kind3 in schema$1 && (schema$1[Kind3] !== "Intersect" || schema$1.type !== "object")) return schema$1;
	let { allOf, ...newSchema } = schema$1;
	if (newSchema.properties = {}, Kind3 in newSchema) newSchema[Kind3] = "Object";
	for (let type of allOf) {
		if (type.type !== "object") continue;
		let { properties, required, type: _2, [Kind3]: __, ...rest } = type;
		if (required) newSchema.required = newSchema.required ? newSchema.required.concat(required) : required;
		Object.assign(newSchema, rest);
		for (let property in type.properties) newSchema.properties[property] = mergeObjectIntersection(type.properties[property]);
	}
	return newSchema;
}, handleRecord = (schema$1, property, instruction) => {
	let child = schema$1.patternProperties["^(.*)$"] ?? schema$1.patternProperties[Object.keys(schema$1.patternProperties)[0]];
	if (!child) return property;
	let i = instruction.array;
	instruction.array++;
	let v$1 = `(()=>{const ar${i}s=Object.keys(${property}),ar${i}v={};for(let i=0;i<ar${i}s.length;i++){const ar${i}p=${property}[ar${i}s[i]];ar${i}v[ar${i}s[i]]=${mirror(child, `ar${i}p`, instruction)}`, optionals = instruction.optionalsInArray[i + 1];
	if (optionals) for (let oi = 0; oi < optionals.length; oi++) {
		let target = `ar${i}v[ar${i}s[i]]${optionals[oi]}`;
		v$1 += `;if(${target}===undefined)delete ${target}`;
	}
	return v$1 += `}return ar${i}v})()`, v$1;
}, handleTuple = (schema$1, property, instruction) => {
	let i = instruction.array;
	instruction.array++;
	let isRoot = property === "v" && !instruction.unions.length, v$1 = "";
	if (!isRoot) v$1 = "(()=>{";
	v$1 += `const ar${i}v=[`;
	for (let i2 = 0; i2 < schema$1.length; i2++) {
		if (i2 !== 0) v$1 += ",";
		v$1 += mirror(schema$1[i2], joinProperty(property, i2, instruction.parentIsOptional), instruction);
	}
	if (v$1 += "];", !isRoot) v$1 += `return ar${i}v})()`;
	return v$1;
};
function deepClone(source, weak = /* @__PURE__ */ new WeakMap()) {
	if (source === null || typeof source !== "object" || typeof source === "function") return source;
	if (weak.has(source)) return weak.get(source);
	if (Array.isArray(source)) {
		let copy = Array(source.length);
		weak.set(source, copy);
		for (let i = 0; i < source.length; i++) copy[i] = deepClone(source[i], weak);
		return copy;
	}
	if (typeof source === "object") {
		let keys = Object.keys(source).concat(Object.getOwnPropertySymbols(source)), cloned = {};
		for (let key$1 of keys) cloned[key$1] = deepClone(source[key$1], weak);
		return cloned;
	}
	return source;
}
var handleUnion = (schemas, property, instruction) => {
	if (instruction.TypeCompiler === void 0) {
		if (!instruction.typeCompilerWanred) console.warn(Error("[exact-mirror] TypeBox's TypeCompiler is required to use Union")), instruction.typeCompilerWanred = !0;
		return property;
	}
	instruction.unionKeys[property] = 1;
	let ui = instruction.unions.length, typeChecks = instruction.unions[ui] = [], v$1 = `(()=>{
`, unwrapRef = (type) => {
		if (!(Kind3 in type) || !type.$ref) return type;
		if (type[Kind3] === "This") return deepClone(instruction.definitions[type.$ref]);
		else if (type[Kind3] === "Ref") if (!instruction.modules) console.warn(Error("[exact-mirror] modules is required when using nested cyclic reference"));
		else return instruction.modules.Import(type.$ref);
		return type;
	}, cleanThenCheck = "";
	for (let i = 0; i < schemas.length; i++) {
		let type = unwrapRef(schemas[i]);
		if (Array.isArray(type.anyOf)) for (let i2 = 0; i2 < type.anyOf.length; i2++) type.anyOf[i2] = unwrapRef(type.anyOf[i2]);
		else if (type.items) if (Array.isArray(type.items)) for (let i2 = 0; i2 < type.items.length; i2++) type.items[i2] = unwrapRef(type.items[i2]);
		else type.items = unwrapRef(type.items);
		typeChecks.push(TypeCompiler.Compile(type)), v$1 += `if(d.unions[${ui}][${i}].Check(${property})){return ${mirror(type, property, {
			...instruction,
			recursion: instruction.recursion + 1,
			parentIsOptional: !0
		})}}
`, cleanThenCheck += (i ? "" : "let ") + "tmp=" + mirror(type, property, {
			...instruction,
			recursion: instruction.recursion + 1,
			parentIsOptional: !0
		}) + `
if(d.unions[${ui}][${i}].Check(tmp))return tmp
`;
	}
	if (cleanThenCheck) v$1 += cleanThenCheck;
	return v$1 += `return ${instruction.removeUnknownUnionType ? "undefined" : property}`, v$1 + "})()";
}, mirror = (schema$1, property, instruction) => {
	if (!schema$1) return "";
	let isRoot = property === "v" && !instruction.unions.length;
	if (Kind3 in schema$1 && schema$1[Kind3] === "Import" && schema$1.$ref in schema$1.$defs) return mirror(schema$1.$defs[schema$1.$ref], property, {
		...instruction,
		definitions: Object.assign(instruction.definitions, schema$1.$defs)
	});
	if (isRoot && schema$1.type !== "object" && schema$1.type !== "array" && !schema$1.anyOf) return `return ${sanitize("v", instruction.sanitize?.length, schema$1)}`;
	if (instruction.recursion >= instruction.recursionLimit) return property;
	let v$1 = "";
	if (schema$1.$id && Hint in schema$1) instruction.definitions[schema$1.$id] = schema$1;
	switch (schema$1.type) {
		case "object":
			if (schema$1[Kind3] === "Record") {
				v$1 = handleRecord(schema$1, property, instruction);
				break;
			}
			if (schema$1 = mergeObjectIntersection(schema$1), v$1 += "{", schema$1.additionalProperties) v$1 += `...${property},`;
			let keys = Object.keys(schema$1.properties);
			for (let i2 = 0; i2 < keys.length; i2++) {
				let key$1 = keys[i2], isOptional$1 = !schema$1.required || schema$1.required && !schema$1.required.includes(key$1) || Array.isArray(schema$1.properties[key$1].anyOf), name = joinProperty(property, key$1, instruction.parentIsOptional);
				if (isOptional$1) {
					let index$1 = instruction.array;
					if (property.startsWith("ar")) {
						let dotIndex = name.indexOf("."), refName;
						if (dotIndex >= 0) refName = name.slice(dotIndex);
						else refName = name.slice(property.length);
						if (refName.startsWith("?.")) if (refName.charAt(2) === "[") refName = refName.slice(2);
						else refName = refName.slice(1);
						let array = instruction.optionalsInArray;
						if (array[index$1]) array[index$1].push(refName);
						else array[index$1] = [refName];
					} else instruction.optionals.push(name);
				}
				let child = schema$1.properties[key$1];
				if (i2 !== 0) v$1 += ",";
				v$1 += `${encodeProperty(key$1)}:${isOptional$1 ? `${name}===undefined?undefined:` : ""}${mirror(child, name, {
					...instruction,
					recursion: instruction.recursion + 1,
					parentIsOptional: isOptional$1
				})}`;
			}
			v$1 += "}";
			break;
		case "array":
			if (schema$1.items.type !== "object" && schema$1.items.type !== "array") {
				if (Array.isArray(schema$1.items)) {
					v$1 = handleTuple(schema$1.items, property, instruction);
					break;
				} else if (isRoot && !Array.isArray(schema$1.items.anyOf)) return "return v";
				else if (Kind3 in schema$1.items && schema$1.items.$ref && (schema$1.items[Kind3] === "Ref" || schema$1.items[Kind3] === "This")) v$1 = mirror(deepClone(instruction.definitions[schema$1.items.$ref]), property, {
					...instruction,
					parentIsOptional: !0,
					recursion: instruction.recursion + 1
				});
				else if (!Array.isArray(schema$1.items.anyOf)) {
					v$1 = property;
					break;
				}
			}
			let i = instruction.array;
			instruction.array++;
			let reference = property;
			if (isRoot) v$1 = `const ar${i}v=new Array(${property}.length);`;
			else reference = `ar${i}s`, v$1 = `((${reference})=>{const ar${i}v=new Array(${reference}.length);`;
			v$1 += `for(let i=0;i<${reference}.length;i++){const ar${i}p=${reference}[i];ar${i}v[i]=${mirror(schema$1.items, `ar${i}p`, instruction)}`;
			let optionals = instruction.optionalsInArray[i + 1];
			if (optionals) for (let oi = 0; oi < optionals.length; oi++) {
				let target = `ar${i}v[i]${optionals[oi]}`;
				v$1 += `;if(${target}===undefined)delete ${target}`;
			}
			if (v$1 += "}", !isRoot) v$1 += `return ar${i}v})(${property})`;
			break;
		default:
			if (schema$1.$ref && schema$1.$ref in instruction.definitions) return mirror(instruction.definitions[schema$1.$ref], property, instruction);
			if (Array.isArray(schema$1.anyOf)) {
				v$1 = handleUnion(schema$1.anyOf, property, instruction);
				break;
			}
			v$1 = sanitize(property, instruction.sanitize?.length, schema$1);
			break;
	}
	if (!isRoot) return v$1;
	if (schema$1.type === "array") v$1 = `${v$1}const x=ar0v;`;
	else v$1 = `const x=${v$1}
`;
	for (let i = 0; i < instruction.optionals.length; i++) {
		let key$1 = instruction.optionals[i], prop = key$1.slice(1);
		if (v$1 += `if(${key$1}===undefined`, instruction.unionKeys[key$1]) v$1 += `||x${prop}===undefined`;
		let shouldQuestion = prop.charCodeAt(0) !== 63 && schema$1.type !== "array";
		v$1 += `)delete x${shouldQuestion ? prop.charCodeAt(0) === 91 ? "?." : "?" : ""}${prop}
`;
	}
	return `${v$1}return x`;
}, createMirror = (schema$1, { TypeCompiler: TypeCompiler22, modules, definitions, sanitize: sanitize2, recursionLimit = 8, removeUnknownUnionType = !1 } = {}) => {
	let unions = [];
	if (typeof sanitize2 === "function") sanitize2 = [sanitize2];
	let f$1 = mirror(schema$1, "v", {
		optionals: [],
		optionalsInArray: [],
		array: 0,
		parentIsOptional: !1,
		unions,
		unionKeys: {},
		TypeCompiler: TypeCompiler22,
		modules,
		definitions: definitions ?? modules?.$defs ?? {},
		sanitize: sanitize2,
		recursion: 0,
		recursionLimit,
		removeUnknownUnionType
	});
	if (!unions.length && !sanitize2?.length) return Function("v", f$1);
	let hof;
	if (sanitize2?.length) {
		hof = {};
		for (let i = 0; i < sanitize2.length; i++) hof[`h${i}`] = sanitize2[i];
	}
	return Function("d", `return function mirror(v){${f$1}}`)({
		unions,
		...hof
	});
}, replaceSchemaTypeFromManyOptions = (schema$1, options) => {
	if (Array.isArray(options)) {
		let result$1 = schema$1;
		for (let option of options) result$1 = replaceSchemaTypeFromOption(result$1, option);
		return result$1;
	}
	return replaceSchemaTypeFromOption(schema$1, options);
}, replaceSchemaTypeFromOption = (schema$1, option) => {
	if (option.rootOnly && option.excludeRoot) throw Error("Can't set both rootOnly and excludeRoot");
	if (option.rootOnly && option.onlyFirst) throw Error("Can't set both rootOnly and onlyFirst");
	if (option.rootOnly && option.untilObjectFound) throw Error("Can't set both rootOnly and untilObjectFound");
	let walk = ({ s, isRoot, treeLvl }) => {
		if (!s) return s;
		let skipRoot = isRoot && option.excludeRoot, fromKind = option.from[Kind];
		if (s.elysiaMeta) {
			if (option.from.elysiaMeta === s.elysiaMeta && !skipRoot) return option.to(s);
			return s;
		}
		let shouldTransform = fromKind && s[Kind] === fromKind;
		if (!skipRoot && option.onlyFirst && s.type === option.onlyFirst) {
			if (shouldTransform) return option.to(s);
			return s;
		}
		if (isRoot && option.rootOnly) {
			if (shouldTransform) return option.to(s);
			return s;
		}
		if (!isRoot && option.untilObjectFound && s.type === "object") return s;
		let newWalkInput = {
			isRoot: !1,
			treeLvl: treeLvl + 1
		}, withTransformedChildren = { ...s };
		if (s.oneOf) withTransformedChildren.oneOf = s.oneOf.map((x) => walk({
			...newWalkInput,
			s: x
		}));
		if (s.anyOf) withTransformedChildren.anyOf = s.anyOf.map((x) => walk({
			...newWalkInput,
			s: x
		}));
		if (s.allOf) withTransformedChildren.allOf = s.allOf.map((x) => walk({
			...newWalkInput,
			s: x
		}));
		if (s.not) withTransformedChildren.not = walk({
			...newWalkInput,
			s: s.not
		});
		if (s.properties) {
			withTransformedChildren.properties = {};
			for (let [k2, v$1] of Object.entries(s.properties)) withTransformedChildren.properties[k2] = walk({
				...newWalkInput,
				s: v$1
			});
		}
		if (s.items) {
			let items = s.items;
			withTransformedChildren.items = Array.isArray(items) ? items.map((x) => walk({
				...newWalkInput,
				s: x
			})) : walk({
				...newWalkInput,
				s: items
			});
		}
		if (!skipRoot && fromKind && withTransformedChildren[Kind] === fromKind) return option.to(withTransformedChildren);
		return withTransformedChildren;
	};
	return walk({
		s: schema$1,
		isRoot: !0,
		treeLvl: 0
	});
}, isOptional = (schema$1) => {
	if (!schema$1) return !1;
	if (schema$1?.[Kind] === "Import" && schema$1.References) return schema$1.References().some(isOptional);
	if (schema$1.schema) schema$1 = schema$1.schema;
	return !!schema$1 && OptionalKind in schema$1;
}, hasAdditionalProperties = (_schema) => {
	if (!_schema) return !1;
	let schema$1 = _schema?.schema ?? _schema;
	if (schema$1[Kind] === "Import" && _schema.References) return _schema.References().some(hasAdditionalProperties);
	if (schema$1.anyOf) return schema$1.anyOf.some(hasAdditionalProperties);
	if (schema$1.someOf) return schema$1.someOf.some(hasAdditionalProperties);
	if (schema$1.allOf) return schema$1.allOf.some(hasAdditionalProperties);
	if (schema$1.not) return schema$1.not.some(hasAdditionalProperties);
	if (schema$1.type === "object") {
		let properties = schema$1.properties;
		if ("additionalProperties" in schema$1) return schema$1.additionalProperties;
		if ("patternProperties" in schema$1) return !1;
		for (let key$1 of Object.keys(properties)) {
			let property = properties[key$1];
			if (property.type === "object") {
				if (hasAdditionalProperties(property)) return !0;
			} else if (property.anyOf) {
				for (let i = 0; i < property.anyOf.length; i++) if (hasAdditionalProperties(property.anyOf[i])) return !0;
			}
			return property.additionalProperties;
		}
		return !1;
	}
	if (schema$1.type === "array" && schema$1.items && !Array.isArray(schema$1.items)) return hasAdditionalProperties(schema$1.items);
	return !1;
}, hasType = (type, schema$1) => {
	if (!schema$1) return !1;
	if (Kind in schema$1 && schema$1[Kind] === type) return !0;
	if (Kind in schema$1 && schema$1[Kind] === "Import") {
		if (schema$1.$defs && schema$1.$ref) {
			let ref = schema$1.$ref.replace("#/$defs/", "");
			if (schema$1.$defs[ref]) return hasType(type, schema$1.$defs[ref]);
		}
	}
	if (schema$1.anyOf) return schema$1.anyOf.some((s) => hasType(type, s));
	if (schema$1.oneOf) return schema$1.oneOf.some((s) => hasType(type, s));
	if (schema$1.allOf) return schema$1.allOf.some((s) => hasType(type, s));
	if (schema$1.type === "array" && schema$1.items) {
		if (type === "Files" && Kind in schema$1.items && schema$1.items[Kind] === "File") return !0;
		return hasType(type, schema$1.items);
	}
	if (schema$1.type === "object") {
		let properties = schema$1.properties;
		if (!properties) return !1;
		for (let key$1 of Object.keys(properties)) if (hasType(type, properties[key$1])) return !0;
	}
	return !1;
}, hasElysiaMeta = (meta, _schema) => {
	if (!_schema) return !1;
	let schema$1 = _schema?.schema ?? _schema;
	if (schema$1.elysiaMeta === meta) return !0;
	if (schema$1[Kind] === "Import" && _schema.References) return _schema.References().some((schema2) => hasElysiaMeta(meta, schema2));
	if (schema$1.anyOf) return schema$1.anyOf.some((schema2) => hasElysiaMeta(meta, schema2));
	if (schema$1.someOf) return schema$1.someOf.some((schema2) => hasElysiaMeta(meta, schema2));
	if (schema$1.allOf) return schema$1.allOf.some((schema2) => hasElysiaMeta(meta, schema2));
	if (schema$1.not) return schema$1.not.some((schema2) => hasElysiaMeta(meta, schema2));
	if (schema$1.type === "object") {
		let properties = schema$1.properties;
		for (let key$1 of Object.keys(properties)) {
			let property = properties[key$1];
			if (property.type === "object") {
				if (hasElysiaMeta(meta, property)) return !0;
			} else if (property.anyOf) {
				for (let i = 0; i < property.anyOf.length; i++) if (hasElysiaMeta(meta, property.anyOf[i])) return !0;
			}
			return schema$1.elysiaMeta === meta;
		}
		return !1;
	}
	if (schema$1.type === "array" && schema$1.items && !Array.isArray(schema$1.items)) return hasElysiaMeta(meta, schema$1.items);
	return !1;
}, hasProperty = (expectedProperty, _schema) => {
	if (!_schema) return;
	let schema$1 = _schema.schema ?? _schema;
	if (schema$1[Kind] === "Import" && _schema.References) return _schema.References().some((schema2) => hasProperty(expectedProperty, schema2));
	if (schema$1.type === "object") {
		let properties = schema$1.properties;
		if (!properties) return !1;
		for (let key$1 of Object.keys(properties)) {
			let property = properties[key$1];
			if (expectedProperty in property) return !0;
			if (property.type === "object") {
				if (hasProperty(expectedProperty, property)) return !0;
			} else if (property.anyOf) {
				for (let i = 0; i < property.anyOf.length; i++) if (hasProperty(expectedProperty, property.anyOf[i])) return !0;
			}
		}
		return !1;
	}
	return expectedProperty in schema$1;
}, hasRef = (schema$1) => {
	if (!schema$1) return !1;
	if (schema$1.oneOf) {
		for (let i = 0; i < schema$1.oneOf.length; i++) if (hasRef(schema$1.oneOf[i])) return !0;
	}
	if (schema$1.anyOf) {
		for (let i = 0; i < schema$1.anyOf.length; i++) if (hasRef(schema$1.anyOf[i])) return !0;
	}
	if (schema$1.oneOf) {
		for (let i = 0; i < schema$1.oneOf.length; i++) if (hasRef(schema$1.oneOf[i])) return !0;
	}
	if (schema$1.allOf) {
		for (let i = 0; i < schema$1.allOf.length; i++) if (hasRef(schema$1.allOf[i])) return !0;
	}
	if (schema$1.not && hasRef(schema$1.not)) return !0;
	if (schema$1.type === "object" && schema$1.properties) {
		let properties = schema$1.properties;
		for (let key$1 of Object.keys(properties)) {
			let property = properties[key$1];
			if (hasRef(property)) return !0;
			if (property.type === "array" && property.items && hasRef(property.items)) return !0;
		}
	}
	if (schema$1.type === "array" && schema$1.items && hasRef(schema$1.items)) return !0;
	return schema$1[Kind] === "Ref" && "$ref" in schema$1;
}, hasTransform = (schema$1) => {
	if (!schema$1) return !1;
	if (schema$1.$ref && schema$1.$defs && schema$1.$ref in schema$1.$defs && hasTransform(schema$1.$defs[schema$1.$ref])) return !0;
	if (schema$1.oneOf) {
		for (let i = 0; i < schema$1.oneOf.length; i++) if (hasTransform(schema$1.oneOf[i])) return !0;
	}
	if (schema$1.anyOf) {
		for (let i = 0; i < schema$1.anyOf.length; i++) if (hasTransform(schema$1.anyOf[i])) return !0;
	}
	if (schema$1.allOf) {
		for (let i = 0; i < schema$1.allOf.length; i++) if (hasTransform(schema$1.allOf[i])) return !0;
	}
	if (schema$1.not && hasTransform(schema$1.not)) return !0;
	if (schema$1.type === "object" && schema$1.properties) {
		let properties = schema$1.properties;
		for (let key$1 of Object.keys(properties)) {
			let property = properties[key$1];
			if (hasTransform(property)) return !0;
			if (property.type === "array" && property.items && hasTransform(property.items)) return !0;
		}
	}
	if (schema$1.type === "array" && schema$1.items && hasTransform(schema$1.items)) return !0;
	return TransformKind in schema$1;
}, createCleaner = (schema$1) => (value) => {
	if (typeof value === "object") try {
		return Value.Clean(schema$1, value);
	} catch {}
	return value;
}, getSchemaValidator = (s, { models = {}, dynamic = !1, modules, normalize = !1, additionalProperties = !1, forceAdditionalProperties = !1, coerce = !1, additionalCoerce = [], validators, sanitize: sanitize2 } = {}) => {
	if (validators = validators?.filter((x) => x), !s) {
		if (!validators?.length) return;
		s = validators[0], validators = validators.slice(1);
	}
	let doesHaveRef = void 0, replaceSchema = (schema2) => {
		if (coerce) return replaceSchemaTypeFromManyOptions(schema2, [
			{
				from: t.Number(),
				to: (options) => t.Numeric(options),
				untilObjectFound: !0
			},
			{
				from: t.Boolean(),
				to: (options) => t.BooleanString(options),
				untilObjectFound: !0
			},
			...Array.isArray(additionalCoerce) ? additionalCoerce : [additionalCoerce]
		]);
		return replaceSchemaTypeFromManyOptions(schema2, additionalCoerce);
	}, mapSchema = (s2) => {
		if (s2 && typeof s2 !== "string" && "~standard" in s2) return s2;
		if (!s2) return;
		let schema2;
		if (typeof s2 !== "string") schema2 = s2;
		else if (schema2 = modules && s2 in modules.$defs ? modules.Import(s2) : models[s2], !schema2) return;
		let hasAdditionalCoerce = Array.isArray(additionalCoerce) ? additionalCoerce.length > 0 : !!additionalCoerce;
		if (Kind in schema2) {
			if (schema2[Kind] === "Import") {
				if (!hasRef(schema2.$defs[schema2.$ref])) {
					if (schema2 = schema2.$defs[schema2.$ref], coerce || hasAdditionalCoerce) {
						if (schema2 = replaceSchema(schema2), "$id" in schema2 && !schema2.$defs) schema2.$id = `${schema2.$id}_coerced_${randomId()}`;
					}
				}
			} else if (hasRef(schema2)) {
				let id = randomId();
				schema2 = t.Module({
					...modules?.$defs,
					[id]: schema2
				}).Import(id);
			} else if (coerce || hasAdditionalCoerce) schema2 = replaceSchema(schema2);
		}
		return schema2;
	}, schema$1 = mapSchema(s), _validators = validators;
	if ("~standard" in schema$1 || validators?.length && validators.some((x) => x && typeof x !== "string" && "~standard" in x)) {
		let typeboxSubValidator = (schema2) => {
			let mirror2;
			if (normalize === !0 || normalize === "exactMirror") try {
				mirror2 = createMirror(schema2, {
					TypeCompiler,
					sanitize: sanitize2?.(),
					modules
				});
			} catch {
				console.warn("Failed to create exactMirror. Please report the following code to https://github.com/elysiajs/elysia/issues"), console.warn(schema2), mirror2 = createCleaner(schema2);
			}
			let vali = getSchemaValidator(schema2, {
				models,
				modules,
				dynamic,
				normalize,
				additionalProperties: !0,
				forceAdditionalProperties: !0,
				coerce,
				additionalCoerce
			});
			return vali.Decode = mirror2, (v$1) => {
				if (vali.Check(v$1)) return { value: vali.Decode(v$1) };
				else return { issues: [...vali.Errors(v$1)] };
			};
		}, mainCheck = schema$1["~standard"] ? schema$1["~standard"].validate : typeboxSubValidator(schema$1), checkers = [];
		if (validators?.length) for (let validator2 of validators) {
			if (!validator2) continue;
			if (typeof validator2 === "string") continue;
			if (validator2?.["~standard"]) {
				checkers.push(validator2["~standard"]);
				continue;
			}
			if (Kind in validator2) {
				checkers.push(typeboxSubValidator(validator2));
				continue;
			}
		}
		async function Check(value) {
			let v$1 = mainCheck(value);
			if (v$1 instanceof Promise) v$1 = await v$1;
			if (v$1.issues) return v$1;
			let values = [];
			if (v$1 && typeof v$1 === "object") values.push(v$1.value);
			for (let i = 0; i < checkers.length; i++) {
				if (v$1 = checkers[i].validate(value), v$1 instanceof Promise) v$1 = await v$1;
				if (v$1.issues) return v$1;
				if (v$1 && typeof v$1 === "object") values.push(v$1.value);
			}
			if (!values.length) return { value: v$1 };
			if (values.length === 1) return { value: values[0] };
			if (values.length === 2) return { value: mergeDeep(values[0], values[1]) };
			let newValue = mergeDeep(values[0], values[1]);
			for (let i = 2; i < values.length; i++) newValue = mergeDeep(newValue, values[i]);
			return { value: newValue };
		}
		let validator$1 = {
			provider: "standard",
			schema: schema$1,
			references: "",
			checkFunc: () => {},
			code: "",
			Check,
			Errors: (value) => Check(value)?.then?.((x) => x?.issues),
			Code: () => "",
			Decode: Check,
			Encode: (value) => value,
			hasAdditionalProperties: !1,
			hasDefault: !1,
			isOptional: !1,
			hasTransform: !1,
			hasRef: !1
		};
		return validator$1.parse = (v$1) => {
			try {
				return validator$1.Decode(validator$1.Clean?.(v$1) ?? v$1);
			} catch (error) {
				throw [...validator$1.Errors(v$1)].map(mapValueError);
			}
		}, validator$1.safeParse = (v$1) => {
			try {
				return {
					success: !0,
					data: validator$1.Decode(validator$1.Clean?.(v$1) ?? v$1),
					error: null
				};
			} catch (error) {
				let errors = [...compiled.Errors(v$1)].map(mapValueError);
				return {
					success: !1,
					data: null,
					error: errors[0]?.summary,
					errors
				};
			}
		}, validator$1;
	} else if (validators?.length) {
		let hasAdditional = !1, { schema: mergedObjectSchema, notObjects } = mergeObjectSchemas([schema$1, ..._validators.map(mapSchema)]);
		if (notObjects) {
			if (schema$1 = t.Intersect([...mergedObjectSchema ? [mergedObjectSchema] : [], ...notObjects.map((x) => {
				let schema2 = mapSchema(x);
				if (schema2.type === "object" && "additionalProperties" in schema2) {
					if (!hasAdditional && schema2.additionalProperties === !1) hasAdditional = !0;
					delete schema2.additionalProperties;
				}
				return schema2;
			})]), schema$1.type === "object" && hasAdditional) schema$1.additionalProperties = !1;
		}
	} else if (schema$1.type === "object" && ("additionalProperties" in schema$1 === !1 || forceAdditionalProperties)) schema$1.additionalProperties = additionalProperties;
	else schema$1 = replaceSchemaTypeFromManyOptions(schema$1, {
		onlyFirst: "object",
		from: t.Object({}),
		to(schema2) {
			if (!schema2.properties) return schema2;
			if ("additionalProperties" in schema2) return schema2;
			return t.Object(schema2.properties, {
				...schema2,
				additionalProperties: !1
			});
		}
	});
	if (dynamic) if (Kind in schema$1) {
		let validator$1 = {
			provider: "typebox",
			schema: schema$1,
			references: "",
			checkFunc: () => {},
			code: "",
			Check: (value) => Value.Check(schema$1, value),
			Errors: (value) => Value.Errors(schema$1, value),
			Code: () => "",
			Clean: createCleaner(schema$1),
			Decode: (value) => Value.Decode(schema$1, value),
			Encode: (value) => Value.Encode(schema$1, value),
			get hasAdditionalProperties() {
				if ("~hasAdditionalProperties" in this) return this["~hasAdditionalProperties"];
				return this["~hasAdditionalProperties"] = hasAdditionalProperties(schema$1);
			},
			get hasDefault() {
				if ("~hasDefault" in this) return this["~hasDefault"];
				return this["~hasDefault"] = hasProperty("default", schema$1);
			},
			get isOptional() {
				if ("~isOptional" in this) return this["~isOptional"];
				return this["~isOptional"] = isOptional(schema$1);
			},
			get hasTransform() {
				if ("~hasTransform" in this) return this["~hasTransform"];
				return this["~hasTransform"] = hasTransform(schema$1);
			},
			"~hasRef": doesHaveRef,
			get hasRef() {
				if ("~hasRef" in this) return this["~hasRef"];
				return this["~hasRef"] = hasTransform(schema$1);
			}
		};
		if (schema$1.config) {
			if (validator$1.config = schema$1.config, validator$1?.schema?.config) delete validator$1.schema.config;
		}
		if (normalize && schema$1.additionalProperties === !1) if (normalize === !0 || normalize === "exactMirror") try {
			validator$1.Clean = createMirror(schema$1, {
				TypeCompiler,
				sanitize: sanitize2?.(),
				modules
			});
		} catch {
			console.warn("Failed to create exactMirror. Please report the following code to https://github.com/elysiajs/elysia/issues"), console.warn(schema$1), validator$1.Clean = createCleaner(schema$1);
		}
		else validator$1.Clean = createCleaner(schema$1);
		return validator$1.parse = (v$1) => {
			try {
				return validator$1.Decode(validator$1.Clean?.(v$1) ?? v$1);
			} catch (error) {
				throw [...validator$1.Errors(v$1)].map(mapValueError);
			}
		}, validator$1.safeParse = (v$1) => {
			try {
				return {
					success: !0,
					data: validator$1.Decode(validator$1.Clean?.(v$1) ?? v$1),
					error: null
				};
			} catch (error) {
				let errors = [...compiled.Errors(v$1)].map(mapValueError);
				return {
					success: !1,
					data: null,
					error: errors[0]?.summary,
					errors
				};
			}
		}, validator$1;
	} else {
		let validator$1 = {
			provider: "standard",
			schema: schema$1,
			references: "",
			checkFunc: () => {},
			code: "",
			Check: (v$1) => schema$1["~standard"].validate(v$1),
			Errors(value) {
				let response = schema$1["~standard"].validate(value);
				if (response instanceof Promise) throw Error("Async validation is not supported in non-dynamic schema");
				return response.issues;
			},
			Code: () => "",
			Decode(value) {
				let response = schema$1["~standard"].validate(value);
				if (response instanceof Promise) throw Error("Async validation is not supported in non-dynamic schema");
				return response;
			},
			Encode: (value) => value,
			hasAdditionalProperties: !1,
			hasDefault: !1,
			isOptional: !1,
			hasTransform: !1,
			hasRef: !1
		};
		return validator$1.parse = (v$1) => {
			try {
				return validator$1.Decode(validator$1.Clean?.(v$1) ?? v$1);
			} catch (error) {
				throw [...validator$1.Errors(v$1)].map(mapValueError);
			}
		}, validator$1.safeParse = (v$1) => {
			try {
				return {
					success: !0,
					data: validator$1.Decode(validator$1.Clean?.(v$1) ?? v$1),
					error: null
				};
			} catch (error) {
				let errors = [...compiled.Errors(v$1)].map(mapValueError);
				return {
					success: !1,
					data: null,
					error: errors[0]?.summary,
					errors
				};
			}
		}, validator$1;
	}
	let compiled;
	if (Kind in schema$1) {
		if (compiled = TypeCompiler.Compile(schema$1, Object.values(models).filter((x) => Kind in x)), compiled.provider = "typebox", schema$1.config) {
			if (compiled.config = schema$1.config, compiled?.schema?.config) delete compiled.schema.config;
		}
		if (normalize === !0 || normalize === "exactMirror") try {
			compiled.Clean = createMirror(schema$1, {
				TypeCompiler,
				sanitize: sanitize2?.(),
				modules
			});
		} catch (error) {
			console.warn("Failed to create exactMirror. Please report the following code to https://github.com/elysiajs/elysia/issues"), console.dir(schema$1, { depth: null }), compiled.Clean = createCleaner(schema$1);
		}
		else if (normalize === "typebox") compiled.Clean = createCleaner(schema$1);
	} else compiled = {
		provider: "standard",
		schema: schema$1,
		references: "",
		checkFunc(value) {
			let response = schema$1["~standard"].validate(value);
			if (response instanceof Promise) throw Error("Async validation is not supported in non-dynamic schema");
			return response;
		},
		code: "",
		Check: (v$1) => schema$1["~standard"].validate(v$1),
		Errors(value) {
			let response = schema$1["~standard"].validate(value);
			if (response instanceof Promise) throw Error("Async validation is not supported in non-dynamic schema");
			return response.issues;
		},
		Code: () => "",
		Decode(value) {
			let response = schema$1["~standard"].validate(value);
			if (response instanceof Promise) throw Error("Async validation is not supported in non-dynamic schema");
			return response;
		},
		Encode: (value) => value,
		hasAdditionalProperties: !1,
		hasDefault: !1,
		isOptional: !1,
		hasTransform: !1,
		hasRef: !1
	};
	if (compiled.parse = (v$1) => {
		try {
			return compiled.Decode(compiled.Clean?.(v$1) ?? v$1);
		} catch (error) {
			throw [...compiled.Errors(v$1)].map(mapValueError);
		}
	}, compiled.safeParse = (v$1) => {
		try {
			return {
				success: !0,
				data: compiled.Decode(compiled.Clean?.(v$1) ?? v$1),
				error: null
			};
		} catch (error) {
			let errors = [...compiled.Errors(v$1)].map(mapValueError);
			return {
				success: !1,
				data: null,
				error: errors[0]?.summary,
				errors
			};
		}
	}, Kind in schema$1) Object.assign(compiled, {
		get hasAdditionalProperties() {
			if ("~hasAdditionalProperties" in this) return this["~hasAdditionalProperties"];
			return this["~hasAdditionalProperties"] = hasAdditionalProperties(compiled);
		},
		get hasDefault() {
			if ("~hasDefault" in this) return this["~hasDefault"];
			return this["~hasDefault"] = hasProperty("default", compiled);
		},
		get isOptional() {
			if ("~isOptional" in this) return this["~isOptional"];
			return this["~isOptional"] = isOptional(compiled);
		},
		get hasTransform() {
			if ("~hasTransform" in this) return this["~hasTransform"];
			return this["~hasTransform"] = hasTransform(schema$1);
		},
		get hasRef() {
			if ("~hasRef" in this) return this["~hasRef"];
			return this["~hasRef"] = hasRef(schema$1);
		},
		"~hasRef": doesHaveRef
	});
	return compiled;
}, mergeObjectSchemas = (schemas) => {
	if (schemas.length === 0) return {
		schema: void 0,
		notObjects: []
	};
	if (schemas.length === 1) return schemas[0].type === "object" ? {
		schema: schemas[0],
		notObjects: []
	} : {
		schema: void 0,
		notObjects: schemas
	};
	let newSchema, notObjects = [], additionalPropertiesIsTrue = !1, additionalPropertiesIsFalse = !1;
	for (let schema$1 of schemas) {
		if (schema$1.type !== "object") {
			notObjects.push(schema$1);
			continue;
		}
		if ("additionalProperties" in schema$1) {
			if (schema$1.additionalProperties === !0) additionalPropertiesIsTrue = !0;
			else if (schema$1.additionalProperties === !1) additionalPropertiesIsFalse = !0;
		}
		if (!newSchema) {
			newSchema = schema$1;
			continue;
		}
		newSchema = {
			...newSchema,
			...schema$1,
			properties: {
				...newSchema.properties,
				...schema$1.properties
			},
			required: [...newSchema?.required ?? [], ...schema$1.required ?? []]
		};
	}
	if (newSchema) {
		if (newSchema.required) newSchema.required = [...new Set(newSchema.required)];
		if (additionalPropertiesIsFalse) newSchema.additionalProperties = !1;
		else if (additionalPropertiesIsTrue) newSchema.additionalProperties = !0;
	}
	return {
		schema: newSchema,
		notObjects
	};
};
({ ...WebStandardAdapter }), { ...WebStandardAdapter.composeGeneralHandler };
var bracketPairRangeReverse = (parameter) => {
	let end = parameter.lastIndexOf("}");
	if (end === -1) return [-1, 0];
	let start = end - 1, deep = 1;
	for (; start >= 0; start--) {
		let char = parameter.charCodeAt(start);
		if (char === 125) deep++;
		else if (char === 123) deep--;
		if (deep === 0) break;
	}
	if (deep !== 0) return [-1, 0];
	return [start, end + 1];
}, removeColonAlias = (parameter) => {
	while (!0) {
		let start = parameter.indexOf(":");
		if (start === -1) break;
		let end = parameter.indexOf(",", start);
		if (end === -1) end = parameter.indexOf("}", start) - 1;
		if (end === -2) end = parameter.length;
		parameter = parameter.slice(0, start) + parameter.slice(end);
	}
	return parameter;
}, findEndIndex = (type, content, index$1) => {
	let regex2 = /* @__PURE__ */ new RegExp(`${type.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\n\\t,; ]`);
	if (index$1 !== void 0) regex2.lastIndex = index$1;
	let match = regex2.exec(content);
	return match ? match.index : -1;
}, findAlias = (type, body, depth = 0) => {
	if (depth > 5) return [];
	let aliases = [], content = body;
	while (!0) {
		let index$1 = findEndIndex(" = " + type, content);
		if (index$1 === -1) index$1 = findEndIndex("=" + type, content);
		if (index$1 === -1) {
			let lastIndex = content.indexOf(" = " + type);
			if (lastIndex === -1) lastIndex = content.indexOf("=" + type);
			if (lastIndex + 3 + type.length !== content.length) break;
			index$1 = lastIndex;
		}
		let part = content.slice(0, index$1), lastPart = part.lastIndexOf(" "), variable = part.slice(lastPart !== -1 ? lastPart + 1 : -1);
		if (variable === "}") {
			let [start, end] = bracketPairRangeReverse(part);
			aliases.push(removeColonAlias(content.slice(start, end))), content = content.slice(index$1 + 3 + type.length);
			continue;
		}
		while (variable.charCodeAt(0) === 44) variable = variable.slice(1);
		while (variable.charCodeAt(0) === 9) variable = variable.slice(1);
		if (!variable.includes("(")) aliases.push(variable);
		content = content.slice(index$1 + 3 + type.length);
	}
	for (let alias of aliases) {
		if (alias.charCodeAt(0) === 123) continue;
		let deepAlias = findAlias(alias, body);
		if (deepAlias.length > 0) aliases.push(...deepAlias);
	}
	return aliases;
}, mapResponse2 = (response, set2, request) => {
	if (isNotEmpty(set2.headers) || set2.status !== 200 || set2.cookie) switch (handleSet(set2), response?.constructor?.name) {
		case "String": return new Response(response, set2);
		case "Array":
		case "Object": return set2.headers["content-type"] = "application/json", new Response(JSON.stringify(response), set2);
		case "ElysiaFile": return handleFile(response.value, set2);
		case "File": return handleFile(response, set2);
		case "Blob": return handleFile(response, set2);
		case "ElysiaCustomStatusResponse": return set2.status = response.code, mapResponse2(response.response, set2, request);
		case void 0:
			if (!response) return new Response("", set2);
			return new Response(JSON.stringify(response), set2);
		case "Response": return handleResponse2(response, set2, request);
		case "Error": return errorToResponse2(response, set2);
		case "Promise": return response.then((x) => mapResponse2(x, set2, request));
		case "Function": return mapResponse2(response(), set2, request);
		case "Number":
		case "Boolean": return new Response(response.toString(), set2);
		case "Cookie":
			if (response instanceof Cookie) return new Response(response.value, set2);
			return new Response(response?.toString(), set2);
		case "FormData": return new Response(response, set2);
		default:
			if (response instanceof Response) return handleResponse2(response, set2, request);
			if (response instanceof Promise) return response.then((x) => mapResponse2(x, set2));
			if (response instanceof Error) return errorToResponse2(response, set2);
			if (response instanceof ElysiaCustomStatusResponse) return set2.status = response.code, mapResponse2(response.response, set2, request);
			if (typeof response?.next === "function" || response instanceof ReadableStream) return handleStream2(response, set2, request);
			if (typeof response?.then === "function") return response.then((x) => mapResponse2(x, set2));
			if (typeof response?.toResponse === "function") return mapResponse2(response.toResponse(), set2);
			if ("charCodeAt" in response) {
				let code = response.charCodeAt(0);
				if (code === 123 || code === 91) {
					if (!set2.headers["Content-Type"]) set2.headers["Content-Type"] = "application/json";
					return new Response(JSON.stringify(response), set2);
				}
			}
			return new Response(response, set2);
	}
	if (typeof response?.next === "function" || response instanceof ReadableStream) return handleStream2(response, set2, request);
	return mapCompactResponse2(response, request);
}, mapEarlyResponse2 = (response, set2, request) => {
	if (response === void 0 || response === null) return;
	if (isNotEmpty(set2.headers) || set2.status !== 200 || set2.cookie) switch (handleSet(set2), response?.constructor?.name) {
		case "String": return new Response(response, set2);
		case "Array":
		case "Object": return set2.headers["content-type"] = "application/json", new Response(JSON.stringify(response), set2);
		case "ElysiaFile": return handleFile(response.value, set2);
		case "File": return handleFile(response, set2);
		case "Blob": return handleFile(response, set2);
		case "ElysiaCustomStatusResponse": return set2.status = response.code, mapEarlyResponse2(response.response, set2, request);
		case void 0:
			if (!response) return;
			return new Response(JSON.stringify(response), set2);
		case "Response": return handleResponse2(response, set2, request);
		case "Promise": return response.then((x) => mapEarlyResponse2(x, set2));
		case "Error": return errorToResponse2(response, set2);
		case "Function": return mapEarlyResponse2(response(), set2);
		case "Number":
		case "Boolean": return new Response(response.toString(), set2);
		case "FormData": return new Response(response);
		case "Cookie":
			if (response instanceof Cookie) return new Response(response.value, set2);
			return new Response(response?.toString(), set2);
		default:
			if (response instanceof Response) return handleResponse2(response, set2, request);
			if (response instanceof Promise) return response.then((x) => mapEarlyResponse2(x, set2));
			if (response instanceof Error) return errorToResponse2(response, set2);
			if (response instanceof ElysiaCustomStatusResponse) return set2.status = response.code, mapEarlyResponse2(response.response, set2, request);
			if (typeof response?.next === "function" || response instanceof ReadableStream) return handleStream2(response, set2, request);
			if (typeof response?.then === "function") return response.then((x) => mapEarlyResponse2(x, set2));
			if (typeof response?.toResponse === "function") return mapEarlyResponse2(response.toResponse(), set2);
			if ("charCodeAt" in response) {
				let code = response.charCodeAt(0);
				if (code === 123 || code === 91) {
					if (!set2.headers["Content-Type"]) set2.headers["Content-Type"] = "application/json";
					return new Response(JSON.stringify(response), set2);
				}
			}
			return new Response(response, set2);
	}
	else switch (response?.constructor?.name) {
		case "String": return new Response(response);
		case "Array":
		case "Object": return set2.headers["content-type"] = "application/json", new Response(JSON.stringify(response), set2);
		case "ElysiaFile": return handleFile(response.value, set2);
		case "File": return handleFile(response, set2);
		case "Blob": return handleFile(response, set2);
		case "ElysiaCustomStatusResponse": return set2.status = response.code, mapEarlyResponse2(response.response, set2, request);
		case void 0:
			if (!response) return new Response("");
			return new Response(JSON.stringify(response), { headers: { "content-type": "application/json" } });
		case "Response": return response;
		case "Promise": return response.then((x) => {
			let r$1 = mapEarlyResponse2(x, set2);
			if (r$1 !== void 0) return r$1;
		});
		case "Error": return errorToResponse2(response, set2);
		case "Function": return mapCompactResponse2(response(), request);
		case "Number":
		case "Boolean": return new Response(response.toString());
		case "Cookie":
			if (response instanceof Cookie) return new Response(response.value, set2);
			return new Response(response?.toString(), set2);
		case "FormData": return new Response(response);
		default:
			if (response instanceof Response) return response;
			if (response instanceof Promise) return response.then((x) => mapEarlyResponse2(x, set2));
			if (response instanceof Error) return errorToResponse2(response, set2);
			if (response instanceof ElysiaCustomStatusResponse) return set2.status = response.code, mapEarlyResponse2(response.response, set2, request);
			if (typeof response?.next === "function" || response instanceof ReadableStream) return handleStream2(response, set2, request);
			if (typeof response?.then === "function") return response.then((x) => mapEarlyResponse2(x, set2));
			if (typeof response?.toResponse === "function") return mapEarlyResponse2(response.toResponse(), set2);
			if ("charCodeAt" in response) {
				let code = response.charCodeAt(0);
				if (code === 123 || code === 91) {
					if (!set2.headers["Content-Type"]) set2.headers["Content-Type"] = "application/json";
					return new Response(JSON.stringify(response), set2);
				}
			}
			return new Response(response);
	}
}, mapCompactResponse2 = (response, request) => {
	switch (response?.constructor?.name) {
		case "String": return new Response(response);
		case "Object":
		case "Array": return new Response(JSON.stringify(response), { headers: { "Content-Type": "application/json" } });
		case "ElysiaFile": return handleFile(response.value);
		case "File": return handleFile(response);
		case "Blob": return handleFile(response);
		case "ElysiaCustomStatusResponse": return mapResponse2(response.response, {
			status: response.code,
			headers: {}
		});
		case void 0:
			if (!response) return new Response("");
			return new Response(JSON.stringify(response), { headers: { "content-type": "application/json" } });
		case "Response": return response;
		case "Error": return errorToResponse2(response);
		case "Promise": return response.then((x) => mapCompactResponse2(x, request));
		case "Function": return mapCompactResponse2(response(), request);
		case "Number":
		case "Boolean": return new Response(response.toString());
		case "FormData": return new Response(response);
		default:
			if (response instanceof Response) return response;
			if (response instanceof Promise) return response.then((x) => mapCompactResponse2(x, request));
			if (response instanceof Error) return errorToResponse2(response);
			if (response instanceof ElysiaCustomStatusResponse) return mapResponse2(response.response, {
				status: response.code,
				headers: {}
			});
			if (typeof response?.next === "function" || response instanceof ReadableStream) return handleStream2(response, void 0, request);
			if (typeof response?.then === "function") return response.then((x) => mapResponse2(x, set));
			if (typeof response?.toResponse === "function") return mapCompactResponse2(response.toResponse());
			if ("charCodeAt" in response) {
				let code = response.charCodeAt(0);
				if (code === 123 || code === 91) return new Response(JSON.stringify(response), { headers: { "Content-Type": "application/json" } });
			}
			return new Response(response);
	}
}, errorToResponse2 = (error, set2) => {
	if (typeof error?.toResponse === "function") {
		let raw = error.toResponse(), targetSet = set2 ?? {
			headers: {},
			status: 200,
			redirect: ""
		}, apply = (resolved) => {
			if (resolved instanceof Response) targetSet.status = resolved.status;
			return mapResponse2(resolved, targetSet);
		};
		return typeof raw?.then === "function" ? raw.then(apply) : apply(raw);
	}
	return new Response(JSON.stringify({
		name: error?.name,
		message: error?.message,
		cause: error?.cause
	}), {
		status: set2?.status !== 200 ? set2?.status ?? 500 : 500,
		headers: set2?.headers
	});
}, handleResponse2 = createResponseHandler({
	mapResponse: mapResponse2,
	mapCompactResponse: mapCompactResponse2
}), handleStream2 = createStreamHandler({
	mapResponse: mapResponse2,
	mapCompactResponse: mapCompactResponse2
}), optionalParam = /:.+?\?(?=\/|$)/, getPossibleParams = (path) => {
	let match = optionalParam.exec(path);
	if (!match) return [path];
	let routes = [], head = path.slice(0, match.index), param = match[0].slice(0, -1), tail = path.slice(match.index + match[0].length);
	routes.push(head.slice(0, -1)), routes.push(head + param);
	for (let fragment of getPossibleParams(tail)) {
		if (!fragment) continue;
		if (!fragment.startsWith("/:")) routes.push(head.slice(0, -1) + fragment);
		routes.push(head + param + fragment);
	}
	return routes;
};
({ ...WebStandardAdapter }), { ...WebStandardAdapter.composeHandler };
Symbol.dispose;
var envSchema = t.Object({
	DATABASE_URL: t.String(),
	BASE_URL: t.String(),
	AUTH_SECRET: t.String(),
	GITHUB_CLIENT_ID: t.String(),
	GITHUB_CLIENT_SECRET: t.String()
});
var validator = TypeCompiler$1.Compile(envSchema);
if (!validator.Check(env)) {
	console.error("Invalid environment variables:", [...validator.Errors(process.env)]);
	process.exit(1);
}
const env$1 = camelKeys(env);
const db = drizzle({
	client: new Database(env$1.databaseUrl),
	schema,
	relations
});
const ac = createAccessControl({
	...defaultStatements,
	article: [
		"create",
		"read",
		"readUnpublished",
		"update",
		"delete"
	],
	comment: [
		"create",
		"read",
		"update",
		"delete",
		"moderate"
	]
});
const roles = {
	muted: ac.newRole({
		article: ["read"],
		comment: ["read"]
	}),
	user: ac.newRole({
		article: ["read"],
		comment: ["create", "read"]
	}),
	moderator: ac.newRole({
		article: ["read", "readUnpublished"],
		comment: [
			"create",
			"read",
			"moderate",
			"delete"
		]
	}),
	admin: ac.newRole({
		article: [
			"create",
			"read",
			"readUnpublished",
			"update",
			"delete"
		],
		comment: [
			"create",
			"read",
			"update",
			"delete",
			"moderate"
		],
		...adminAc.statements
	})
};
const auth = betterAuth({
	baseURL: env$1.baseUrl,
	secret: env$1.authSecret,
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: authSchema
	}),
	socialProviders: { github: {
		clientId: env$1.githubClientId,
		clientSecret: env$1.githubClientSecret
	} },
	plugins: [admin({
		ac,
		roles
	})]
});
const base = os.$context();
const authMiddleware = base.middleware(async ({ context, next }) => {
	const sessionData = await auth.api.getSession({ headers: context.headers });
	if (!(sessionData?.session && sessionData?.user)) return next({ context: {} });
	return next({ context: {
		session: sessionData.session,
		user: sessionData.user
	} });
});
base.middleware(({ context, next }) => {
	if (!(context.session && context.user)) throw new ORPCError("UNAUTHORIZED");
	return next({ context: {
		session: context.session,
		user: context.user
	} });
});
const getAll = base.use(authMiddleware).input(z.object({
	search: z.string().optional(),
	page: z.number().min(1).optional().default(1),
	showUnpublished: z.boolean().optional().default(false),
	sortBy: z.enum(["publishedAt", "title"]).optional().default("publishedAt")
})).output(z.object({
	articles: articleSelectSchema.pick({
		id: true,
		title: true,
		slug: true,
		excerpt: true,
		published: true,
		publishedAt: true,
		updatedAt: true
	}).extend({ tags: tagSelectSchema.pick({
		id: true,
		name: true,
		slug: true
	}).array() }).array(),
	pagination: z.object({
		page: z.number(),
		totalPages: z.number(),
		totalItems: z.number()
	})
})).handler(async ({ input, context }) => {
	const { search, page, showUnpublished, sortBy } = input;
	if (showUnpublished) {
		if (!context.user) throw new ORPCError("UNAUTHORIZED");
		if (!await auth.api.userHasPermission({ body: {
			userId: context.user.id,
			permission: { article: ["readUnpublished"] }
		} })) throw new ORPCError("FORBIDDEN");
	}
	const articles$1 = await db.query.article.findMany({
		where: {
			OR: search ? [
				{ title: { like: `%${search}%` } },
				{ excerpt: { like: `%${search}%` } },
				{ content: { like: `%${search}%` } }
			] : void 0,
			published: showUnpublished ? void 0 : true
		},
		orderBy: sortBy === "publishedAt" ? { publishedAt: "desc" } : { title: "asc" },
		limit: 20,
		offset: (page - 1) * 20,
		with: { tags: { columns: {
			id: true,
			name: true,
			slug: true
		} } },
		columns: {
			id: true,
			title: true,
			publishedAt: true,
			published: true,
			excerpt: true,
			slug: true,
			updatedAt: true
		}
	});
	const articleCount = await db.query.article.findFirst({
		where: {
			OR: search ? [
				{ title: { like: `%${search}%` } },
				{ excerpt: { like: `%${search}%` } },
				{ content: { like: `%${search}%` } }
			] : void 0,
			published: showUnpublished ? void 0 : true
		},
		columns: {},
		extras: { count: count() }
	});
	if (!articleCount) throw new ORPCError("INTERNAL_SERVER_ERROR");
	return {
		articles: articles$1,
		pagination: {
			page,
			totalPages: Math.ceil(articleCount.count / 20),
			totalItems: articleCount.count
		}
	};
});
const articles = { getAll };
var { result } = await runTask("migrate");
if (result !== "ok") throw new Error("Database migration failed");
var rpcHandler = new RPCHandler({ articles }, {
	plugins: [new CORSPlugin()],
	interceptors: [onError((error) => {
		if (error instanceof ORPCError) console.error(`RPC Error: [${error.code}] ${error.message}`);
		else console.error("Unexpected Error:", error);
	})]
});
var server_default = { async fetch(req) {
	const rpc = await rpcHandler.handle(req, {
		prefix: "/api/rpc",
		context: { headers: req.headers }
	});
	if (rpc.matched) return rpc.response;
	const authResponse = await auth.handler(req);
	if (authResponse.status !== 404) return authResponse;
} };
var public_assets_data_default = {
	"/manifest.json": {
		"type": "application/json",
		"etag": "\"1f2-Oqn/x1R1hBTtEjA8nFhpBeFJJNg\"",
		"mtime": "2025-12-25T23:18:06.264Z",
		"size": 498,
		"path": "../public/manifest.json"
	},
	"/tanstack-circle-logo.png": {
		"type": "image/png",
		"etag": "\"40cab-HZ1KcYPs7tRjLe4Sd4g6CwKW+W8\"",
		"mtime": "2025-12-25T23:18:06.264Z",
		"size": 265387,
		"path": "../public/tanstack-circle-logo.png"
	},
	"/favicon.ico": {
		"type": "image/vnd.microsoft.icon",
		"etag": "\"f1e-ESBTjHetHyiokkO0tT/irBbMO8Y\"",
		"mtime": "2025-12-25T23:18:06.264Z",
		"size": 3870,
		"path": "../public/favicon.ico"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"43-BEzmj4PuhUNHX+oW9uOnPSihxtU\"",
		"mtime": "2025-12-25T23:18:06.264Z",
		"size": 67,
		"path": "../public/robots.txt"
	},
	"/logo512.png": {
		"type": "image/png",
		"etag": "\"25c0-RpFfnQJpTtSb/HqVNJR2hBA9w/4\"",
		"mtime": "2025-12-25T23:18:06.264Z",
		"size": 9664,
		"path": "../public/logo512.png"
	},
	"/logo192.png": {
		"type": "image/png",
		"etag": "\"14e3-f08taHgqf6/O2oRVTsq5tImHdQA\"",
		"mtime": "2025-12-25T23:18:06.264Z",
		"size": 5347,
		"path": "../public/logo192.png"
	},
	"/tanstack-word-logo-white.svg": {
		"type": "image/svg+xml",
		"etag": "\"3a9a-9TQFm/pN8AZe1ZK0G1KyCEojnYg\"",
		"mtime": "2025-12-25T23:18:06.264Z",
		"size": 15002,
		"path": "../public/tanstack-word-logo-white.svg"
	},
	"/assets/routes-CLUCrkyb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"871b-TGYq9uzo+ubgzSk0h4sC4vK1aGE\"",
		"mtime": "2025-12-25T23:18:06.704Z",
		"size": 34587,
		"path": "../public/assets/routes-CLUCrkyb.js"
	},
	"/assets/route-CLX8QgbQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"da-//jItpJMBIWl6eBb4PDRoj6oodw\"",
		"mtime": "2025-12-25T23:18:06.704Z",
		"size": 218,
		"path": "../public/assets/route-CLX8QgbQ.js"
	},
	"/assets/index-BwYg42vB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8b949-tIXpcmUWiyOCGzKQQgvB3IWRKH4\"",
		"mtime": "2025-12-25T23:18:06.704Z",
		"size": 571721,
		"path": "../public/assets/index-BwYg42vB.js"
	},
	"/assets/web-vitals-DEnqKERX.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"15f2-rTiXHXzli6aj3B9kfwuHCIXOpLc\"",
		"mtime": "2025-12-25T23:18:06.704Z",
		"size": 5618,
		"path": "../public/assets/web-vitals-DEnqKERX.js"
	},
	"/assets/jetbrains-mono-latin-ext-wght-normal-DBQx-q_a.woff2": {
		"type": "font/woff2",
		"etag": "\"3b5c-HLF7Wvs2Z1IA1cPRs6jnor8OUQ4\"",
		"mtime": "2025-12-25T23:18:06.704Z",
		"size": 15196,
		"path": "../public/assets/jetbrains-mono-latin-ext-wght-normal-DBQx-q_a.woff2"
	},
	"/assets/blog-DJgYcNFg.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"da18-ofPD4a8EJP4cmqCWOjpwayH+K1E\"",
		"mtime": "2025-12-25T23:18:06.704Z",
		"size": 55832,
		"path": "../public/assets/blog-DJgYcNFg.js"
	},
	"/assets/jetbrains-mono-vietnamese-wght-normal-Bt-aOZkq.woff2": {
		"type": "font/woff2",
		"etag": "\"1d50-/Re0MyD6BV8h81wBPVijGZH5GBs\"",
		"mtime": "2025-12-25T23:18:06.704Z",
		"size": 7504,
		"path": "../public/assets/jetbrains-mono-vietnamese-wght-normal-Bt-aOZkq.woff2"
	},
	"/assets/input-Cqq68q3-.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"26ce-hMM1k3n2Y+aBuzxMzyJPq+vRc18\"",
		"mtime": "2025-12-25T23:18:06.704Z",
		"size": 9934,
		"path": "../public/assets/input-Cqq68q3-.js"
	},
	"/assets/index-DAWtczQv.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"1781c-ARA36/ybOr+yvFotYTpNxFmCffI\"",
		"mtime": "2025-12-25T23:18:06.704Z",
		"size": 96284,
		"path": "../public/assets/index-DAWtczQv.css"
	},
	"/assets/_slug-Cx29s2Im.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9b-3wNjeTmslC8QhfTHvsqYzHugZ7s\"",
		"mtime": "2025-12-25T23:18:06.704Z",
		"size": 155,
		"path": "../public/assets/_slug-Cx29s2Im.js"
	},
	"/assets/jetbrains-mono-latin-wght-normal-B9CIFXIH.woff2": {
		"type": "font/woff2",
		"etag": "\"9dd4-5yd+cUUhzrXxdMyYebUeD0qml1M\"",
		"mtime": "2025-12-25T23:18:06.704Z",
		"size": 40404,
		"path": "../public/assets/jetbrains-mono-latin-wght-normal-B9CIFXIH.woff2"
	},
	"/assets/route-BAoXDZUt.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"178bf-L1mWE+x3X282L11d6aRMolaH62E\"",
		"mtime": "2025-12-25T23:18:06.704Z",
		"size": 96447,
		"path": "../public/assets/route-BAoXDZUt.js"
	},
	"/assets/jetbrains-mono-greek-wght-normal-Bw9x6K1M.woff2": {
		"type": "font/woff2",
		"etag": "\"232c-Dnz9DhH4c266e6TziU1pxRkV6FY\"",
		"mtime": "2025-12-25T23:18:06.704Z",
		"size": 9004,
		"path": "../public/assets/jetbrains-mono-greek-wght-normal-Bw9x6K1M.woff2"
	},
	"/assets/utils-C9dNsMzE.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"97-qGiER5CNGsgTKW0ofFuRr9CyFVY\"",
		"mtime": "2025-12-25T23:18:06.704Z",
		"size": 151,
		"path": "../public/assets/utils-C9dNsMzE.js"
	},
	"/assets/jetbrains-mono-cyrillic-wght-normal-D73BlboJ.woff2": {
		"type": "font/woff2",
		"etag": "\"2f4c-WiAGfn140d4QND3ayQWaCHF8rbE\"",
		"mtime": "2025-12-25T23:18:06.704Z",
		"size": 12108,
		"path": "../public/assets/jetbrains-mono-cyrillic-wght-normal-D73BlboJ.woff2"
	}
};
function readAsset(id) {
	const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
	return promises.readFile(resolve(serverDir, public_assets_data_default[id].path));
}
const publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base$1 in publicAssetBases) if (id.startsWith(base$1)) return true;
	return false;
}
function getAsset(id) {
	return public_assets_data_default[id];
}
var METHODS = new Set(["HEAD", "GET"]);
var EncodingMap = {
	gzip: ".gz",
	br: ".br"
};
var static_default = defineHandler((event) => {
	if (event.req.method && !METHODS.has(event.req.method)) return;
	let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
	let asset;
	const encodings = [...(event.req.headers.get("accept-encoding") || "").split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
	if (encodings.length > 1) event.res.headers.append("Vary", "Accept-Encoding");
	for (const encoding of encodings) for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
		const _asset = getAsset(_id);
		if (_asset) {
			asset = _asset;
			id = _id;
			break;
		}
	}
	if (!asset) {
		if (isPublicAssetURL(id)) {
			event.res.headers.delete("Cache-Control");
			throw new HTTPError({ status: 404 });
		}
		return;
	}
	if (event.req.headers.get("if-none-match") === asset.etag) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	const ifModifiedSinceH = event.req.headers.get("if-modified-since");
	const mtimeDate = new Date(asset.mtime);
	if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	if (asset.type) event.res.headers.set("Content-Type", asset.type);
	if (asset.etag && !event.res.headers.has("ETag")) event.res.headers.set("ETag", asset.etag);
	if (asset.mtime && !event.res.headers.has("Last-Modified")) event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
	if (asset.encoding && !event.res.headers.has("Content-Encoding")) event.res.headers.set("Content-Encoding", asset.encoding);
	if (asset.size > 0 && !event.res.headers.has("Content-Length")) event.res.headers.set("Content-Length", asset.size.toString());
	return readAsset(id);
});
const findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m$1, p$1) => {
		let r$1 = [];
		if (p$1.charCodeAt(p$1.length - 1) === 47) p$1 = p$1.slice(0, -1) || "/";
		let s = p$1.split("/");
		s.length - 1;
		if (s[1] === "assets") r$1.unshift({
			data: $0,
			params: { "_": s.slice(2).join("/") }
		});
		return r$1;
	};
})();
var multiHandler = (...handlers) => {
	const final = handlers.pop();
	const middleware = handlers.filter(Boolean).map((h$1) => toMiddleware(h$1));
	return (ev) => callMiddleware(ev, middleware, final);
};
var _lazy_VD8Ivl = defineLazyEventHandler(() => import("../_/articles.mjs"));
var _lazy_E3n8dN = defineLazyEventHandler(() => import("../_/getAll.mjs"));
var _lazy_eOl0UH = defineLazyEventHandler(() => import("../routes/articles/getOne.mjs"));
var _lazy_1uztk2 = defineLazyEventHandler(() => import("../_/renderer-template.mjs"));
const findRoute = /* @__PURE__ */ (() => {
	const $0 = {
		route: "/articles",
		handler: _lazy_VD8Ivl
	}, $1 = {
		route: "/articles/getAll",
		handler: _lazy_E3n8dN
	}, $2 = {
		route: "/articles/getOne",
		handler: _lazy_eOl0UH
	}, $3 = {
		route: "/**",
		handler: multiHandler(toEventHandler(server_default), _lazy_1uztk2)
	};
	return (m$1, p$1) => {
		if (p$1.charCodeAt(p$1.length - 1) === 47) p$1 = p$1.slice(0, -1) || "/";
		if (p$1 === "/articles") return { data: $0 };
		if (p$1 === "/articles/getAll") return { data: $1 };
		if (p$1 === "/articles/getOne") return { data: $2 };
		let s = p$1.split("/");
		s.length - 1;
		return {
			data: $3,
			params: { "_": s.slice(1).join("/") }
		};
	};
})();
const globalMiddleware = [toEventHandler(static_default)].filter(Boolean);
function useNitroApp() {
	return useNitroApp.__instance__ ??= initNitroApp();
}
function initNitroApp() {
	const nitroApp$1 = createNitroApp();
	globalThis.__nitro__ = nitroApp$1;
	return nitroApp$1;
}
function createNitroApp() {
	const hooks = void 0;
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~middleware"].push(...globalMiddleware);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		{
			const routeRules = getRouteRules(method, pathname);
			event.context.routeRules = routeRules?.routeRules;
			if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		}
		middleware.push(...h3App["~middleware"]);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
function getRouteRules(method, pathname) {
	const m$1 = findRouteRules(method, pathname);
	if (!m$1?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m$1) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	for (const rule of Object.values(routeRules)) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
function _captureError(error, type) {
	console.error(`[${type}]`, error);
	useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
	process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
	process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
var port = Number.parseInt(process.env.NITRO_PORT || process.env.PORT || "") || 3e3;
var host = process.env.NITRO_HOST || process.env.HOST;
var cert = process.env.NITRO_SSL_CERT;
var key = process.env.NITRO_SSL_KEY;
var _fetch = useNitroApp().fetch;
serve({
	port,
	hostname: host,
	tls: cert && key ? {
		cert,
		key
	} : void 0,
	fetch: _fetch,
	bun: { websocket: void 0 }
});
trapUnhandledErrors();
startScheduleRunner();
var bun_default = {};
const rendererTemplate = () => new HTTPResponse("<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <link rel=\"icon\" href=\"/favicon.ico\">\n    <meta name=\"theme-color\" content=\"#000000\">\n    <meta\n      name=\"description\"\n      content=\"Web site created using create-tsrouter-app\"\n    >\n    <link rel=\"apple-touch-icon\" href=\"/logo192.png\">\n    <link rel=\"manifest\" href=\"/manifest.json\">\n    <title>Create TanStack App - tvksquared</title>\n    <script type=\"module\" crossorigin src=\"/assets/index-BwYg42vB.js\"><\/script>\n    <link rel=\"stylesheet\" crossorigin href=\"/assets/index-DAWtczQv.css\">\n  </head>\n  <body class=\"h-dvh\">\n    <div id=\"app\" class=\"h-full flex flex-col\"></div>\n  </body>\n</html>\n", { headers: { "content-type": "text/html; charset=utf-8" } });
function renderIndexHTML(event) {
	return rendererTemplate(event.req);
}
export { db as a, getAll as i, bun_default as n, defineTask as o, articles as r, renderIndexHTML as t };
