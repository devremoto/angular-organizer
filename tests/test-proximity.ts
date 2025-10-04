import { Component } from '@angular/core';

@Component({
    selector: 'app-example',
    template: `<div>Example</div>`
})
export class ExampleComponent {

    // This method calls validateInput and processData
    public handleSubmit(): void {
        if (this.validateInput()) {
            this.processData();
            this.updateUI();
        }
    }

    // This method calls formatData
    public displayResults(): void {
        const formatted = this.formatData();
        console.log(formatted);
    }

    // This method is called by handleSubmit
    private validateInput(): boolean {
        return this.checkRequired() && this.checkFormat();
    }

    // This method is called by validateInput
    private checkRequired(): boolean {
        return true;
    }

    // This method is called by validateInput  
    private checkFormat(): boolean {
        return true;
    }

    // This method is called by handleSubmit
    private processData(): void {
        this.transformData();
        this.saveData();
    }

    // This method is called by processData
    private transformData(): void {
        console.log('transforming...');
    }

    // This method is called by processData
    private saveData(): void {
        console.log('saving...');
    }

    // This method is called by handleSubmit
    private updateUI(): void {
        console.log('updating UI...');
    }

    // This method is called by displayResults
    private formatData(): string {
        return 'formatted data';
    }

    // This method has no relationships
    private unrelatedMethod(): void {
        console.log('unrelated');
    }
}