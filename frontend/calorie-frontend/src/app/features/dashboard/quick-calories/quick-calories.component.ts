import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { ToastrService } from 'ngx-toastr';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { LogsActions } from '../../../store/logs/logs.actions';

@Component({
  selector: 'app-quick-calories',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './quick-calories.component.html',
  styleUrl: './quick-calories.component.scss',
})
export class QuickCaloriesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);

  readonly submitting = signal(false);

  readonly form = this.fb.group({
    calories: [null as number | null, [Validators.required, Validators.min(1)]],
    name: [''],
  });

  ngOnInit(): void {
    this.actions$
      .pipe(
        ofType(LogsActions.addItemSuccess, LogsActions.addItemFailure),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((action) => {
        if (!this.submitting()) {
          return;
        }

        this.submitting.set(false);

        if (action.type === LogsActions.addItemSuccess.type) {
          this.form.reset({ calories: null, name: '' });
        }
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { calories, name } = this.form.getRawValue();
    const parsedCalories = Number(calories);

    if (!Number.isFinite(parsedCalories) || parsedCalories < 1) {
      this.toastr.error('יש להזין לפחות קלוריה אחת');
      return;
    }

    const trimmedName = (name ?? '').trim();

    this.submitting.set(true);

    this.store.dispatch(
      LogsActions.addManual({
        payload: {
          calories: parsedCalories,
          ...(trimmedName ? { name: trimmedName } : {}),
        },
      })
    );
  }
}
