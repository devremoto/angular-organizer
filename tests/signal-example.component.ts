import { Component, Input, Output, EventEmitter } from '@angular/core';
import { inject, input, output, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-signal-example',
    template: `<div>{{count()}}</div>`
})
export class SignalExampleComponent {
    // Traditional Angular properties
    @Input() traditionalInput: string = '';
    @Output() traditionalOutput = new EventEmitter<string>();

    // Private fields
    private somePrivateField = 'private';
    protected someProtectedField = 'protected';
    public somePublicField = 'public';

    // Signal-based APIs (should be grouped together)
    private httpClient = inject(HttpClient);
    private userService = inject(UserService);

    count = signal<number>(0);
    name = signal<string>('');

    userName = input<string>('default');
    userId = input.required<number>();

    nameChange = output<string>();
    countChange = output<number>();

    // Signal hooks
    private doubleCount = computed(() => this.count() * 2);
    private _ = effect(() => {
        console.log('Count changed:', this.count());
    });

    // Getters
    get displayName() {
        return this.name();
    }

    // Constructor
    constructor() {
        console.log('Component initialized');
    }

    // Lifecycle
    ngOnInit() {
        this.count.set(1);
    }

    ngOnDestroy() {
        console.log('Component destroyed');
    }

    // Methods
    increment() {
        this.count.update(c => c + 1);
    }

    private updateName(newName: string) {
        this.name.set(newName);
    }
}