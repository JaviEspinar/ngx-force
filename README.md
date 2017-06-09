
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

## Interface

### init
* input: object that can contains:

    * appId
        
        Salesforce app id. 

    * apiVersion 

        Salesforce API version. By default: 37.0

    * loginURL

        Salesforce login url. By default:'https://test.salesforce.com'. Examples:
        * 'https://test.salesforce.com' - Testing environments
        * 'https://login.salesforce.com' - Production environment

    * oauthCallbackURL 

        Oauth callback url configured in your salesforce remote app. By default: '<your_base_url>/oauthcallback.html'

    * proxyURL 

        Proxy url to use salesforce API in a custom sever. By default: undefined.

        If you use this library in a hybrid application proxy is not neccessary.

    * useProxy 

        Boolean variable that specifies if the app use proxy.  By default: false


    If you are running the app from a Visualforce page you do not need to authenticate. Use the following paramenters. 

    * accessToken (required in this scenario)

        Salesforce access token

    * instanceURL

        Salesforce instance URL

    * refreshToken

        Salesforce refresh token

* output: void

    ```typescript
        force.init({
            appId: '3MVG9fMtCkV6eLheIEZplMqWfnGlf3Y.BcWdOf1qytXo9zxgbsrUbS.ExHTgUPJeb3jZeT8NYhc.hMyznKU92',
            apiVersion: 'v39.0',
            loginURL: 'https://login.salesforce.com',
            proxyURL: 'https://sf-test-proxy.herokuapp.com/'
        });
    ```
       


### login

* input: -

* output: Promise

    ```typescript
        force.login().then(r => {
           // Login done!
        }, e => {
            console.error('Error', e);
        });
    ```
    

### getUserId

* input: -
* output: String

    ```typescript
        force.getUserId()
    ```
 

### isAuthenticated

* input: -
* output: boolean

    ```typescript
        force.isAuthenticated()
    ```
 

### request

* input: object that can contains:
    * path: string. Service url
    * mehtodd: string. Http method (GET, POST, DELETE ...)
    * data: any. Service input object. 

* output: Promise

    ```typescript
        force.request({path: 'services/apexrest/User'}).then(r => {
            this.userInfo = r;
        }, e=>{
            console.error('Error', e);
        });
    ```
 

### query

* input: string. SOQL query in string format.
* output: Promise

    ```typescript
        force.query('select id, Name from contact LIMIT 50').then(r => {
            this.contacts = r;
        }, e=>{
            console.error('Error', e);
        });
    ```
 

### retrieve

* input:
    * objectName: string
    * id: string
    * fields: Array

* output: Promise

    ```typescript
        force.retrieve('contact', '00558000000UPm0AAG', ['FirstName', 'LastName']]).then(r => {
            this.contact = r;
        }, e=>{
            console.error('Error', e);
        });
    ```
 

### create

* inputs:
    * objectName: string
    * data: any. Object with the structure of the new record.

* output:Promise

    ```typescript
        force.create('contact', {FirstName: "Ana", LastName: "Alicia"}).then(r => {
            console.log('Successfully created ', r);
        }, e=>{
            console.error('Error', e);
        });
    ```
 

### update

* inputs:
    * objectName: string
    * data: any. Object with the structure of the new record. It must contain an id.
    
* output:Promise

    ```typescript
        force.update('contact', {Id: "00558000000UPm0AAG", FirstName: "Ana", LastName: "Alicia"}).then(r => {
            console.log('Successfully updated ', r);
        }, e=>{
            console.error('Error', e);
        });

    ```
 

### del

* inputs:
    * objectName: string
    * id: string. 

* output:Promise

    ```typescript
        force.del('contact', "00558000000UPm0AAG").then(r => {
            console.log('Successfully deleted ', r);
        }, e=>{
            console.error('Error', e);
        });
    ```
 


## Example
You have an example of the use of this library in examples folder:
https://github.com/JaviEspinar/ngx-force/tree/master/examples/ngxForceIonic

This is an Ionic 2 project that uses ngx-force to authenticate vis Salesforce OAuth, and the Salesforce REST APIs to access and manipulate Salesforce data


