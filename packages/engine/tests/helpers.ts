import faker from 'faker';
import { Construct } from 'constructs';
import { Testing } from 'cdktf';

import Service from '@stackmate/core/service';
import { CloudStack } from '@stackmate/interfaces';
import { FactoryOf, ProviderChoice } from '@stackmate/types';
import { PROVIDER } from '@stackmate/constants';
import { getAwsPrerequisites } from './mocks';

export const enhanceStack = (stack: Construct, {
  name, targetPath, synthesize,
}: { name?: string, targetPath?: string, synthesize?: Function } = {}): CloudStack => {
  Object.defineProperties(stack, {
    name: {
      value: name || faker.internet.domainWord(),
      writable: false,
    },
    targetPath: {
      value: targetPath || faker.system.directoryPath(),
      writable: false,
    },
    synthesize: {
      value: synthesize || ((): void => {}),
    },
  });

  return stack as CloudStack;
};

/**
 * Provisions a service into the stack and returns the result
 *
 * @param {Object} options
 * @param {ProviderChoice} options.provider the cloud provider (used to get the prerequisites)
 * @param {Service} options.serviceClass the class of the service to provision
 * @param {Object} options.serviceConfig the service's attributes
 * @param {String} options.stackName the name of the mock stack
 * @returns {Promise<Object>}
 */
export const getProvisionResults = async ({
  provider, serviceClass, serviceConfig, stackName = 'production',
}: {
  provider: ProviderChoice;
  serviceClass: FactoryOf<Service>;
  serviceConfig: object;
  stackName: string;
}): Promise<{
  scope: string;
  variables: object;
  [name: string]: any;
}> => {
  let prerequisitesGenerator = ({ stack }: { stack: CloudStack }) => ({});

  if (provider === PROVIDER.AWS) {
    prerequisitesGenerator = getAwsPrerequisites;
  }

  const synthesize = (): Promise<{ [name: string]: any }> => {
    let scope: string;

    const synth = (): Promise<{ [name: string]: any }> => (
      new Promise((resolve) => {
        scope = Testing.synthScope((stack) => {
          const cloudStack = enhanceStack(stack, { name: stackName });

          const service = serviceClass.factory(
            serviceConfig, cloudStack, prerequisitesGenerator({ stack: cloudStack }),
          );

          const { variable: variables, ...terraform } = cloudStack.toTerraform();

          resolve({ service, variables, ...terraform });
        });
      })
    );

    return new Promise(async (wrapperResolve) => {
      const synthResult = await synth();
      return wrapperResolve({ scope, ...synthResult });
    });
  };

  const { scope, service, variables, ...terraform } = await synthesize();
  return { scope, service, variables, ...terraform };
};
