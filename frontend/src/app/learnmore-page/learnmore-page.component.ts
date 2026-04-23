import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-learnmore-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './learnmore-page.component.html',
  styleUrls: ['./learnmore-page.component.css'],
})
export class LearnmorePageComponent implements OnInit {
  ngOnInit(): void {
    window.scrollTo(0, 0);
  }

  scrollToSection(sectionId: string): void {
    const targetSection = document.getElementById(sectionId);

    if (!targetSection) {
      return;
    }

    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}