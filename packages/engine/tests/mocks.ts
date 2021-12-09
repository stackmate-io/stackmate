import Stack from '../src/core/stack';
import { CloudPrerequisites } from '../src/types';
import { CloudStack } from '../src/interfaces';
import { AwsVpcService } from '../src/clouds/aws';
import { awsRegion, stackName, outputPath } from './fixtures';

export const getMockStack = ({ name = stackName } = {}): CloudStack => (
  new Stack(name, outputPath)
);

export const getAwsPrerequisites = ({
  stack = getMockStack(), region = awsRegion,
} = {}): CloudPrerequisites => {
  try {
    return {
      vpc: new AwsVpcService(stack).populate({ name: 'test-vpc', region }),
    };
  } catch (error) {
    console.log(error);
    return {};
  }
};
