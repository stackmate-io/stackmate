import { CloudManager, CloudStack } from '@stackmate/interfaces';
import Registry from '@stackmate/core/registry';

class Provisioner {
  protected registry: Registry;
  protected clouds: CloudManager;
  protected stack: CloudStack;
}

export default Provisioner;
