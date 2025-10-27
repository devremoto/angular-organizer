import { HttpClient } from '@angular/common/http';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { inject, input, output, signal, computed, effect } from '@angular/core';

@Component({
    selector: 'app-signal-example',
    template: `<div>{{count()}}</div>`
})
export class SignalExampleComponent {
//#region Fields · private
private somePrivateField = 'private';
//#endregion Fields · private

//#region Fields · protected
protected someProtectedField = 'protected';
//#endregion Fields · protected

//#region Fields · public
public somePublicField = 'public';
//#endregion Fields · public

//#region Signal APIs (inject/input/output/signal)
private httpClient = inject(HttpClient);
private userService = inject(UserService);
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

//#region Signal hooks (effect/computed)
private _ = effect(() => {
        console.log('Count changed:', this.count());
    });
private doubleCount = computed(() => this.count() * 2);
//#endregion Signal hooks (effect/computed)

//#region Methods · public
increment() {
        this.count.update(c => c + 1);
    }
//#endregion Methods · public

//#region Methods · private
private updateName(newName: string) {
        this.name.set(newName);
    }
//#endregion Methods · private

//#region ngOnDestroy
ngOnDestroy() {
        console.log('Component destroyed');
    }
//#endregion ngOnDestroy
}