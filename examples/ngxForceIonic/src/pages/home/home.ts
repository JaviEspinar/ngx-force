import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Force } from 'ngx-force/components';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [Force]
})
export class HomePage {


  userId: any;
  userInfo: any;
  contacts: any;

  constructor(public navCtrl: NavController, public force: Force) {
    var params: any;

    params = {};
    params.appId = '3MVG9fMtCkV6eLheIEZplMqWfnGlf3Y.BcWdOf1qytXo9zxgbsrUbS.ExHTgUPJeb3jZeT8NYhc.hMyznKU92';
    params.loginURL = 'https://test.salesforce.com';
    params.useProxy = true;
    //You have to enable the proxy url in your salesforce application to enable consuming APIs in a custom server
    params.proxyURL = 'https://sfdc-cors.herokuapp.com';
    force.init(params);
  }

  login() {

    this.force.login().then(r => {
      console.log('Login Done');
      this.userId = this.force.getUserId();
      console.log('User Id', this.force.getUserId());
      console.log('Is authenticated?', this.force.isAuthenticated());
    }, e => {
      console.error('Error', e);
    });
  };

  getUserInfo() {
    let query = `SELECT Id, Email, FirstName, LastName, Alias 
      FROM User where Id = '` + this.userId + `'`;
    this.force.query(query).then(r => {
      console.log('Results', r);
      if( (<any>r).records && (<any>r).records.length > 0) {
        this.userInfo = (<any>r).records[0];
      }      
    }, e => {
      console.log('Error', e);
    });
  };

  getContactsInfo() {
    this.force.query('select id, Name from contact LIMIT 50').then(r => {
      console.log('Results', r);
      if( (<any>r).records && (<any>r).records.length > 0) {
        this.contacts = (<any>r).records;
      } else {
        this.contacts = [{}];
      }   
    }, e => {
      console.log('Error', e);
    });
  };


}
