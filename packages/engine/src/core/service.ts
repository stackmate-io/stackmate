import { IStack, IService } from 'interfaces';
import { isEmpty } from 'lodash';
import { ServiceAttributes, ServiceAssociation, ServiceTypeChoice, ProviderChoice, ServiceAssociationDeclarations } from 'types';

abstract class Service implements IService {
  abstract readonly type: ServiceTypeChoice;

  abstract readonly provider: ProviderChoice;

  public name: string;

  public associations: ServiceAssociationDeclarations = [];

  public attributes: ServiceAttributes;

  private _stack: any;

  constructor(name: string, attributes: ServiceAttributes, stack: IStack) {
    this.name = name;
    this.attributes = attributes;
    this._stack = stack;

    this.validate();
  }

  abstract requires(): Array<ServiceAssociation>;

  abstract provision(): void;

  associate(associations: Array<IService>): void {
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
