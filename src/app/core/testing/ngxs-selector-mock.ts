import { BehaviorSubject } from 'rxjs';

export class NgxsSelectorMock<ClassType> {
  defineNgxsSelector<ProducerType>(obj: ClassType, variable: string, value: ProducerType = null): BehaviorSubject<ProducerType> {
    if (!variable || variable.trim().length === 0) {
      return null;
    }
    Object.defineProperty(obj, variable, { writable: true });
    const producer = new BehaviorSubject<ProducerType>(value);
    obj[variable] = producer;
    return producer;
  }
}
