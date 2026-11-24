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

  getTopicDetail(name: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/topics/${encodeURIComponent(name)}`);
  }

  createTopic(payload: CreateKafkaTopicRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/topics`, payload);
  }

  updateTopicConfig(name: string, configs: Record<string, string>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/topics/${encodeURIComponent(name)}/config`, configs);
  }

  deleteTopic(name: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/topics/${encodeURIComponent(name)}`);
  }
}