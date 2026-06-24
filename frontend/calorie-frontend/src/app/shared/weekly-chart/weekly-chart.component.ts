import { Component, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Actions, ofType } from '@ngrx/effects';
import { BaseChartDirective } from 'ng2-charts';

import { MatCardModule } from '@angular/material/card';

import { DailyLog } from '../../core/models/api.models';
import { LogService } from '../../core/services/log.service';
import { LogsActions } from '../../store/logs/logs.actions';

/** Same date key format as backend log.controller (UTC YYYY-MM-DD). */
function getUtcDateKey(daysAgo: number): string {
  const day = new Date();
  day.setUTCDate(day.getUTCDate() - daysAgo);
  return day.toISOString().slice(0, 10);
}

function formatDayLabel(dateKey: string): string {
  const day = new Date(`${dateKey}T12:00:00.000Z`);
  return day.toLocaleDateString('he-IL', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    timeZone: 'UTC',
  });
}

@Component({
  selector: 'app-weekly-chart',
  standalone: true,
  imports: [BaseChartDirective, MatCardModule],
  templateUrl: './weekly-chart.component.html',
  styleUrl: './weekly-chart.component.scss',
})
export class WeeklyChartComponent implements OnInit {
  private readonly logService = inject(LogService);
  private readonly actions$ = inject(Actions);
  private readonly destroyRef = inject(DestroyRef);

  /** When true, loads history on init and refreshes after basket changes. */
  @Input() autoLoad = true;

  @Input() set logs(value: DailyLog[] | undefined) {
    if (value !== undefined) {
      this.buildChart(value);
    }
  }

  hasChartData = signal(false);
  loading = signal(false);

  chartData: ChartData<'bar'> = {
    labels: [],
    datasets: [],
  };

  readonly chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#5A625A',
          font: { family: 'Heebo, Segoe UI, sans-serif' },
        },
      },
    },
    scales: {
      x: {
        reverse: false,
        ticks: {
          maxRotation: 0,
          color: '#8A928A',
          font: { family: 'Heebo, Segoe UI, sans-serif' },
        },
        grid: { color: 'rgba(234, 237, 231, 0.8)' },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#8A928A',
          font: { family: 'Heebo, Segoe UI, sans-serif' },
        },
        grid: { color: 'rgba(234, 237, 231, 0.8)' },
        title: {
          display: true,
          text: 'קק״ל',
          color: '#5A625A',
          font: { family: 'Heebo, Segoe UI, sans-serif', weight: 500 },
        },
      },
    },
  };

  ngOnInit(): void {
    if (!this.autoLoad) {
      return;
    }

    this.loadHistory();

    this.actions$
      .pipe(
        ofType(LogsActions.addItemSuccess, LogsActions.removeItemSuccess),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.loadHistory());
  }

  updateFromLogs(logs: DailyLog[]): void {
    this.buildChart(logs);
    this.loading.set(false);
  }

  private loadHistory(): void {
    this.loading.set(true);

    this.logService.getHistory().subscribe({
      next: (logs) => this.updateFromLogs(logs),
      error: () => {
        this.hasChartData.set(false);
        this.loading.set(false);
      },
    });
  }

  private buildChart(logs: DailyLog[]): void {
    const logByDate = new Map(logs.map((log) => [log.date, log]));
    const defaultTarget = logs[0]?.targetCalories ?? 2000;
    const labels: string[] = [];
    const consumed: number[] = [];
    const targets: number[] = [];

    // Oldest day first (left) → today last (right), matching backend UTC dates.
    for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
      const dateKey = getUtcDateKey(daysAgo);
      const log = logByDate.get(dateKey);

      labels.push(formatDayLabel(dateKey));
      consumed.push(log?.totalCaloriesConsumed ?? 0);
      targets.push(log?.targetCalories ?? defaultTarget);
    }

    this.hasChartData.set(consumed.some((value) => value > 0));

    this.chartData = {
      labels,
      datasets: [
        {
          label: 'נצרך',
          data: consumed,
          type: 'bar',
          backgroundColor: '#7AC70C',
          borderColor: '#5C9A09',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'יעד',
          data: targets,
          type: 'line',
          borderColor: 'rgba(90, 98, 90, 0.65)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: 'rgba(90, 98, 90, 0.65)',
        },
      ],
    } as ChartData<'bar'>;
  }
}
