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
//#region Signal APIs (inject/input/output/signal)
dialogService = inject(DialogService);
localeService = inject(LocaleService);
paymentService = inject(PaymentService);
router = inject(ActivatedRoute);
signalrService = inject(SignalrService);

readonly merchantCode = input('', { alias: 'merchant-code' });
requiredInput = input.required<string>();

error = output<any>();
ready = output<Payment>();
success = output<any>();

anotherSignal = signal<boolean>(false);
isLoading = signal<boolean>(false);
selectedGatewayId = signal<string>('');
//#endregion Signal APIs (inject/input/output/signal)

//#region Angular lifecycle
ngOnInit() {
        console.log('Component initialized');
    }
//#endregion Angular lifecycle
}