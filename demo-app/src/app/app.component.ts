import {Component, ViewContainerRef} from '@angular/core';
import {BottomSheetProvider} from '../../../angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'demo-app';


  constructor(
    private bottomSheet: BottomSheetProvider,
    vcRef: ViewContainerRef
  ) {
    bottomSheet.rootVcRef = vcRef;
  }
}
