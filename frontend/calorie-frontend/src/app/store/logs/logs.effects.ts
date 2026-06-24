import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';

import { LogService } from '../../core/services/log.service';
import { LogsActions } from './logs.actions';

function getApiErrorMessage(error: unknown, fallback: string): string {
  const body = (error as { error?: { message?: string; errors?: Array<{ message?: string }> } })?.error;

  if (body?.errors?.length) {
    return body.errors[0]?.message ?? body.message ?? fallback;
  }

  return body?.message ?? fallback;
}

@Injectable()
export class LogsEffects {
  private readonly actions$ = inject(Actions);
  private readonly logService = inject(LogService);

  loadToday$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LogsActions.loadToday),
      switchMap(() =>
        this.logService.getToday().pipe(
          map((log) => LogsActions.loadTodaySuccess({ log })),
          catchError((error) =>
            of(
              LogsActions.loadTodayFailure({
                error: getApiErrorMessage(error, 'Failed to load today log'),
              })
            )
          )
        )
      )
    )
  );

  addItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LogsActions.addItem),
      switchMap(({ payload }) =>
        this.logService.addToBasket(payload).pipe(
          map((log) => LogsActions.addItemSuccess({ log })),
          catchError((error) =>
            of(
              LogsActions.addItemFailure({
                error: getApiErrorMessage(error, 'Failed to add item'),
              })
            )
          )
        )
      )
    )
  );

  addManual$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LogsActions.addManual),
      switchMap(({ payload }) =>
        this.logService.addManualCalories(payload).pipe(
          map((log) => LogsActions.addItemSuccess({ log })),
          catchError((error) =>
            of(
              LogsActions.addItemFailure({
                error: getApiErrorMessage(error, 'Failed to add manual calories'),
              })
            )
          )
        )
      )
    )
  );

  removeItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LogsActions.removeItem),
      switchMap(({ itemId }) =>
        this.logService.removeFromBasket(itemId).pipe(
          map((log) => LogsActions.removeItemSuccess({ log })),
          catchError((error) =>
            of(
              LogsActions.removeItemFailure({
                error: getApiErrorMessage(error, 'Failed to remove item'),
              })
            )
          )
        )
      )
    )
  );
}
