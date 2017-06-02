import {Injectable, NgZone} from '@angular/core';
import {Http, RequestOptions, Headers, ResponseContentType} from '@angular/http';
import 'rxjs/add/operator/map';


@Injectable()
export class Force {

    private loginURL: string = 'https://test.salesforce.com';

    private scopeParameters: Array<string> = ['full'];

    private appId: string = '3MVG9fMtCkV6eLheIEZplMqWfnGlf3Y.BcWdOf1qytXo9zxgbsrUbS.ExHTgUPJeb3jZeT8NYhc.hMyznKU92';

    private apiVersion: string = 'v37.0';

    private oauth: any;

    private tokenStore: any = {};

    private context: string = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/"));

    private serverURL: string = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');

    private baseURL: string = this.serverURL + this.context;

    private proxyURL: string = this.baseURL;

    private oauthCallbackURL: string = this.baseURL + '/oauthcallback.html';

    private useProxy: boolean = (!((<any>window).cordova || (<any>window).SfdcApp));

    private deferredLogin: {
        resolve: any,
        reject: any
    };

    private onlyOne: boolean = true;

    public init(params: any) {
        if (params) {
            this.appId = params.appId || this.appId;
            this.apiVersion = params.apiVersion || this.apiVersion;
            this.loginURL = params.loginURL || this.loginURL;
            this.oauthCallbackURL = params.oauthCallbackURL || this.oauthCallbackURL;
            this.proxyURL = params.proxyURL || this.proxyURL;
            this.useProxy = params.useProxy === undefined ? this.useProxy : params.useProxy;

            if (params.accessToken) {
                if (!this.oauth) this.oauth = {};
                this.oauth.access_token = params.accessToken;
            }

            if (params.instanceURL) {
                if (!this.oauth) this.oauth = {};
                this.oauth.instance_url = params.instanceURL;
            }

            if (params.refreshToken) {
                if (!this.oauth) this.oauth = {};
                this.oauth.refresh_token = params.refreshToken;
            }
        }
    }

    public login() {
        if ((<any>window).cordova) {
            return this.loginWithDevice();

        } else {
            return this.loginWithBrowser();
        }
    }

    private loginWithBrowser() {
        return new Promise((resolve, reject) => {

            let loginWindowURL = this.loginURL + '/services/oauth2/authorize?client_id='
                + this.appId + '&redirect_uri=' + this.oauthCallbackURL
                + '&response_type=token&scope=' + this.scopeParameters.join('%20');

            window.open(loginWindowURL, '_blank', 'location=no');
            this.deferredLogin.resolve = resolve;
            this.deferredLogin.reject = reject;
        });
    }

    private loginWithDevice() {
        return new Promise((resolve, reject) => {

            let deviceOauthCallback = this.loginURL + '/services/oauth2/success',
                loginWindowURL = this.loginURL + '/services/oauth2/authorize?client_id=' + this.appId + '&redirect_uri=' + deviceOauthCallback + '&response_type=token',
                successOauth = '/services/oauth2/success#access_token=',
                userDeniedAuth = '/services/oauth2/success?error=access_denied&error_description=end-user+denied+authorization',
                oauthTimeout = '/setup/secur/RemoteAccessErrorPage';

            if ((<any>window).cordova && (<any>window).cordova.InAppBrowser) {

                var ref = (<any>window).cordova.InAppBrowser.open(loginWindowURL, '_blank', 'location=no,zoom=no');
                ref.addEventListener('loadstop', (event) => {
                    if (event.url.indexOf(successOauth) > -1) {
                        this.oauthCallback(event.url);
                        ref.close();

                    } else if (event.url.indexOf(userDeniedAuth) > -1) {
                        ref.close();
                        reject('User denied authorization');

                    } else if (event.url.indexOf(oauthTimeout) > -1) {
                        ref.close();
                        reject('Oauth timeout');
                    }
                });

                this.deferredLogin.resolve = resolve;
                this.deferredLogin.reject = reject;

            } else {
                reject('Cordova InAppBrowser plugin required');
            }

        });
    }

    private parseQueryString(queryString) {
        var qs = decodeURIComponent(queryString),
            obj = {},
            params = qs.split('&');

        params.forEach(function (param) {
            var splitter = param.split('=');
            obj[splitter[0]] = splitter[1];
        });
        return obj;
    };

    private oauthCallback(url) {
        let queryString: string;
        let obj: any;

        if (url.indexOf("access_token=") > 0) {
            queryString = url.substr(url.indexOf('#') + 1);
            obj = this.parseQueryString(queryString);
            this.oauth = obj;
            this.tokenStore['forceOAuth'] = JSON.stringify(this.oauth);
            this.deferredLogin.resolve('ok');

        } else if (url.indexOf("error=") > 0) {
            queryString = decodeURIComponent(url.substring(url.indexOf('?') + 1));
            obj = this.parseQueryString(queryString);
            this.deferredLogin.reject(obj);

        } else {
            this.deferredLogin.reject({
                status: 'access_denied'
            });
        }
    }

    public getUserId() {
        return this.oauth ? this.oauth.id.split('/').pop() : undefined;
    }

    public isAuthenticated() {
        return (this.oauth && this.oauth.access_token) ? true : false;
    }

    private getRequestBaseURL() {

        var url;

        if (this.useProxy) {
            url = this.proxyURL;
        } else if (this.oauth.instance_url) {
            url = this.oauth.instance_url;
        } else {
            url = this.serverURL;
        }

        if (url.slice(-1) === '/') {
            url = url.slice(0, -1);
        }

        return url;
    }

    private toQueryString(obj) {
        var parts = [],
            i;
        for (i in obj) {
            if (obj.hasOwnProperty(i)) {
                parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
            }
        }
        return parts.join("&");
    }

    private refreshToken() {
        return new Promise((resolve, reject) => {

            if (!this.oauth.refresh_token) {
                reject('No refresh token found');

            } else {

                // Compose url
                var params = {
                        'grant_type': 'refresh_token',
                        'refresh_token': this.oauth.refresh_token,
                        'client_id': this.appId
                    },

                    url = this.useProxy ? this.proxyURL : this.loginURL;


                if (url.slice(-1) === '/') {
                    url = url.slice(0, -1);
                }

                url = url + '/services/oauth2/token?' + this.toQueryString(params);

                // Compose headers
                var headers = new Headers();
                if (this.useProxy) {
                    headers.append('Target-URL', this.loginURL);
                }

                // Compose options
                var method = 'POST';
                var options = new RequestOptions({headers: headers, method: method});

                // Request
                this.http.get(url, options)
                    .map(res => {
                        if (res.status < 200 || res.status >= 300) {
                            reject();
                        }
                        else {
                            return res.json();
                        }
                    })
                    .subscribe(
                        (data) => {
                            this.oauth.access_token = data.access_token;
                            this.tokenStore.forceOAuth = JSON.stringify(this.oauth);
                            resolve(data);
                        },
                        (error) => {
                            reject(error);
                        });
            }
        });
    }

    public request(obj) {
        return new Promise((resolve, reject) => {

            if (!this.oauth || (!this.oauth.access_token && !this.oauth.refresh_token)) {
                reject('No access token. Login and try again.');

            } else {

                // Compose url
                var url = this.getRequestBaseURL();
                if (obj.path.charAt(0) !== '/') {
                    obj.path = '/' + obj.path;
                }
                url = url + obj.path;

                //Compose headers
                var headers = new Headers();
                headers.append('Authorization', 'Bearer ' + this.oauth.access_token);
                if (obj.contentType) {
                    headers.append('Content-Type', obj.contentType);
                }
                if (this.useProxy) {
                    headers.append('Target-URL', this.oauth.instance_url);
                }

                // Compose options
                var method = obj.method ? obj.method : 'GET';
                var optionInput: any;

                optionInput = {
                    headers: headers,
                    method: method
                };

                if (obj.responseType === 'arraybuffer') {
                    optionInput.responseType = ResponseContentType.ArrayBuffer;
                }

                let options = new RequestOptions(optionInput);

                // Query
                this.http.get(url, options)
                    .map(res => {
                        if (res.status < 200 || res.status >= 300) {

                            if (res.status === 401) {
                                this.onlyOne = false;
                                if (this.oauth.refresh_token) {
                                    // Unauthorized, try to refresh token
                                    return this.refreshToken().then(() => {
                                        return this.request(obj);
                                    });

                                } else {
                                    // Unauthorized, try to login again
                                    return this.login().then(() => {
                                        return this.request(obj);
                                    });
                                }

                            } else {
                                throw new Error('This request has failed ' + res.status);
                            }
                        }
                        else {
                            return res.json();
                        }
                    })
                    .subscribe(
                        (data) => {
                            resolve(data);
                        },
                        (error) => {
                            reject(error);
                        });
            }
        });
    }

    public query(soql) {
        return this.request({
            path: '/services/data/' + this.apiVersion + '/query',
            params: {
                q: soql
            }
        });
    }

    public retrieve(objectName, id, fields) {

        return this.request({
            path: '/services/data/' + this.apiVersion + '/sobjects/' + objectName + '/' + id,
            params: fields ? {
                fields: fields
            } : undefined
        });
    }

    public create(objectName, data) {
        return this.request({
            method: 'POST',
            contentType: 'application/json',
            path: '/services/data/' + this.apiVersion + '/sobjects/' + objectName + '/',
            data: data
        });
    }

    public update(objectName, data) {
        var id = data.Id,
            // TODO test this clone
            fields = {...data};

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

    public del(objectName, id) {
        return this.request({
            method: 'DELETE',
            path: '/services/data/' + this.apiVersion + '/sobjects/' + objectName + '/' + id
        });
    }

    public upsert(objectName, externalIdField, externalId, data) {
        return this.request({
            method: 'PATCH',
            contentType: 'application/json',
            path: '/services/data/' + this.apiVersion + '/sobjects/' + objectName + '/' + externalIdField + '/' + externalId,
            data: data
        });
    }


    constructor(private http: Http, private zone: NgZone) {
        (<any>window).angularComponentRef = {
            zone: this.zone,
            componentFn: (value) => this.oauthCallback(value),
            component: this
        };
        this.deferredLogin = {
            resolve: undefined,
            reject: undefined
        };
    }

    ngOnDestroy() {
        (<any>window).angularComponent = null;
    }
}
