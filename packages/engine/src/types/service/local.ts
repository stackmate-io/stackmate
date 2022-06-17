import { PROVIDER } from '@stackmate/engine/constants';
import { JsonSchema } from '@stackmate/engine/types/schema';
import { Attribute, AttributesOf, NonAttributesOf } from '@stackmate/engine/types/entity';
import { BaseCloudService, BaseProviderService, BaseStateService } from '@stackmate/engine/types/service/base';
import { CloudStack } from '../lib';
import { RequireKeys } from '../util';
import { LocalProvider } from '@cdktf/provider-local';

export type LocalServicePrerequisites = {
  provider?: Local.Provider.Type;
};

type LocalService<Srv extends BaseCloudService> = Srv & {
  readonly provider: Attribute<typeof PROVIDER.LOCAL>;
  onPrepare(stack: CloudStack, prerequisites: LocalServicePrerequisites): void;
  onDeploy(stack: CloudStack, prerequisites: LocalServicePrerequisites): void;
  onDestroy(stack: CloudStack, prerequisites: LocalServicePrerequisites): void;
  provisions(stack: CloudStack, prerequisites: LocalServicePrerequisites): void;
};

type LocalBaseService = LocalService<BaseCloudService>;

type LocalProviderService = LocalService<BaseProviderService> & {
  resource: LocalProvider;
};

type LocalStateService = LocalService<BaseStateService> & {
  directory: Attribute<string>;
  get path(): string;
  resources(stack: CloudStack, prerequisites: RequireKeys<LocalServicePrerequisites, 'provider'>): void;
  backend(stack: CloudStack, prerequisites: RequireKeys<LocalServicePrerequisites, 'provider'>): void;
};

export namespace Local {
  export namespace Base {
    export type Attributes = AttributesOf<LocalBaseService>;
    export type Type = Attributes & NonAttributesOf<LocalBaseService>;
    export type Schema = JsonSchema<Attributes>;
  }
  export namespace Provider {
    export type Attributes = AttributesOf<LocalProviderService>;
    export type Type = Attributes & NonAttributesOf<LocalProviderService>;
    export type Schema = JsonSchema<Attributes>;
  }
  export namespace State {
    export type Attributes = AttributesOf<LocalStateService>;
    export type Type = Attributes & NonAttributesOf<LocalStateService>;
    export type Schema = JsonSchema<Attributes>;
  }
}
