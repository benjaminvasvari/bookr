import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SuperadminService {
  runAction(action: string, context?: string): void {
    console.log('[Superadmin]', action, context ?? '');
  }

  confirmAction(action: string, message: string, context?: string): void {
    const details = context ? `\n\nCél: ${context}` : '';
    if (!window.confirm(`${message}${details}`)) {
      return;
    }

    this.runAction(action, context);
  }
}
