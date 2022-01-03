import sinon from 'sinon';
import { pick } from 'lodash';
import { GetParametersByPathCommandOutput, SSM } from '@aws-sdk/client-ssm';

import { ENVIRONMENT_VARIABLE } from '@stackmate/constants';

export const getAwsParamsStubber = () => {
  let stubbedSSM: sinon.SinonStub;

  const originalEnvVariables = pick(process.env, ...[
    ENVIRONMENT_VARIABLE.AWS_ACCESS_KEY_ID,
    ENVIRONMENT_VARIABLE.AWS_SECRET_ACCESS_KEY,
    ENVIRONMENT_VARIABLE.AWS_SESSION_TOKEN,
  ]);

  const stub = () => {
    // add fake aws credentials to process.env
    Object.assign(process.env, {
      [ENVIRONMENT_VARIABLE.AWS_ACCESS_KEY_ID]: 'abc',
      [ENVIRONMENT_VARIABLE.AWS_SECRET_ACCESS_KEY]: 'def',
      [ENVIRONMENT_VARIABLE.AWS_SESSION_TOKEN]: 'abcdef',
    });

    // stub the SSM client's getParametersByPath function to return expected values
    const mockParams: GetParametersByPathCommandOutput = {
      '$metadata': {},
      NextToken: "string",
      Parameters: [
        {
          "ARN": "string",
          "DataType": "string",
          "LastModifiedDate": new Date(),
          "Name": "string",
          "Selector": "string",
          "SourceResult": "string",
          "Type": "string",
          "Value": "string",
          "Version": 555,
        }
      ]
    };

    stubbedSSM = sinon.stub(SSM.prototype, 'getParametersByPath').resolves(mockParams);
  };

  const restore = () => {
    // Restore the environment variables to its original values
    Object.assign(process.env, originalEnvVariables);
    stubbedSSM.restore();
  };

  return { stub, restore };
};
