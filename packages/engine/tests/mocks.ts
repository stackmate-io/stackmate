import { App as TerraformApp, TerraformStack } from 'cdktf';

import { CloudPrerequisites } from '../src/types';
import { AwsVpcService } from '../src/clouds/aws';

export const awsRegion = 'eu-central-1';

export const app = new TerraformApp({ outdir: '/tmp/stackmate-tests', stackTraces: true });

export const getMockStack = ({ name = 'test-stack' } = {}): TerraformStack => (
  new TerraformStack(app, name)
);

export const getAwsPrerequisites = ({
  stack = getMockStack(), region = awsRegion,
} = {}): CloudPrerequisites => ({
  vpc: new AwsVpcService('test-vpc', stack, { name: 'test-vpc', region }),
});
