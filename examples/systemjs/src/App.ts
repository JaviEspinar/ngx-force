
import {Component} from '@angular/core';
import {HelloWorld} from 'angular2-library-example/components';


@Component({
    selector: 'app',
    template: `<input placeholder="Type Hello World!" (keyup)="onKeyUp(input)" #input>`
})
export class App {

    message = "";

}
