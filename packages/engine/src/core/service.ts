import { isEmpty } from 'lodash';
import { EnvironmentStack, CloudService } from 'interfaces';
import { ServiceAttributes, ServiceAssociation, ServiceTypeChoice, ProviderChoice, ServiceAssociationDeclarations } from 'types';

abstract class Service implements CloudService {
  abstract readonly type: ServiceTypeChoice;

  abstract readonly provider: ProviderChoice;

  public name: string;

  public associations: ServiceAssociationDeclarations = [];

  public attributes: ServiceAttributes;

  protected readonly stack: EnvironmentStack;

  constructor(name: string, attributes: ServiceAttributes, stack: EnvironmentStack) {
    this.name = name;
    this.attributes = attributes;
    this.stack = stack;

    this.validate();
  }

  abstract requires(): Array<ServiceAssociation>;

  abstract provision(): void;

  associate(associations: Array<CloudService>): void {
    if (isEmpty(associations)) {
      return;
    }

    this.requires().forEach(({ lookup, onRegister }) => {
      const matching = associations.filter(srv => srv instanceof lookup);

      if (matching) {
        onRegister.call(this, matching);
      }
    });
  }

  validate(): void {
  }
}
export default Service;
