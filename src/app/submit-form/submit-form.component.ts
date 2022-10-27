import { Component, OnInit } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, AsyncValidatorFn } from '@angular/forms';
import { catchError, debounceTime, EMPTY, first, map, merge, Subject, switchMap, timer } from 'rxjs';
import { PasswordStrength, SignupService } from '../services/signup.service';
import { Validators, FormGroup } from '@angular/forms';

const { email, maxLength, pattern, required, requiredTrue } = Validators;


@Component({
  selector: 'app-submit-form',
  templateUrl: './submit-form.component.html',
  styleUrls: ['./submit-form.component.scss']
})
export class SubmitFormComponent {

  private passwordSubject = new Subject<string>();
  private passwordStrengthFromServer$ = this.passwordSubject.pipe(
    debounceTime(500),
    switchMap((password: any) =>
      this.signupService.getPasswordStrength(password).pipe(catchError((error) => EMPTY)),
    ),
  );
  public passwordStrength$ = merge(this.passwordSubject.pipe(map(() => null)), this.passwordStrengthFromServer$,);
  public showPassword = false;



  public form = this.formBuilder.group({
    email: [
      '',
      [required, email, maxLength(100)],
      (control: AbstractControl) => this.validateEmail(control.value),
    ],
    password: ['', required, () => this.validatePassword()],
  });

  public passwordStrength?: PasswordStrength;

  public submitProgress: 'idle' | 'success' | 'error' = 'idle';

  constructor(private signupService: SignupService, private formBuilder: NonNullableFormBuilder,) { }

  public getPasswordStrength(): void {
    const password = this.form.controls.password.value;
    if (password !== null) {
      this.passwordSubject.next(password);
    }
  }

  private validateEmail(username: string): ReturnType<AsyncValidatorFn> {
    return timer(200).pipe(
      switchMap(() => this.signupService.isEmailTaken(username)),
      map((emailTaken) => (emailTaken ? { taken: true } : null)),
    );
  }

  private validatePassword(): ReturnType<AsyncValidatorFn> {
    return this.passwordStrength$.pipe(
      first((passwordStrength) => passwordStrength !== null),
      map((passwordStrength) =>
        passwordStrength && passwordStrength.score < 3 ? { weak: true } : null,
      ),
    );
  }

  public onSubmit(): void {
    if (!this.form.valid) return;
    this.signupService.signup(this.form.getRawValue()).subscribe({
      complete: () => {
        this.submitProgress = 'success';
        this.form.reset();
      },
      error: () => {
        this.submitProgress = 'error';
      },
    });
  }
}
