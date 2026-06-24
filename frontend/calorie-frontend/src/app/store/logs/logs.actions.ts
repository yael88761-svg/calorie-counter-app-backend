import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { AddManualPayload, AddToBasketPayload } from '../../core/services/log.service';
import { DailyLog } from '../../core/models/api.models';

export const LogsActions = createActionGroup({
  source: 'Logs',
  events: {
    'Load Today': emptyProps(),
    'Load Today Success': props<{ log: DailyLog }>(),
    'Load Today Failure': props<{ error: string }>(),

    'Add Item': props<{ payload: AddToBasketPayload }>(),
    'Add Item Success': props<{ log: DailyLog }>(),
    'Add Item Failure': props<{ error: string }>(),

    'Add Manual': props<{ payload: AddManualPayload }>(),

    'Remove Item': props<{ itemId: string }>(),
    'Remove Item Success': props<{ log: DailyLog }>(),
    'Remove Item Failure': props<{ error: string }>(),
  },
});
