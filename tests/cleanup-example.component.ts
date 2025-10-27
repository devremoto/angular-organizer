// Unused imports (should be removed)
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { inject, input, output, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { UnusedService } from './unused.service';
import * as _ from 'lodash';

// Used imports (should be kept)
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-cleanup-example',
    template: `<div>{{count()}}</div>`,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CleanupExampleComponent implements OnInit {
    // Used signal APIs
    private httpClient = inject(HttpClient);
    count = signal<number>(0);
    userName = input<string>('default');
    nameChange = output<string>();

    // Used traditional properties
    @Input() traditionalInput: string = '';

    // Used private field
    private usedPrivateField = 'I am used';

    // Unused private field (should be removed)
    private unusedPrivateField = 'I am not used';

    // Unused private method (should be removed)
    private unusedPrivateMethod() {
        console.log('Never called');
    }

    // Used private method (should be kept)
    private usedPrivateMethod() {
        console.log('I am called');
    }

    // Public method (should not be removed even if unused)
    public publicMethod() {
        console.log('Public method');
    }

    // Used in lifecycle
    ngOnInit() {
        this.usedPrivateMethod();
        console.log(this.usedPrivateField);
        this.count.set(1);
    }

    // Methods that use injected services
    loadData() {
        this.httpClient.get('/api/data').subscribe();
    }
}