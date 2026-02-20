import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-learnmore-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './learnmore-page.component.html',
  styleUrls: ['./learnmore-page.component.css'],
})
export class LearnmorePageComponent {
  ngOnInit(): void {
    window.scrollTo(0, 0);
  }
}
