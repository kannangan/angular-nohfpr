import { Directive, OnInit, ElementRef, Output, EventEmitter, OnDestroy, Self } from '@angular/core';
import { Observable, Subscription, fromEventPattern, asyncScheduler, asapScheduler } from 'rxjs';
import { withLatestFrom, map, tap, observeOn } from 'rxjs/operators';
import { DndDropzoneDirective } from 'ngx-drag-drop';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

cytoscape.use(dagre);

function logger(eventName) {
  return function(...args) {
    console.group(eventName);
    console.log(...args);
    console.groupEnd();
  };
}

@Directive({
  selector: '[appCytoscape]',
  exportAs: 'cytoscape'
})
export class CytoscapeDirective implements OnInit, OnDestroy {

  private _cytoscape;

  tapDragOver$: Observable<any>;

  @Output() inited: EventEmitter<any> = new EventEmitter<any>();

  subscriptions: Subscription[] = [];

  constructor(private elementRef: ElementRef, @Self() private dropzone: DndDropzoneDirective) {

  }

  ngOnInit() {
    const _cytoscape = this._cytoscape = cytoscape({
      container: this.elementRef.nativeElement,
      elements: [ // list of graph elements to start with
        { // node a
          data: { id: 'a', name: 'projects' }
        },
        { // node b
          data: { id: 'b', name: 'competitors' }
        },
        {
          data: { id: 'c', name: 'tf_f_user_projects' }
        },
        { // edge ab
          data: { id: 'ab', source: 'b', target: 'a', method: 'inner join' },
        },
        {
          data: { id: 'ac', source: 'c', target: 'a', method: 'left join' }
        }
      ],

      style: [ // the stylesheet for the graph
        {
          selector: 'node',
          style: {
            'shape': 'rectangle',
            'padding': '6px 16px',
            'background-color': '#666',
            'label': 'data(name)',
            'color': '#fff',
            'text-valign': 'center',
            'width': 'label',
          }
        },

        {
          selector: 'edge',
          style: {
            'curve-style': 'straight',
            'width': 2,
            'line-color': '#000',
            'target-arrow-color': '#000',
            'target-arrow-shape': 'triangle',
            'target-arrow-fill': 'filled',
            'arrow-scale': 1,
            'source-label': 'data(method)',
            'source-text-offset': '100%',
            'text-border-width': '2px'
          }
        }
      ],

      layout: {
        name: 'dagre',
        ranker: 'longest-path',
        rankDir: 'RL',
        rankSep: 200,
      },

      // zoomingEnabled: false,
      // userZoomingEnabled: false,
      panningEnabled: false,
      userPanningEnabled: false,
      boxSelectionEnabled: false
    });

    this.tapDragOver$ = fromEventPattern(
      handler => this._cytoscape.on('tapdragover', 'node', handler),
      handler => this._cytoscape.off('tapdragover', 'node', handler)
    ).pipe(
      // observeOn(asapScheduler),
      tap(() => console.log('tapdragover')),
    );

    this.subscriptions.push(
      this.dropzone.dndDrop.pipe(
        // observeOn(asyncScheduler),
        tap((event) => console.log('dndDrop', event)),
        withLatestFrom(this.tapDragOver$),
        map(([dropEvent, [dropOverEvent]]) => [dropEvent, dropOverEvent]),
        // map(([[dropOverEvent], dropEvent]) => [dropEvent, dropOverEvent]),
        map(([dropEvent, dropOverEvent]) => {
          console.groupCollapsed('filtering nodes');
          console.log('event position', dropOverEvent.position, dropOverEvent.renderedPosition);
          const targetNodes = this._cytoscape.filter(el => {
            if (!el.isNode()) {
              return false;
            }
            const pointerPosition = dropOverEvent.position;
            const rect = el.renderedBoundingBox();
            // console.group('node');
            // console.log(el._private.data);
            // console.log('el.position', el.position());
            // console.log('el.renderedPosition', el.renderedPosition());
            // console.log('el.relativePosition', el.relativePosition());
            console.log('el.renderedBoundingBox', el.renderedBoundingBox());
            console.log('el.boundingBox', el.boundingBox());
            // console.groupEnd();
            // return false;
            return pointerPosition.x >= rect.x1 && pointerPosition.x <= rect.x2
              && pointerPosition.y >= rect.y1 && pointerPosition.y <= rect.y2
          });
          console.log(targetNodes);
          console.groupEnd();
          return [dropEvent, dropOverEvent, targetNodes[0]];
        })
      ).subscribe(([dropEvent, dragOverEvent, targetNode]) => {
        if (targetNode) {
          const id = `${dropEvent.data.id}-${Date.now()}`;
          this._cytoscape.add([{
            groups: 'nodes',
            data: Object.assign({}, dropEvent.data, { id })
          }, {
            groups: 'edges',
            data: {
              id: `${id}-${targetNode._private.data.id}`,
              source: id,
              target: targetNode._private.data.id,
              method: 'left join'
            }
          }]);
          this._cytoscape.layout({
            name: 'dagre',
            ranker: 'longest-path',
            rankDir: 'RL',
            rankSep: 200,
          }).run();
        } else {
          // 创建一个鼠标描述落点的元素
          // this._cytoscape.add([{
          //   groups: 'node',
          //   data: {
          //     id: Date.now(),
          //     name: `placeholder for (${dragOverEvent.position.x},${dragOverEvent.position.y})`
          //   },
          //   position: dragOverEvent.position
          // }]);
        }        
      })
    );
    // TODO 从ngx-drag-drop 库的dropped 事件中获取拖拽的数据，然后和node 触发的tapdragover 做拉链
    // _cytoscape.on('tapdragover', 'node', function(...args) {
    //   console.group('tapdragover');
    //   console.log(...args);
    //   console.groupEnd();
    // });

    this.inited.emit(this._cytoscape);
  }

  ngOnDestroy() {
    this._cytoscape.destroy();
    this.subscriptions.forEach(x => x.unsubscribe());
  }

  public add(...args) {
    this._cytoscape.add(...args);
    this._cytoscape.layout({
      name: 'dagre',
      ranker: 'longest-path',
      rankDir: 'RL',
      rankSep: 200,
    }).run();
  }
}