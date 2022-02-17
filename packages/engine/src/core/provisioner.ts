import App from '@stackmate/lib/terraform/app';
import { CloudApp, CloudService, CloudStack } from '@stackmate/interfaces';

class Provisioner {
  /**
   * @var {CloudApp} app the terraform application to deploy
   */
  protected readonly app: CloudApp;

  /**
   * @var {CloudStack} stack the stack to deploy
   */
  protected readonly stack: CloudStack;

  /**
   * @constructor
   * @param {String} appName the application's name
   * @param {String} stackName the stack's name
   */
  constructor(appName: string, stageName: string) {
    this.app = new App(appName);
    this.stack = this.app.stack(stageName);
  }

  add(service: CloudService) {

  }

  process() {}
}

export default Provisioner;
