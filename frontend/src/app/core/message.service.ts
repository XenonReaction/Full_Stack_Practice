import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateMessage, Message } from './message.model';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private http = inject(HttpClient);
  private baseUrl = '/api/messages';

  list(): Observable<Message[]> {
    return this.http.get<Message[]>(this.baseUrl);
  }

  create(payload: CreateMessage): Observable<Message> {
    return this.http.post<Message>(this.baseUrl, payload);
  }
}