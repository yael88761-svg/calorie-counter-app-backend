import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DailyLog } from '../models/api.models';

export interface AddToBasketPayload {
  productId: string;
  unit: string;
  quantity: number;
}

export interface AddManualPayload {
  calories: number;
  name?: string;
}

@Injectable({ providedIn: 'root' })
export class LogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/logs`;

  getToday(): Observable<DailyLog> {
    return this.http.get<DailyLog>(`${this.baseUrl}/today`);
  }

  getLogByDate(date: string): Observable<DailyLog> {
    return this.http.get<DailyLog>(`${this.baseUrl}/${date}`);
  }

  getHistory(): Observable<DailyLog[]> {
    return this.http.get<DailyLog[]>(`${this.baseUrl}/history`);
  }

  addToBasket(payload: AddToBasketPayload): Observable<DailyLog> {
    return this.http.post<DailyLog>(`${this.baseUrl}/add`, payload);
  }

  addManualCalories(payload: AddManualPayload): Observable<DailyLog> {
    return this.http.post<DailyLog>(`${this.baseUrl}/add`, payload);
  }

  removeFromBasket(itemId: string): Observable<DailyLog> {
    return this.http.delete<DailyLog>(`${this.baseUrl}/item/${itemId}`);
  }
}
