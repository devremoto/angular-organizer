import { HttpClient } from '@angular/common/http';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { inject, input, output, signal, computed, effect } from '@angular/core';


@Component({
    selector: 'app-signal-example',
    template: `<div>{{count()}}</div>`
})
export class SignalExampleComponent {
//#region Fields · protected
protected someProtectedField = 'protected';
//#endregion Fields · protected

//#region Fields · public
public somePublicField = 'public';
//#endregion Fields · public

//#region Signal APIs (inject/input/output/signal)
userId = input.required<number>();
userName = input<string>('default');

countChange = output<number>();
nameChange = output<string>();

count = signal<number>(0);
name = signal<string>('');
//#endregion Signal APIs (inject/input/output/signal)

//#region @Input properties
@Input() traditionalInput: string = '';
//#endregion @Input properties

//#region @Output properties
@Output() traditionalOutput = new EventEmitter<string>();
//#endregion @Output properties

//#region Getters · public
get displayName() {
        return this.name();
    }
//#endregion Getters · public

//#region Constructor
constructor() {
        console.log('Component initialized');
    }
//#endregion Constructor

//#region Angular lifecycle
ngOnInit() {
        this.count.set(1);
    }
//#endregion Angular lifecycle

//#region Methods · public
increment() {
        this.count.update(c => c + 1);
    }
//#endregion Methods · public

//#region ngOnDestroy
ngOnDestroy() {
        console.log('Component destroyed');
    }
//#endregion ngOnDestroy
}