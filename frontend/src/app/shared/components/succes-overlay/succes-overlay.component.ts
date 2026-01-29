// src/app/shared/components/success-overlay/success-overlay.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-success-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success-overlay.component.html',
  styleUrls: ['./success-overlay.component.css']
})
export class SuccessOverlayComponent implements OnInit {
  @Input() message: string = 'Foglalás sikeresen leadva!';
  @Input() duration: number = 2000; // 2 másodperc
  @Output() completed = new EventEmitter<void>();

  show = false;

  ngOnInit(): void {
    // Kis késleltetés majd fade-in
    setTimeout(() => {
      this.show = true;
    }, 50);

    // 2 másodperc után fade-out és emit
    setTimeout(() => {
      this.show = false;
      setTimeout(() => {
        this.completed.emit();
      }, 400); // Fade-out időtartama
    }, this.duration);
  }
}