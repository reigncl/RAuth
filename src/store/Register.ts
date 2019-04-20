import { StrictSessionRegister } from '../session/Session';

export interface Register extends StrictSessionRegister {
  [prop: string]: any;
}
