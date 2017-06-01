"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular/core");
const http_1 = require("@angular/http");
require("rxjs/add/operator/map");
let NgxForce = class NgxForce {
    constructor(http, zone) {
        this.http = http;
        this.zone = zone;
        this.loginURL = 'https://test.salesforce.com';
        this.scopeParameters = ['full'];
        this.appId = '3MVG9fMtCkV6eLheIEZplMqWfnGlf3Y.BcWdOf1qytXo9zxgbsrUbS.ExHTgUPJeb3jZeT8NYhc.hMyznKU92';
        this.apiVersion = 'v37.0';
        this.tokenStore = {};
        this.context = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/"));
        this.serverURL = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
        this.baseURL = this.serverURL + this.context;
        this.proxyURL = this.baseURL;
        this.oauthCallbackURL = this.baseURL + '/oauthcallback.html';
        this.useProxy = (!(window.cordova || window.SfdcApp));
        this.onlyOne = true;
        window.angularComponentRef = {
            zone: this.zone,
            componentFn: (value) => this.oauthCallback(value),
            component: this
        };
        this.deferredLogin = {
            resolve: undefined,
            reject: undefined
        };
    }
    init(params) {
        if (params) {
            this.appId = params.appId || this.appId;
            this.apiVersion = params.apiVersion || this.apiVersion;
            this.loginURL = params.loginURL || this.loginURL;
            this.oauthCallbackURL = params.oauthCallbackURL || this.oauthCallbackURL;
            this.proxyURL = params.proxyURL || this.proxyURL;
            this.useProxy = params.useProxy === undefined ? this.useProxy : params.useProxy;
            if (params.accessToken) {
                if (!this.oauth)
                    this.oauth = {};
                this.oauth.access_token = params.accessToken;
            }
            if (params.instanceURL) {
                if (!this.oauth)
                    this.oauth = {};
                this.oauth.instance_url = params.instanceURL;
            }
            if (params.refreshToken) {
                if (!this.oauth)
                    this.oauth = {};
                this.oauth.refresh_token = params.refreshToken;
            }
        }
    }
    login() {
        if (window.cordova) {
            return this.loginWithDevice();
        }
        else {
            return this.loginWithBrowser();
        }
    }
    loginWithBrowser() {
        return new Promise((resolve, reject) => {
            let loginWindowURL = this.loginURL + '/services/oauth2/authorize?client_id='
                + this.appId + '&redirect_uri=' + this.oauthCallbackURL
                + '&response_type=token&scope=' + this.scopeParameters.join('%20');
            window.open(loginWindowURL, '_blank', 'location=no');
            this.deferredLogin.resolve = resolve;
            this.deferredLogin.reject = reject;
        });
    }
    loginWithDevice() {
        return new Promise((resolve, reject) => {
            let deviceOauthCallback = this.loginURL + '/services/oauth2/success', loginWindowURL = this.loginURL + '/services/oauth2/authorize?client_id=' + this.appId + '&redirect_uri=' + deviceOauthCallback + '&response_type=token', successOauth = '/services/oauth2/success#access_token=', userDeniedAuth = '/services/oauth2/success?error=access_denied&error_description=end-user+denied+authorization', oauthTimeout = '/setup/secur/RemoteAccessErrorPage';
            if (window.cordova && window.cordova.InAppBrowser) {
                var ref = window.cordova.InAppBrowser.open(loginWindowURL, '_blank', 'location=no,zoom=no');
                ref.addEventListener('loadstop', (event) => {
                    if (event.url.indexOf(successOauth) > -1) {
                        this.oauthCallback(event.url);
                        ref.close();
                    }
                    else if (event.url.indexOf(userDeniedAuth) > -1) {
                        ref.close();
                        reject('User denied authorization');
                    }
                    else if (event.url.indexOf(oauthTimeout) > -1) {
                        ref.close();
                        reject('Oauth timeout');
                    }
                });
                this.deferredLogin.resolve = resolve;
                this.deferredLogin.reject = reject;
            }
            else {
                reject('Cordova InAppBrowser plugin required');
            }
        });
    }
    parseQueryString(queryString) {
        var qs = decodeURIComponent(queryString), obj = {}, params = qs.split('&');
        params.forEach(function (param) {
            var splitter = param.split('=');
            obj[splitter[0]] = splitter[1];
        });
        return obj;
    }
    ;
    oauthCallback(url) {
        let queryString;
        let obj;
        if (url.indexOf("access_token=") > 0) {
            queryString = url.substr(url.indexOf('#') + 1);
            obj = this.parseQueryString(queryString);
            this.oauth = obj;
            this.tokenStore['forceOAuth'] = JSON.stringify(this.oauth);
            this.deferredLogin.resolve('ok');
        }
        else if (url.indexOf("error=") > 0) {
            queryString = decodeURIComponent(url.substring(url.indexOf('?') + 1));
            obj = this.parseQueryString(queryString);
            this.deferredLogin.reject(obj);
        }
        else {
            this.deferredLogin.reject({
                status: 'access_denied'
            });
        }
    }
    getUserId() {
        return this.oauth ? this.oauth.id.split('/').pop() : undefined;
    }
    isAuthenticated() {
        return (this.oauth && this.oauth.access_token) ? true : false;
    }
    getRequestBaseURL() {
        var url;
        if (this.useProxy) {
            url = this.proxyURL;
        }
        else if (this.oauth.instance_url) {
            url = this.oauth.instance_url;
        }
        else {
            url = this.serverURL;
        }
        if (url.slice(-1) === '/') {
            url = url.slice(0, -1);
        }
        return url;
    }
    toQueryString(obj) {
        var parts = [], i;
        for (i in obj) {
            if (obj.hasOwnProperty(i)) {
                parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
            }
        }
        return parts.join("&");
    }
    refreshToken() {
        return new Promise((resolve, reject) => {
            if (!this.oauth.refresh_token) {
                reject('No refresh token found');
            }
            else {
                var params = {
                    'grant_type': 'refresh_token',
                    'refresh_token': this.oauth.refresh_token,
                    'client_id': this.appId
                }, url = this.useProxy ? this.proxyURL : this.loginURL;
                if (url.slice(-1) === '/') {
                    url = url.slice(0, -1);
                }
                url = url + '/services/oauth2/token?' + this.toQueryString(params);
                var headers = new http_1.Headers();
                if (this.useProxy) {
                    headers.append('Target-URL', this.loginURL);
                }
                var method = 'POST';
                var options = new http_1.RequestOptions({ headers: headers, method: method });
                this.http.get(url, options)
                    .map(res => {
                    if (res.status < 200 || res.status >= 300) {
                        reject();
                    }
                    else {
                        return res.json();
                    }
                })
                    .subscribe((data) => {
                    this.oauth.access_token = data.access_token;
                    this.tokenStore.forceOAuth = JSON.stringify(this.oauth);
                    resolve(data);
                }, (error) => {
                    reject(error);
                });
            }
        });
    }
    request(obj) {
        return new Promise((resolve, reject) => {
            if (!this.oauth || (!this.oauth.access_token && !this.oauth.refresh_token)) {
                reject('No access token. Login and try again.');
            }
            else {
                var url = this.getRequestBaseURL();
                if (obj.path.charAt(0) !== '/') {
                    obj.path = '/' + obj.path;
                }
                url = url + obj.path;
                var headers = new http_1.Headers();
                headers.append('Authorization', 'Bearer ' + this.oauth.access_token);
                if (obj.contentType) {
                    headers.append('Content-Type', obj.contentType);
                }
                if (this.useProxy) {
                    headers.append('Target-URL', this.oauth.instance_url);
                }
                var method = obj.method ? obj.method : 'GET';
                var optionInput;
                optionInput = {
                    headers: headers,
                    method: method
                };
                if (obj.responseType === 'arraybuffer') {
                    optionInput.responseType = http_1.ResponseContentType.ArrayBuffer;
                }
                let options = new http_1.RequestOptions(optionInput);
                this.http.get(url, options)
                    .map(res => {
                    if (res.status < 200 || res.status >= 300) {
                        if (res.status === 401) {
                            this.onlyOne = false;
                            if (this.oauth.refresh_token) {
                                return this.refreshToken().then(() => {
                                    return this.request(obj);
                                });
                            }
                            else {
                                return this.login().then(() => {
                                    return this.request(obj);
                                });
                            }
                        }
                        else {
                            throw new Error('This request has failed ' + res.status);
                        }
                    }
                    else {
                        return res.json();
                    }
                })
                    .subscribe((data) => {
                    resolve(data);
                }, (error) => {
                    reject(error);
                });
            }
        });
    }
    query(soql) {
        return this.request({
            path: '/services/data/' + this.apiVersion + '/query',
            params: {
                q: soql
            }
        });
    }
    retrieve(objectName, id, fields) {
        return this.request({
            path: '/services/data/' + this.apiVersion + '/sobjects/' + objectName + '/' + id,
            params: fields ? {
                fields: fields
            } : undefined
        });
    }
    create(objectName, data) {
        return this.request({
            method: 'POST',
            contentType: 'application/json',
            path: '/services/data/' + this.apiVersion + '/sobjects/' + objectName + '/',
            data: data
        });
    }
    update(objectName, data) {
        var id = data.Id, fields = Object.assign({}, data);
        delete fields.attributes;
        delete fields.Id;
        return this.request({
            method: 'POST',
            contentType: 'application/json',
            path: '/services/data/' + this.apiVersion + '/sobjects/' + objectName + '/' + id,
            params: {
                '_HttpMethod': 'PATCH'
            },
            data: fields
        });
    }
    del(objectName, id) {
        return this.request({
            method: 'DELETE',
            path: '/services/data/' + this.apiVersion + '/sobjects/' + objectName + '/' + id
        });
    }
    upsert(objectName, externalIdField, externalId, data) {
        return this.request({
            method: 'PATCH',
            contentType: 'application/json',
            path: '/services/data/' + this.apiVersion + '/sobjects/' + objectName + '/' + externalIdField + '/' + externalId,
            data: data
        });
    }
    ngOnDestroy() {
        window.angularComponent = null;
    }
};
NgxForce = __decorate([
    core_1.Injectable(),
    __metadata("design:paramtypes", [http_1.Http, core_1.NgZone])
], NgxForce);
exports.NgxForce = NgxForce;
//# sourceMappingURL=ngx-force.js.map