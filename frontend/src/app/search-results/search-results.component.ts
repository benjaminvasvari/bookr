import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { Title } from '@angular/platform-browser';
import { Company } from '../core/models';
import { CompaniesService } from '../core/services/companies.service';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css'],
})
export class SearchResultsComponent implements OnInit, OnDestroy {
  searchQuery: string = '';
  results: Company[] = [];
  isLoading: boolean = false;
  hasSearched: boolean = false;

  private searchSubject$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private companiesService: CompaniesService,
    private title: Title
  ) {}

  ngOnInit(): void {
    this.searchSubject$
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query.trim()) {
            this.results = [];
            this.hasSearched = false;
            this.isLoading = false;
            return of([]);
          }
          this.isLoading = true;
          this.hasSearched = true;
          return this.companiesService.searchCompanies(query);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data: Company[]) => {
          this.results = data;
          this.isLoading = false;
        },
        error: () => {
          this.results = [];
          this.isLoading = false;
        },
      });

    // Kezdeti lekérdezés a query paramból
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const q = params['q'] ?? '';
      this.searchQuery = q;
      this.title.setTitle(q ? `"${q}" – keresés | Bookr` : 'Keresés | Bookr');
      if (q.trim()) {
        this.performSearch(q);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private performSearch(query: string): void {
    if (!query.trim()) return;
    this.isLoading = true;
    this.hasSearched = true;
    this.companiesService
      .searchCompanies(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Company[]) => {
          this.results = data;
          this.isLoading = false;
        },
        error: () => {
          this.results = [];
          this.isLoading = false;
        },
      });
  }

  onSearchInputChange(value: string): void {
    this.searchSubject$.next(value);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: value || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.performSearch(this.searchQuery);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { q: this.searchQuery },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  goToCompany(id: number): void {
    this.router.navigate(['/sel-industry', id]);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  getRatingStars(rating: number): { filled: boolean }[] {
    const full = Math.round(rating);
    return Array(5)
      .fill(0)
      .map((_, i) => ({ filled: i < full }));
  }
}
