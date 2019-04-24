import { StrictSessionRegister } from '../session/Session';
import { ConnectionStore } from '../store/ConnectionStore';
import { Engine } from '../store/Engine';
import { Register } from '../store/Register';
import { BaseEntity } from 'typeorm';

declare global {
  interface EngineNames {
    'Typeorm': typeof TypeormEngine;
  }
}

export class TypeormEngine implements Engine {
  entity: typeof BaseEntity;

  constructor({ entity }: { entity?: typeof BaseEntity } = {}) {
    if (!entity) {
      throw new Error('Entity is required');
    }
    this.entity = entity;
  }

  deleteById(sessionId: string): Promise<boolean> {
    return <any>this.entity.delete(<any>{
      sessionId,
    });
  }

  deleteByUserId(userId: string): Promise<boolean> {
    return <any>this.entity.delete(<any>{
      userId,
    });
  }

  async update(register: Register, sets: any): Promise<Register> {
    await this.entity.createQueryBuilder().update().set(sets).execute();

    return this.findById(register.sessionId);
  }

  findById(sessionId: string): Promise<Register> {
    return <any>this.entity.findOne(<any>{
      sessionId,
    });
  }

  findByUserId(userId: string): Promise<Register[]> {
    return <any>this.entity.find(<any>{
      userId,
    });
  }

  async create(sessionRegister: StrictSessionRegister): Promise<Register> {
    const register = Object.assign(new this.entity, sessionRegister);

    await register.save();
    return <any>register;
  }
}

ConnectionStore.add('Typeorm', TypeormEngine);
