
# ngx-force

Library to use Force.com REST API in Angular 2+ and Ionic 2. Ngx-force is an Angular 2+ provider that manages salesforce oauth and facilitates the use of salesforce rest APIs. 

Ngx-force has no jQuery, Salesforce SDK nor forceserver dependency. 

You can use this library for develop any web application or any cordova hybrid application (e.g., Ionic 2). There is no Salesforce SDK dependency for hybrid application because the oauth is implemented using inAppBrowser plugin.


## Installation
```
npm install https://github.com/JaviEspinar/ngx-force.git
```

## Oauth configuration
To perform the oauth flow it is neccesary to configure an oauth callback url in your salesforce application. The oauth callback page should have the following structure:

```html
    <html>
        <body>
            <script>
                window.opener.angularComponentRef.zone.run(function(){
                    window.opener.angularComponentRef.component.oauthCallback(window.location.href);
                });
                window.close();
            </script>
        </body>
    </html>
```

You have to create and include it in your application www folder. 
An example of this oauth is avavilable in this repository: 'https://github.com/JaviEspinar/ngx-force/tree/master/examples/ngxForceIonic/www/oauthcallback.html'.

You can use the this file and configure the oauth callback url in salesforce in order to point to '\<your app domain url\>/oauthcallback.html'.


## CORS
Salesforce REST api doesn’t have native CORS support, if you want to serve the application in your own server you have to proxy the APIs calls through proxy server. 

For test purposes you can use the proxy server of the example application: 'https://sf-test-proxy.herokuapp.com/'. 

This is an instace of an open source proxy, so you can easily deploy it on your own Heroku app or in your own environment for production usage: https://github.com/jamesward/sf-cors-proxy



## Usage
Import the Force provider, init it with your Salesforce app configuration (force.init), authenticate with Salesforce using OAuth (force.login) and request information (force.request, force.query ...).

```typescript
import {Component} from '@angular/core';
import {Force} from 'ngx-force/components';

@Component({
    selector: 'your-app',
    templateUrl: 'your-app.html',
    providers: [Force]
})

export class YourApp {
    constructor(public force:Force) {
        force.init({
            appId: '3MVG9fMtCkV6eLheIEZplMqWfnGlf3Y.BcWdOf1qytXo9zxgbsrUbS.ExHTgUPJeb3jZeT8NYhc.hMyznKU92',
            apiVersion: 'v33.0',
            loginURL: 'https://login.salesforce.com',
            proxyURL: 'https://sf-test-proxy.herokuapp.com/'
        });
    }

    login(){
        this.force.login().then(r => {
            console.log('Login Done');
            console.log('Is authenticated?', this.salesforce.isAuthenticated());
        }, e=>{
            console.error('Error', e);
        });
    };    
    
    getContactsInfo(){
        this.force.query('select id, Name from contact LIMIT 50').then(r => {
            console.log('Results', r);
        }, e=>{
            console.log('Error', e);
        });
    };
}
```

## Example
You have an example of the use of this library in examples folder:
https://github.com/JaviEspinar/ngx-force/tree/master/examples/ngxForceIonic

This is an Ionic 2 project that uses ngx-force to authenticate vis Salesforce OAuth, and the Salesforce REST APIs to access and manipulate Salesforce data


