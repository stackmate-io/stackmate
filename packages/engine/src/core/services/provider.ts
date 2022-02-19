import Service from '@stackmate/core/service';
import { SERVICE_TYPE } from '@stackmate/constants';
import { CloudStack } from '@stackmate/interfaces';
import { ServiceTypeChoice } from '@stackmate/types';

abstract class Provider extends Service {
  readonly type: ServiceTypeChoice = SERVICE_TYPE.PROVIDER;

  get isRegistered(): boolean {
    throw new Error('Method not implemented.');
  }

  once(stack: CloudStack): void {
    throw new Error('Method not implemented.');
  }

  provision(stack: CloudStack): void {
    throw new Error('Method not implemented.');
  }
}

export default Provider;
