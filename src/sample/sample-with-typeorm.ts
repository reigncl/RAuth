import { BaseEntity, Column, Entity } from 'typeorm';

@Entity()
export class Session extends BaseEntity {
  @Column({ primary: true })
  userId: string;
  @Column({ primary: true })
  sessionId: string;
  @Column({ nullable: true })
  datastr: string;
  @Column({ nullable: true })
  scope: string;
  @Column({ nullable: true })
  createdAt: number;
  @Column({ nullable: true })
  refreshAt: number;
  get data() { return JSON.parse(this.datastr); }
  set data(v) { this.datastr = JSON.stringify(v); }
}

// ---

import '../engines/TypeormEngine';
import { SessionControl } from '../session/SessionControl';
import { ConnectionStore } from '../store/ConnectionStore';

export const sessionControl = new SessionControl({
  connectionStore: new ConnectionStore('Typeorm', {
    entity: Session,
  }),
});
