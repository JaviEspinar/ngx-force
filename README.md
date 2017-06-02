
# ngx-force

Library to use Force.com REST API in Angular 2+ and Ionic 2. Ngx-force is an Angular 2+ provider that manages salesforce oauth and facilitates the use of salesforce rest APIs. 

Ngx-force has no jQuery, Salesforce SDK nor forceserver dependency. 

You can use this library for develop any web application or any cordova hybrid application (e.g., Ionic 2). There is no Salesforce SDK dependency for hybrid application because the oauth is implemented using inAppBrowser plugin.


## Installation
```
npm install https://github.com/JaviEspinar/ngx-force.git
```

## Usage
Import the Force provider, init it with your salesforce app configuration (force.init), authenticate with Salesforce using OAuth (force.login) and request information (force.request, force.query ...).

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
            oauthRedirectURL: 'http://localhost:8200/oauthcallback.html',
            proxyURL: 'http://localhost:8200'
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

