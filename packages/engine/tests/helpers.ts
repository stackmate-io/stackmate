import faker from 'faker';
import { Construct } from 'constructs';

import { CloudStack } from '@stackmate/interfaces';

// eslint-disable-next-line import/prefer-default-export
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
