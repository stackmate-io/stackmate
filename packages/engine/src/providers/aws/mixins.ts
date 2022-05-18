import { PROVIDER } from '@stackmate/engine/constants';
import { AWS_REGIONS, AWS_DEFAULT_REGION } from '@stackmate/engine/providers/aws/constants';
import { AbstractConstructorOf, AwsServiceSchema, AwsServiceWrapped, BaseServiceSchema, CloudService, CloudServiceConstructor, ConstructorOf, JsonSchema, PartialJsonSchema, ProviderChoice, RegionList } from '@stackmate/engine/types';
import { Provider as AwsProvider } from '@stackmate/engine/providers/aws';
import { mergeJsonSchemas } from '@stackmate/engine/lib/helpers';
import Service from '@stackmate/engine/core/service';

type BaseServiceC<Schema extends BaseServiceSchema> = AbstractConstructorOf & {
  schema(): JsonSchema<Schema>;
}

const AwsService = <Schema extends BaseServiceSchema>(
  Base: BaseServiceC<Schema>,
  regions: RegionList = AWS_REGIONS,
) => {
  abstract class AwsServiceWrapper extends Base {
    /**
     * @var {String} provider the cloud provider used (eg. AWS)
     * @readonly
     */
    readonly provider: ProviderChoice = PROVIDER.AWS;

    /**
     * @var {ProviderService} cloudProvider the cloud provider service
     */
    providerService: AwsProvider;

    /**
     * @returns {Object} provides the structure to generate the JSON schema by
     */
    static schema(): JsonSchema<AwsServiceSchema> {
      const regionValues = Object.values(regions);

      return mergeJsonSchemas(super.schema() as JsonSchema<Schema>, {
        properties: {
          provider: {
            type: 'string',
            const: PROVIDER.AWS,
          },
          region: {
            type: 'string',
            enum: regionValues,
            default: AWS_DEFAULT_REGION,
            errorMessage: `The region is invalid. Available options are: ${regionValues.join(', ')}`,
          },
        }
      });
    }
  }

  return AwsServiceWrapper;
};


const AwsMixin = <TBase extends AbstractConstructorOf<Service>>(
  Base: TBase & { schema(): JsonSchema<BaseServiceSchema> },
  regions: RegionList = AWS_REGIONS,
) => {
  abstract class AwsMixin extends Base {
    /**
     * @var {String} provider the cloud provider used (eg. AWS)
     * @readonly
     */
    readonly provider: ProviderChoice = PROVIDER.AWS;

    static schema(): JsonSchema<AwsServiceSchema> {
      const regionValues = Object.values(regions);

      return mergeJsonSchemas<BaseServiceSchema, AwsServiceSchema>(super.schema(), {
        properties: {
          provider: {
            type: 'string',
            const: PROVIDER.AWS,
          },
          region: {
            type: 'string',
            enum: regionValues,
            default: AWS_DEFAULT_REGION,
            errorMessage: `The region is invalid. Available options are: ${regionValues.join(', ')}`,
          },
        }
      });
    }
  }

  return AwsMixin;
}


export default AwsMixin;
