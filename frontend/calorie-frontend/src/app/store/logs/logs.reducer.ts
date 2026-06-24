import { createFeature, createReducer, on } from '@ngrx/store';

import { DailyLog } from '../../core/models/api.models';
import { LogsActions } from './logs.actions';

export interface LogsState {
  todayLog: DailyLog | null;
  loading: boolean;
  error: string | null;
}

export const initialLogsState: LogsState = {
  todayLog: null,
  loading: false,
  error: null,
};

export const logsFeature = createFeature({
  name: 'logs',
  reducer: createReducer(
    initialLogsState,

    on(LogsActions.loadToday, LogsActions.addItem, LogsActions.addManual, LogsActions.removeItem, (state) => ({
      ...state,
      loading: true,
      error: null,
    })),

    on(LogsActions.loadTodaySuccess, LogsActions.addItemSuccess, LogsActions.removeItemSuccess, (state, { log }) => ({
      ...state,
      todayLog: log,
      loading: false,
      error: null,
    })),

    on(
      LogsActions.loadTodayFailure,
      LogsActions.addItemFailure,
      LogsActions.removeItemFailure,
      (state, { error }) => ({
        ...state,
        loading: false,
        error,
      })
    )
  ),
});

export const {
  name: logsFeatureKey,
  reducer: logsReducer,
  selectLogsState,
  selectTodayLog,
  selectLoading,
  selectError,
} = logsFeature;
