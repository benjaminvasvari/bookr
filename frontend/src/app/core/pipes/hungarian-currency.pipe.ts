import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hungarianCurrency',
  standalone: true
})
export class HungarianCurrencyPipe implements PipeTransform {
  transform(value: number, currency: string = 'HUF'): string {
    if (value === null || value === undefined) return '';
    
    // Magyar formázás: 13900 → "13 900"
    const formatted = value.toLocaleString('hu-HU');
    
    // HUF → Ft konverzió
    const currencySymbol = currency === 'HUF' ? 'Ft' : currency;
    
    return `${formatted} ${currencySymbol}`;
  }
}