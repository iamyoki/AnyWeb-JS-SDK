"use strict";
/**
 * @author Littleor <me@littleor.cn>
 * @since 2022/2/2
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Provider = void 0;
const common_1 = require("./utils/common");
const package_json_1 = __importDefault(require("../package.json"));
const address_1 = require("./utils/address");
/**
 * AnyWeb Provider
 * @class Provider
 * @author Littleor
 * @since 2020/2/2
 * @example
 * const provider = new Provider()
 */
class Provider {
    constructor({ logger = console, appId }) {
        this.chainId = 1;
        this.events = {};
        if (Provider.instance) {
            return Provider.instance;
        }
        Provider.instance = this;
        this.logger = logger;
        this.appId = appId;
        // bind functions (to prevent consumers from making unbound calls)
        this.request = this.request.bind(this);
        this.call = this.call.bind(this);
        this.send = this.call.bind(this);
        this.enable = this.enable.bind(this);
        if (typeof window !== 'undefined') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            window.anyweb = this;
        }
        const messageHandler = (event) => {
            var _a;
            if (event.data &&
                (0, common_1.isObject)(event.data) &&
                'type' in event.data &&
                event.data.type === 'anyweb') {
                const IframeData = event.data.data;
                if (IframeData.type == 'event' &&
                    IframeData.data == 'ready' &&
                    IframeData.success) {
                    (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug('[AnyWeb] SDK初始化完成');
                    Provider.ready = true;
                    this.events.onReady && this.events.onReady();
                    window.removeEventListener('message', messageHandler);
                }
            }
        };
        window.addEventListener('message', messageHandler);
        (0, common_1.createIframe)('pages/index/home', this.logger)
            .then()
            .catch((e) => { var _a; return (_a = this.logger) === null || _a === void 0 ? void 0 : _a.error('[AnyWeb] createIframe error', e); });
    }
    static getInstance(params) {
        if (!Provider.instance) {
            if (params) {
                Provider.instance = new Provider(params);
            }
            else {
                throw new common_1.ProviderRpcError(common_1.ProviderErrorCode.SDKNotReady, 'Provider is not initialized');
            }
        }
        return Provider.instance;
    }
    /**
     * Deprecated: use `request` instead
     * @param arg
     */
    send(...arg) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.info('[AnyWeb] `send` is deprecated, use `request` instead');
            if (arg.length > 1) {
                return yield this.request({ method: arg[0], params: arg[1] });
            }
            throw new common_1.ProviderRpcError(common_1.ProviderErrorCode.ParamsError, 'Invalid arguments');
        });
    }
    /**
     * Deprecated: use `request` instead
     * @param arg
     */
    call(...arg) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.info('[AnyWeb] `call` is deprecated, use `request` instead', arg);
            if (arg.length > 1) {
                return yield this.request({ method: arg[0], params: arg[1] });
            }
            else {
                return this.enable();
            }
        });
    }
    /**
     * Submits an RPC request
     * @param args {IRequestArguments} Request Arguments: {method, params}
     * @returns {Promise<any>}
     * @example
     * const result = await provider.request({ method: 'cfx_sendTransaction', params})
     */
    request(args) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!args || typeof args !== 'object' || Array.isArray(args)) {
                throw new common_1.ProviderRpcError(common_1.ProviderErrorCode.ParamsError, 'Invalid request arguments');
            }
            const { method, params } = args;
            if (!method || method.trim().length === 0) {
                throw new common_1.ProviderRpcError(common_1.ProviderErrorCode.ParamsError, 'Invalid request arguments: Method is required');
            }
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug(`[AnyWeb] request ${method} with`, params);
            const result = yield this.rawRequest(method, params);
            (_b = this.logger) === null || _b === void 0 ? void 0 : _b.debug(`[AnyWeb] request(${method}):`, result);
            return result;
        });
    }
    /**
     * Deprecated: use `request` instead
     */
    enable() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.request({
                method: 'cfx_requestAccounts',
            });
        });
    }
    /**
     * Submits an RPC request
     * @param method
     * @param params
     * @protected
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rawRequest(method, params) {
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            if (!Provider.ready) {
                throw new common_1.ProviderRpcError(common_1.ProviderErrorCode.SDKNotReady, "Provider is not ready, please use on('ready', callback) to listen to ready event");
            }
            switch (method) {
                case 'cfx_requestAccounts':
                    return this.rawRequest('cfx_accounts');
                case 'cfx_accounts':
                    (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug('[AnyWeb]', { params });
                    const scopes = params[0].scopes;
                    let result;
                    try {
                        result = (yield (0, common_1.callIframe)('pages/dapp/auth', {
                            appId: this.appId,
                            params: params ? JSON.stringify(params[0]) : '',
                            chainId: this.chainId,
                            authType: 'check_auth',
                            scopes: scopes,
                            silence: true,
                        }, this));
                        (_b = this.logger) === null || _b === void 0 ? void 0 : _b.debug('[AnyWeb]', 'silent auth result', result);
                    }
                    catch (e) {
                        (_c = this.logger) === null || _c === void 0 ? void 0 : _c.debug('[AnyWeb]', 'need to auth', e);
                        result = (yield (0, common_1.callIframe)('pages/dapp/auth', {
                            appId: this.appId,
                            params: params ? JSON.stringify(params[0]) : '',
                            chainId: this.chainId,
                            authType: 'account',
                            scopes: scopes,
                        }, this));
                    }
                    result.scopes = scopes;
                    this.events.onAccountsChanged &&
                        this.events.onAccountsChanged(result.address);
                    this.events.onChainChanged &&
                        this.events.onChainChanged(String(result.chainId));
                    this.events.onNetworkChanged &&
                        this.events.onNetworkChanged(String(result.networkId));
                    if (scopes.length > 0) {
                        return {
                            address: result.address,
                            code: result.code,
                            scopes: scopes,
                            chainId: result.chainId,
                            networkId: result.networkId,
                        };
                    }
                    else {
                        return false;
                    }
                case 'cfx_sendTransaction':
                    try {
                        let authType;
                        const payload = params[0];
                        const to = payload.to;
                        if (to) {
                            authType =
                                (0, address_1.getAddressType)(to, this.logger) === address_1.AddressType.CONTRACT
                                    ? 'callContract'
                                    : 'createTransaction';
                        }
                        else {
                            authType = 'createContract';
                        }
                        // createContract
                        return yield (0, common_1.callIframe)('pages/dapp/auth', {
                            appId: this.appId,
                            chainId: this.chainId,
                            params: params
                                ? JSON.stringify({
                                    payload: params[0],
                                    gatewayPayload: params[1],
                                })
                                : '',
                            authType: authType,
                        }, this);
                    }
                    catch (e) {
                        throw new common_1.ProviderRpcError(common_1.ProviderErrorCode.SendTransactionError, 'Error to sendTransaction: ' + e);
                    }
                case 'anyweb_importAccount':
                    try {
                        return yield (0, common_1.callIframe)('pages/dapp/auth', {
                            appId: this.appId,
                            chainId: this.chainId,
                            params: params ? JSON.stringify(params[0]) : JSON.stringify({}),
                            authType: 'importAccount',
                        }, this);
                    }
                    catch (e) {
                        throw new common_1.ProviderRpcError(common_1.ProviderErrorCode.ImportAddressError, 'Error to import Address: ' + e);
                    }
                case 'anyweb_version':
                    return package_json_1.default.version;
                case 'anyweb_home':
                    return yield (0, common_1.callIframe)('pages/index/home', {
                        appId: this.appId,
                        chainId: this.chainId,
                        params: params ? JSON.stringify(params) : '',
                        waitResult: false,
                    }, this);
                case 'exit_accounts':
                    return yield (0, common_1.callIframe)('pages/dapp/auth', {
                        appId: this.appId,
                        chainId: this.chainId,
                        params: params ? JSON.stringify(params) : '',
                        authType: 'exit_accounts',
                        silence: true,
                    }, this);
                case 'anyweb_identify':
                    let identifyResult;
                    try {
                        identifyResult = yield (0, common_1.callIframe)('pages/user/identify', {
                            appId: this.appId,
                            chainId: this.chainId,
                            params: params ? JSON.stringify(params) : '',
                            authType: 'check_identify',
                            silence: true,
                        }, this);
                        (_d = this.logger) === null || _d === void 0 ? void 0 : _d.debug('[AnyWeb]', 'Check identify result', identifyResult);
                    }
                    catch (e) {
                        (_e = this.logger) === null || _e === void 0 ? void 0 : _e.debug('[AnyWeb]', 'need to identify', e);
                        identifyResult = yield (0, common_1.callIframe)('pages/user/identify', {
                            appId: this.appId,
                            chainId: this.chainId,
                            params: params ? JSON.stringify(params) : '',
                            authType: 'identify',
                        }, this);
                    }
                    return identifyResult;
                case 'anyweb_logout':
                    // Logout the account of AnyWeb
                    return yield (0, common_1.callIframe)('pages/dapp/auth', {
                        appId: this.appId,
                        chainId: this.chainId,
                        params: params ? JSON.stringify(params) : '',
                        authType: 'logout',
                        silence: true,
                    }, this);
                case 'anyweb_loginstate':
                    try {
                        return yield (0, common_1.callIframe)('pages/dapp/auth', {
                            appId: this.appId,
                            params: '',
                            chainId: this.chainId,
                            authType: 'check_login',
                            silence: true,
                        }, this);
                    }
                    catch (e) {
                        (_f = this.logger) === null || _f === void 0 ? void 0 : _f.debug('[AnyWeb]', 'need to login', e);
                        return false;
                    }
                default:
                    throw new common_1.ProviderRpcError(common_1.ProviderErrorCode.UnsupportedMethod, 'Unsupported Method: ' + method);
            }
        });
    }
    /**
     * Monitor information
     * @param type {string} Type of information
     * @param listener {Function} Event listener
     * @example
     * provider.on('connected', listener)
     */
    on(type, listener) {
        var _a;
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug('[AnyWeb] on', {
            type,
            listener,
        });
        switch (type) {
            case 'connect':
                this.events.onConnect = listener;
                break;
            case 'disconnect':
                this.events.onDisconnect = listener;
                break;
            case 'chainChanged':
                this.events.onChainChanged = listener;
                break;
            case 'accountsChanged':
                this.events.onAccountsChanged = listener;
                break;
            case 'message':
                this.events.onMessage = listener;
                break;
            case 'networkChanged':
                this.events.onNetworkChanged = listener;
                break;
            case 'ready':
                this.events.onReady = listener;
                break;
            default:
                break;
        }
    }
}
exports.Provider = Provider;
Provider.ready = false;
