import Service from '@stackmate/core/service';
import { CloudStack, VaultService } from '@stackmate/interfaces';
import { RegionList, ServiceTypeChoice } from '@stackmate/types';

class State extends Service {
  regions: RegionList;
  type: ServiceTypeChoice;
  provider: 'aws';
  get isRegistered(): boolean {
    throw new Error('Method not implemented.');
  }
  provision(stack: CloudStack, vault: VaultService, providerAlias?: string): void {
    throw new Error('Method not implemented.');
  }
}

export default State;
