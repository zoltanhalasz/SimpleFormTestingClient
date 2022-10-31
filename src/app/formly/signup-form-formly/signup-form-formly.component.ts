import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { catchError, debounceTime, EMPTY, first, map, merge, of, Subject, switchMap, timer } from 'rxjs';
import { SignupService } from 'src/app/services/signup.service';

@Component({
  selector: 'app-signup-form-formly',
  templateUrl: './signup-form-formly.component.html',
  styleUrls: ['./signup-form-formly.component.scss']
})
export class SignupFormFormlyComponent implements OnInit {

  form = new FormGroup({});
  model = { email: '', password: "" };

  private passwordSubject = new Subject<string>();
  private passwordStrengthFromServer$ = this.passwordSubject.pipe(
    debounceTime(300),
    switchMap((password) =>
      this.signupService.getPasswordStrength(password).pipe(catchError(() => EMPTY)),
    ),
  );
  public passwordStrength$ = merge(
    this.passwordSubject.pipe(map(() => null)),
    this.passwordStrengthFromServer$,
  );

  fields: FormlyFieldConfig[] = [
    {
      key: 'email',
      type: 'input',
      id: "emailFormlyField",
      props: {
        label: 'Email address',
        placeholder: 'Enter email',
        required: true,
      },
      validators: {
        maxLength: {
          expression: (c: AbstractControl) => (c.value as string).length < 50,
          message: (error: any, field: FormlyFieldConfig) => `Max length is 50`,
        },
        required: {
          expression: (c: AbstractControl) => (c.value != undefined && c.value !== ''),
          message: (error: any, field: FormlyFieldConfig) => `Email is required`,
        },
        validFormat: {
          expression: (c: AbstractControl) => /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(c.value),
          message: (error: any, field: FormlyFieldConfig) => `Email is invalid format`,
        },
      },
      asyncValidators: {
        emailTaken: {
          expression: (control: AbstractControl) => {
            return timer(300).pipe(
              switchMap(() => {
                console.log(control.value)
                return this.signupService.isEmailTaken(control.value)}),
              map((takenResponse) => {
                return (!takenResponse)
              })
            );
          },
          message: 'This email is already taken.',
        },
      },
    },
    {
      key: 'password',
      type: 'input',
      id: 'passwordFormlyField',
      props: {
        type: 'password',
        label: 'Password',
        placeholder: 'Password',
        required: true,
      },
      validators: {
        required: {
          expression: (c: AbstractControl) => (c.value != undefined && c.value !== ''),
          message: (error: any, field: FormlyFieldConfig) => `Password is required`,
        },

      },
      asyncValidators: {
        passwordWeak: {
          expression: (control: AbstractControl) => {
            return timer(300).pipe(
              switchMap(() => {
                return this.signupService.getPasswordStrength(control.value)}),
              map((response) => {
                console.log(response);
                return (response?.score > 3)
              }))

          },
          message: 'Password is too weak.',
        },
      },
    }
  ];

  onSubmit(model: any): void {
    if (!this.form.valid) return;
    this.signupService.signup(JSON.parse(JSON.stringify(this.model))).subscribe({
      complete: () => {
        this.form.reset();
      },
      error: (message) => {
        alert(JSON.stringify(message.error));
      },
    });
  }

  ngOnInit(): void {

  }

  constructor(private signupService: SignupService) {

  }
}
