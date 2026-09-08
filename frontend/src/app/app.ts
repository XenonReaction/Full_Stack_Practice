import { Component } from '@angular/core';
import { GuestbookComponent } from './guestbook/guestbook.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GuestbookComponent],
  template: '<app-guestbook />',
})
export class App {}