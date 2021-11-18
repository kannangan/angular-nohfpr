import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { DndModule } from 'ngx-drag-drop';

import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';
import { CytoscapeDirective } from './cytoscape.directive';

@NgModule({
  imports:      [ BrowserModule, FormsModule, DndModule ],
  declarations: [ AppComponent, HelloComponent, CytoscapeDirective ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
