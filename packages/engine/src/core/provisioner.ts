import { CloudManager, CloudStack } from 'interfaces';
import Registry from './registry';

class Provisioner {
  protected registry: Registry;
  protected clouds: CloudManager;
  protected stack: CloudStack;
}

export default Provisioner;
