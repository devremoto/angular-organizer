import { Component } from '@angular/core';
import { inject, input, output, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { DialogService } from './dialog.service';
import { LocaleService } from './locale.service';
import { PaymentService } from './payment.service';
import { SignalrService } from './signalr.service';
@Component({
    selector: 'app-payment',
    template: `<div>Payment Component</div>`
})
export class PaymentComponent {
    //#region Fields · public
    anotherSignal = signal<boolean>(false);
    dialogService = inject(DialogService);
    error = output<any>();
    isLoading = signal<boolean>(false);
    localeService = inject(LocaleService);
    readonly merchantCode = input('', { alias: 'merchant-code' });
    paymentService = inject(PaymentService);
    ready = output<Payment>();
    requiredInput = input.required<string>();
    router = inject(ActivatedRoute);
    selectedGatewayId = signal<string>('');
    signalrService = inject(SignalrService);
    success = output<any>();
    //#endregion Fields · public

    //#region Angular lifecycle
    ngOnInit() {
        console.log('Component initialized');
    }
    //#endregion Angular lifecycle
}