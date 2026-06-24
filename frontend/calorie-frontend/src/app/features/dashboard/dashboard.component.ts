import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { ToastrService } from 'ngx-toastr';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AuthService } from '../../core/services/auth.service';
import { BasketComponent } from './basket/basket.component';
import { ProgressBarComponent } from './progress-bar/progress-bar.component';
import { QuickCaloriesComponent } from './quick-calories/quick-calories.component';
import { CalorieFormatPipe } from '../../shared/pipes/calorie-format.pipe';
import { CalorieWarningDirective } from '../../shared/directives/calorie-warning.directive';
import { WeeklyChartComponent } from '../../shared/weekly-chart/weekly-chart.component';
import { LogsActions } from '../../store/logs/logs.actions';
import {
  selectLogsError,
  selectLogsLoading,
  selectTodayLog,
} from '../../store/logs/logs.selectors';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    BasketComponent,
    ProgressBarComponent,
    QuickCaloriesComponent,
    CalorieFormatPipe,
    CalorieWarningDirective,
    WeeklyChartComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);

  readonly todayLog$ = this.store.select(selectTodayLog);
  readonly loading$ = this.store.select(selectLogsLoading);
  readonly error$ = this.store.select(selectLogsError);

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: 'dashboard' },
      });
      return;
    }

    this.store.dispatch(LogsActions.loadToday());

    this.actions$
      .pipe(
        ofType(LogsActions.addItemSuccess),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ log }) => {
        const lastItem = log.items.at(-1);
        const label = lastItem?.productName ?? 'הפריט';
        this.toastr.success(`${label} נוסף לסל`);
      });

    this.actions$
      .pipe(
        ofType(LogsActions.addItemFailure),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ error }) => {
        this.toastr.error(error);
      });

    this.actions$
      .pipe(
        ofType(LogsActions.removeItemSuccess),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.toastr.info('הפריט הוסר מהסל');
      });

    this.actions$
      .pipe(
        ofType(LogsActions.removeItemFailure),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ error }) => {
        this.toastr.error(error);
      });
  }

  logout(): void {
    this.authService.logout();
    this.toastr.info('התנתקת בהצלחה');
    this.router.navigate(['/login']);
  }
}
