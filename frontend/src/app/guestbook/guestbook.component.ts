import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Message } from '../core/message.model';
import { MessageService } from '../core/message.service';

@Component({
  selector: 'app-guestbook',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './guestbook.component.html',
  styleUrl: './guestbook.component.css',
})
export class GuestbookComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(MessageService);

  messages = signal<Message[]>([]);
  submitting = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    message: ['', [Validators.required, Validators.maxLength(2000)]],
    passcode: ['', Validators.required],
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.service.list().subscribe({
      next: (msgs) => this.messages.set(msgs),
      error: () => this.error.set('Could not load messages.'),
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(null);
    this.success.set(false);

    this.service.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.success.set(true);
        this.form.reset();
        this.submitting.set(false);
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        if (err.status === 403) {
          this.error.set('Wrong passcode.');
        } else if (err.status === 400) {
          this.error.set('Please fill in name and message.');
        } else {
          this.error.set('Something went wrong. Try again.');
        }
      },
    });
  }
}