import { CommonModule } from '@angular/common';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ControlErrorsComponent } from '../control-errors/control-errors.component';
import { ErrorMessageDirective } from '../error-message/error-message.directive';
import { PasswordStrength, SignupService } from '../services/signup.service';
import { click, dispatchFakeEvent, expectText, findEl, setFieldValue } from '../spec-helpers/element.spec-helper';
import { email, password, signupData } from '../spec-helpers/signup-data.spec-helper';
import { SubmitFormComponent } from './submit-form.component';

const requiredFields = [
  'email',
];

const weakPassword: PasswordStrength = {
  score: 2,
  warning: 'too short',
  suggestions: ['try a longer password'],
};

const strongPassword: PasswordStrength = {
  score: 4,
  warning: '',
  suggestions: [],
};

describe('SignupFormComponent', () => {
  let fixture: ComponentFixture<SubmitFormComponent>;
  let signupService: jasmine.SpyObj<SignupService>;

  const setup = async (
    signupServiceReturnValues?: jasmine.SpyObjMethodNames<SignupService>,
  ) => {
    signupService = jasmine.createSpyObj<SignupService>('SignupService', {
      // Successful responses per default
      isEmailTaken: of(false),
      getPasswordStrength: of(strongPassword),
      signup: of({ success: true }),
      // Overwrite with given return values
      ...signupServiceReturnValues,
    });

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [SubmitFormComponent, ControlErrorsComponent, ErrorMessageDirective],
      providers: [{ provide: SignupService, useValue: signupService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SubmitFormComponent);
    fixture.detectChanges();
  };

  const fillForm = () => {
    setFieldValue(fixture, 'email', email);
    setFieldValue(fixture, 'password', password);
  };

  const markFieldAsTouched = (element: DebugElement) => {
    dispatchFakeEvent(element.nativeElement, 'blur');
  };

  it('submits the form successfully', fakeAsync(async () => {
    await setup();

    fillForm();
    fixture.detectChanges();

    expect(findEl(fixture, 'submit').properties['disabled']).toBe(true);

    // Wait for async validators
    tick(1000);
    fixture.detectChanges();

    expect(findEl(fixture, 'submit').properties['disabled']).toBe(false);

    findEl(fixture, 'form').triggerEventHandler('submit', {});
    fixture.detectChanges();

    expectText(fixture, 'status', 'Sign-up successful!');

    expect(signupService.isEmailTaken).toHaveBeenCalledWith(email);
    expect(signupService.getPasswordStrength).toHaveBeenCalledWith(password);
    expect(signupService.signup).toHaveBeenCalledWith(signupData);
  }));

  it('does not submit an invalid form', fakeAsync(async () => {
    await setup();

    // Wait for async validators
    tick(1000);

    findEl(fixture, 'form').triggerEventHandler('submit', {});

    expect(signupService.isEmailTaken).not.toHaveBeenCalled();
    expect(signupService.getPasswordStrength).not.toHaveBeenCalled();
    expect(signupService.signup).not.toHaveBeenCalled();
  }));

  it('handles signup failure', fakeAsync(async () => {
    await setup({
      // Let the API report a failure
      signup: throwError(new Error('Validation failed')),
    });

    fillForm();

    // Wait for async validators
    tick(1000);

    findEl(fixture, 'form').triggerEventHandler('submit', {});
    fixture.detectChanges();

    expectText(fixture, 'status', 'Sign-up error');

    expect(signupService.getPasswordStrength).toHaveBeenCalledWith(password);
    expect(signupService.signup).toHaveBeenCalledWith(signupData);
  }));

  it('marks fields as required', async () => {
    await setup();

    // Mark required fields as touched
    requiredFields.forEach((testId) => {
      markFieldAsTouched(findEl(fixture, testId));
    });
    fixture.detectChanges();

    requiredFields.forEach((testId) => {
      const el = findEl(fixture, testId);

      // Check aria-required attribute
      expect(el.attributes['aria-required']).toBe(
        'true',
        `${testId} must be marked as aria-required`,
      );

      // Check aria-errormessage attribute
      const errormessageId = el.attributes['aria-errormessage'];
      if (!errormessageId) {
        throw new Error(`Error message id for ${testId} not present`);
      }
      // Check element with error message
      const errormessageEl = document.getElementById(errormessageId);
      if (!errormessageEl) {
        throw new Error(`Error message element for ${testId} not found`);
      }
      if (errormessageId === 'tos-errors') {
        expect(errormessageEl.textContent).toContain(
          'Please accept the Terms and Services',
        );
      } else {
        expect(errormessageEl.textContent).toContain('must be given');
      }
    });
  })

  it('fails if the email is taken', fakeAsync(async () => {
    await setup({
      // Let the API return that the email is taken
      isEmailTaken: of(true),
    });

    fillForm();

    // Wait for async validators
    tick(1000);
    fixture.detectChanges();

    expect(findEl(fixture, 'submit').properties['disabled']).toBe(true);

    findEl(fixture, 'form').triggerEventHandler('submit', {});

    expect(signupService.isEmailTaken).toHaveBeenCalledWith(email);
    expect(signupService.getPasswordStrength).toHaveBeenCalledWith(password);
    expect(signupService.signup).not.toHaveBeenCalled();
  }));

  it('fails if the password is too weak', fakeAsync(async () => {
    await setup({
      // Let the API return that the password is weak
      getPasswordStrength: of(weakPassword),
    });

    fillForm();

    // Wait for async validators
    tick(1000);
    fixture.detectChanges();

    expect(findEl(fixture, 'submit').properties['disabled']).toBe(true);

    findEl(fixture, 'form').triggerEventHandler('submit', {});

    expect(signupService.isEmailTaken).toHaveBeenCalledWith(email);
    expect(signupService.getPasswordStrength).toHaveBeenCalledWith(password);
    expect(signupService.signup).not.toHaveBeenCalled();
  }));



  it('toggles the password display', async () => {
    await setup();

    setFieldValue(fixture, 'password', 'top secret');
    const passwordEl = findEl(fixture, 'password');
    expect(passwordEl.attributes['type']).toBe('password');

    click(fixture, 'show-password');
    fixture.detectChanges();

    expect(passwordEl.attributes['type']).toBe('text');

    click(fixture, 'show-password');
    fixture.detectChanges();

    expect(passwordEl.attributes['type']).toBe('password');
  });

});
