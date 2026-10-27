import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: 'p-inputnumber',
  standalone: true,
})
export class SelectOnFocusDirective {
  @HostListener('focusin', ['$event'])
  onFocusIn(event: FocusEvent) {
    const target = event.target as HTMLInputElement;
    if (target.tagName === 'INPUT') {
      requestAnimationFrame(() => target.select());
    }
  }
}
