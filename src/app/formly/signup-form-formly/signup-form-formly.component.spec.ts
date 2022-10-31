import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/compiler';
import { DebugElement } from '@angular/core';
import { ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AppModule } from 'src/app/app.module';

import { PasswordStrength, SignupService } from 'src/app/services/signup.service';
import { findComponent } from 'src/app/spec-helpers/element.spec-helper';
import { click, dispatchFakeEvent, expectText, findEl, setFieldValue } from '../../spec-helpers/element.spec-helper-formly';

import { SignupFormFormlyComponent } from './signup-form-formly.component';


const requiredFields = [
  'email', 'password'
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

describe('SignupFormComponentFormly', () => {
  let fixture: ComponentFixture<SignupFormFormlyComponent>;
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
      imports: [AppModule],
      declarations: [SignupFormFormlyComponent],
      providers: [{ provide: SignupService, useValue: signupService }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(SignupFormFormlyComponent);
    fixture.detectChanges();
  };

  const fillForm = () => {
    setFieldValue(fixture, '#emailFormlyField', '');
    setFieldValue(fixture, '#passwordFormlyField', '');
  };

  const markFieldAsTouched = (element: DebugElement) => {
    dispatchFakeEvent(element.nativeElement, 'blur');
  };

  it('submits the form successfully', fakeAsync(async () => {
    await setup();

    fillForm();
    fixture.detectChanges();
    expect(findEl(fixture, '#submitButton').properties['disabled']).toBe(true);
    const localSignupData = { email: 'Zuzu@mail.com', password: '12345Zocika.' };
    setFieldValue(fixture, '#emailFormlyField', localSignupData.email);
    setFieldValue(fixture, '#passwordFormlyField', localSignupData.password);
    tick(400);
    fixture.detectChanges();

    expect(findEl(fixture, '#submitButton').properties['disabled']).toBe(false);

    findEl(fixture, 'form').triggerEventHandler('submit', {});
    expect(signupService.signup).toHaveBeenCalledWith(localSignupData);

  }));

  it('does not submit an invalid form - email, wrong email format, missing password', fakeAsync(async () => {
    await setup();

    let localSignupData = { email: '', password: '12345Zocika.' };
    setFieldValue(fixture, '#emailFormlyField', localSignupData.email);
    setFieldValue(fixture, '#passwordFormlyField', localSignupData.password);
    tick(400);
    fixture.detectChanges();
    expect(findEl(fixture, '#submitButton').properties['disabled']).toBe(true);
    findEl(fixture, 'form').triggerEventHandler('submit', {});

    expect(signupService.signup).toHaveBeenCalledTimes(0);

    localSignupData = { email: 'zzozo.', password: '12345Zocika.' };
    setFieldValue(fixture, '#emailFormlyField', localSignupData.email);
    setFieldValue(fixture, '#passwordFormlyField', localSignupData.password);
    fixture.detectChanges();
    let validationMessage = findComponent(fixture, '.invalid-feedback').nativeElement.innerText;
    expect(validationMessage).toContain('Email is invalid format');
    expect(findEl(fixture, '#submitButton').properties['disabled']).toBe(true);
    findEl(fixture, 'form').triggerEventHandler('submit', {});
    expect(signupService.signup).toHaveBeenCalledTimes(0);

    localSignupData = { email: 'zozo@email.com', password: '' };
    setFieldValue(fixture, '#emailFormlyField', localSignupData.email);
    setFieldValue(fixture, '#passwordFormlyField', localSignupData.password);
    fixture.detectChanges();
    expect(findEl(fixture, '#submitButton').properties['disabled']).toBe(true);
    findEl(fixture, 'form').triggerEventHandler('submit', {});
    validationMessage = findComponent(fixture, '.invalid-feedback').nativeElement.innerText;
    expect(validationMessage).toContain('Password is required');
    expect(signupService.signup).toHaveBeenCalledTimes(0);
    discardPeriodicTasks()
  }));

  it('does not submit an invalid form - existing email', fakeAsync(async () => {
    await setup();

    let localSignupData = { email: 'abcd@hyundai.com', password: '12345Zocika.' };
    setFieldValue(fixture, '#emailFormlyField', localSignupData.email);
    setFieldValue(fixture, '#passwordFormlyField', localSignupData.password);
    tick(400);
    fixture.detectChanges();
    expect(findEl(fixture, '#submitButton').properties['disabled']).toBe(false);
    findEl(fixture, 'form').triggerEventHandler('submit', {});

    expect(signupService.signup).toHaveBeenCalledTimes(1);

    localSignupData = { email: 'abcd@hyundai.com', password: '12345Zocika.' };
    setFieldValue(fixture, '#emailFormlyField', localSignupData.email);
    setFieldValue(fixture, '#passwordFormlyField', localSignupData.password);
    signupService.isEmailTaken.and.returnValue(of(true));
    tick(400);
    fixture.detectChanges();
    let validationMessage = findComponent(fixture, '.invalid-feedback').nativeElement.innerText;
    expect(validationMessage).toContain('This email is already taken.');
    expect(findEl(fixture, '#submitButton').properties['disabled']).toBe(true);
    findEl(fixture, 'form').triggerEventHandler('submit', {});
    expect(signupService.signup).toHaveBeenCalledTimes(1);

    discardPeriodicTasks()
  }));

  it('does not submit an invalid form - weak password', fakeAsync(async () => {
    await setup();

    let localSignupData = { email: 'abcd@hyundai.com', password: '1234' };
    setFieldValue(fixture, '#emailFormlyField', localSignupData.email);
    setFieldValue(fixture, '#passwordFormlyField', localSignupData.password);
    signupService.getPasswordStrength.and.returnValue(of(weakPassword));
    tick(400);
    fixture.detectChanges();
    expect(findEl(fixture, '#submitButton').properties['disabled']).toBe(true);
    findEl(fixture, 'form').triggerEventHandler('submit', {});

    expect(signupService.signup).toHaveBeenCalledTimes(0);

    discardPeriodicTasks()
  }));






  it('does not submit an invalid form', fakeAsync(async () => {
    // await setup();

    // Wait for async validators
    // tick(1000);

    // findEl(fixture, 'form').triggerEventHandler('submit', {});

    // expect(signupService.isEmailTaken).not.toHaveBeenCalled();
    // expect(signupService.getPasswordStrength).not.toHaveBeenCalled();
    // expect(signupService.signup).not.toHaveBeenCalled();
  }));

  it('handles signup failure', fakeAsync(async () => {
    // await setup({
    //   // Let the API report a failure
    //   signup: throwError(new Error('Validation failed')),
    // });

    // fillForm();

    // // Wait for async validators
    // tick(1000);

    // findEl(fixture, 'form').triggerEventHandler('submit', {});
    // fixture.detectChanges();

    // expectText(fixture, 'status', 'Sign-up error');

    // expect(signupService.getPasswordStrength).toHaveBeenCalledWith(password);
    // expect(signupService.signup).toHaveBeenCalledWith(signupData);
  }));


});
