// Unused imports (should be removed)
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { inject, input, output, signal } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';


@Component({
    selector: 'app-cleanup-example',
    template: `<div>{{count()}}</div>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CleanupExampleComponent implements OnInit {
//#region Fields · private
private usedPrivateField = 'I am used';
//#endregion Fields · private

//#region Signal APIs (inject/input/output/signal)
private httpClient = inject(HttpClient);

userName = input<string>('default');

nameChange = output<string>();

count = signal<number>(0);
//#endregion Signal APIs (inject/input/output/signal)

//#region @Input properties
@Input() traditionalInput: string = '';
//#endregion @Input properties

//#region Angular lifecycle
ngOnInit() {
        this.usedPrivateMethod();
        console.log(this.usedPrivateField);
        this.count.set(1);
    }
//#endregion Angular lifecycle

//#region Methods · public
loadData() {
        this.httpClient.get('/api/data').subscribe();
    }

public publicMethod() {
        console.log('Public method');
    }
//#endregion Methods · public

//#region Methods · private
private usedPrivateMethod() {
        console.log('I am called');
    }
//#endregion Methods · private
}