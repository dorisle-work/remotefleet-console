import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface LogChunkEvent {
  channel: string;
  chunk: string;
}

@Injectable()
export class LogBroadcasterService {
  private readonly subject = new Subject<LogChunkEvent>();

  readonly events$ = this.subject.asObservable();

  emit(channel: string, chunk: string): void {
    this.subject.next({ channel, chunk });
  }
}
