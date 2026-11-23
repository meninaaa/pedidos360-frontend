import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreateKafkaTopicRequest {
  name: string;
  partitions: number;
  replicationFactor: number;
  retentionMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class KafkaAdminService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/kafka-admin`;

  getTopics(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/topics`);
  }

  createTopic(payload: CreateKafkaTopicRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/topics`, payload);
  }

  deleteTopic(topicName: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/topics/${encodeURIComponent(topicName)}`);
  }
}