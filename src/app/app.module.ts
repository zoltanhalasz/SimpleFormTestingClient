import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ControlErrorsComponent } from './control-errors/control-errors.component';
import { ErrorMessageDirective } from './error-message/error-message.directive';
import { SubmitFormComponent } from './submit-form/submit-form.component';
import { SignupFormFormlyComponent } from './formly/signup-form-formly/signup-form-formly.component';
import { FormlyBootstrapModule } from '@ngx-formly/bootstrap';
import { FormlyModule } from '@ngx-formly/core';

@NgModule({
  declarations: [
    AppComponent,
    ControlErrorsComponent,
    ErrorMessageDirective,
    SubmitFormComponent,
    SignupFormFormlyComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule, HttpClientModule,
    FormlyModule.forRoot(    ),
    FormlyBootstrapModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
