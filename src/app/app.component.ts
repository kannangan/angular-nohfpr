import { Component, ViewChild } from '@angular/core';
import { CytoscapeDirective } from './cytoscape.directive';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent  {

  @ViewChild('graph', { read: CytoscapeDirective })
  graph: CytoscapeDirective;

  name = 'Angular';

  addTable() {
    const now = Date.now();
    const table = {
      id: now,
      name: `table-${now}`
    };
    this.graph.add([{
      groups: 'nodes',
      data: table
    }, {
      groups: 'edges',
      data: {
        id: `${now}a`,
        source: now,
        target: 'a',
        method: 'left join'
      }
    }]);
  }
}
