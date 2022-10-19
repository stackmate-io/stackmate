import { isEmpty } from 'lodash';
import { LocalBackend, S3Backend, TerraformStack } from 'cdktf';
import { kmsKey as awsKmsKey } from '@cdktf/provider-aws';
import { provider as localProvider } from '@cdktf/provider-local';
import {
  provider as awsProvider,
  s3Bucket,
  internetGateway as awsInternetGateway,
  subnet as awsSubnet,
  vpc as awsVpc,
  dbInstance as awsDbInstance,
  dbParameterGroup,
} from '@cdktf/provider-aws';

import { validateProject } from '@stackmate/engine/core/validation';
import { LocalStateResources } from '@stackmate/engine/providers/local/services/state';
import { ProjectConfiguration } from '@stackmate/engine/core/project';
import { LocalProviderResources } from '@stackmate/engine/providers/local/services/provider';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { BaseProvisionable, Provisions, ServiceTypeChoice } from '@stackmate/engine/core/service';
import { AwsDatabaseDeployableResources } from '@stackmate/engine/providers/aws/services/database';
import { AwsProviderDeployableResources } from '@stackmate/engine/providers/aws/services/provider';
import { AwsStateDeployableResources, AwsStatePreparableResources } from '@stackmate/engine/providers/aws/services/state';
import { deployment, destruction, getOperationByName, Operation, OPERATION_TYPE, setup } from '@stackmate/engine/core/operation';

describe('Operation', () => {
  let operation: Operation;
  let provisionables: BaseProvisionable[];

  const config: ProjectConfiguration = {
    name: 'my-super-project',
    provider: 'aws',
    region: 'eu-central-1',
    state: {
      provider: 'aws',
      bucket: 'aws-s3-bucket',
    },
    stages: [{
      name: 'production',
      services: [{
        name: 'database-service',
        type: 'mysql',
      }],
    }],
  };

  const project = validateProject(config);

  const getProvisions = (
    provs: BaseProvisionable[], lookup: ServiceTypeChoice | ((p: BaseProvisionable) => boolean),
  ): Provisions => {
    const finder = typeof lookup === 'function'
      ? lookup
      : ((p: BaseProvisionable) => p.service.type === lookup);

    const serviceProvisionables = provs.find(finder);
    expect(serviceProvisionables).not.toBeUndefined();
    expect(serviceProvisionables?.provisions).toBeInstanceOf(Object);
    return serviceProvisionables?.provisions || {};
  };

  describe('deployment operation', () => {
    beforeAll(() => {
      operation = deployment(project, 'production');
      provisionables = Array.from(operation.provisionables.values());
      operation.process();
    });

    it('is populates the stack properly', () => {
      expect(operation.stack).not.toBeUndefined();
      expect(operation.stack.projectName).toEqual(project.name);
      expect(operation.stack.stageName).toEqual('production');
      expect(operation.stack.context).toBeInstanceOf(TerraformStack)
    });

    it('populates the provisionables', () => {
      // Provisionables should be provider + state + secerets + database = 4
      expect(provisionables).toHaveLength(4);
      expect(new Set(provisionables.map(p => p.service.type))).toEqual(new Set([
        SERVICE_TYPE.PROVIDER,
        SERVICE_TYPE.STATE,
        SERVICE_TYPE.SECRETS,
        SERVICE_TYPE.MYSQL,
      ]));
    });

    it('registers the AWS provider resources', () => {
      const provisions = getProvisions(provisionables, SERVICE_TYPE.PROVIDER);
      expect(isEmpty(provisions)).toBe(false);
      expect(new Set(Object.keys(provisions))).toEqual(new Set([
        'provider', 'gateway', 'kmsKey', 'subnets', 'vpc',
      ]));

      const {
        provider, gateway, kmsKey, subnets, vpc,
      } = provisions as AwsProviderDeployableResources;

      expect(provider).toBeInstanceOf(awsProvider.AwsProvider);
      expect(gateway).toBeInstanceOf(awsInternetGateway.InternetGateway);
      expect(kmsKey).toBeInstanceOf(awsKmsKey.KmsKey);
      expect(Array.isArray(subnets)).toBe(true);
      expect(vpc).toBeInstanceOf(awsVpc.Vpc);
      expect(subnets.every(s => s instanceof awsSubnet.Subnet)).toBe(true);
    });

    it('registers the AWS State resources', () => {
      const provisions = getProvisions(provisionables, SERVICE_TYPE.STATE);
      expect(isEmpty(provisions)).toBe(false);
      expect(new Set(Object.keys(provisions))).toEqual(new Set(['backend']));

      const { backend } = provisions as AwsStateDeployableResources;
      expect(backend).toBeInstanceOf(S3Backend);
    });

    it('registers the AWS secrets resources', () => {
      const provisions = getProvisions(provisionables, SERVICE_TYPE.SECRETS);
      // no resources are provisioned, we just use the credentials helpers
      expect(isEmpty(provisions)).toBe(true);
    });

    it('registers the database resources and returns the output', () => {
      const provisions = getProvisions(provisionables, SERVICE_TYPE.MYSQL);
      expect(isEmpty(provisions)).toBe(false);
      expect(new Set(Object.keys(provisions))).toEqual(new Set(['dbInstance', 'paramGroup']));

      const { dbInstance, paramGroup } = provisions as AwsDatabaseDeployableResources;
      expect(dbInstance).toBeInstanceOf(awsDbInstance.DbInstance);
      expect(paramGroup).toBeInstanceOf(dbParameterGroup.DbParameterGroup);
    });
  });

  describe('destruction operation', () => {
    beforeEach(() => {
      operation = destruction(project, 'production');
      provisionables = Array.from(operation.provisionables.values());
      operation.process();
    });

    it('registers the AWS provider', () => {
      const provisions = getProvisions(provisionables, SERVICE_TYPE.PROVIDER);
      expect(isEmpty(provisions)).toBe(false);
      expect(new Set(Object.keys(provisions))).toEqual(new Set(['provider', 'kmsKey']));

      const { provider } = provisions as AwsProviderDeployableResources;
      expect(provider).toBeInstanceOf(awsProvider.AwsProvider);
    });

    it('registers the AWS State resources', () => {
      const provisions = getProvisions(provisionables, SERVICE_TYPE.STATE);
      expect(isEmpty(provisions)).toBe(false);
      expect(new Set(Object.keys(provisions))).toEqual(new Set(['backend']));

      const { backend } = provisions as AwsStateDeployableResources;
      expect(backend).toBeInstanceOf(S3Backend);
    });

    it('does not register any AWS secrets resources', () => {
      const provisions = getProvisions(provisionables, SERVICE_TYPE.SECRETS);
      expect(isEmpty(provisions)).toBe(true);
    });

    it('registers the database resources and returns the output', () => {
      const provisions = getProvisions(provisionables, SERVICE_TYPE.MYSQL);
      expect(isEmpty(provisions)).toBe(true);
    });
  });

  describe('setup operation', () => {
    beforeEach(() => {
      operation = setup(project, 'production');
      provisionables = Array.from(operation.provisionables.values());
      operation.process();
    });

    it('registers the AWS provider', () => {
      const lookup = (p: BaseProvisionable) => (
        p.service.type === SERVICE_TYPE.PROVIDER && p.service.provider === PROVIDER.AWS
      );

      const provisions = getProvisions(provisionables, lookup);
      expect(isEmpty(provisions)).toBe(false);
      expect(new Set(Object.keys(provisions))).toEqual(new Set(['provider', 'kmsKey']));

      const { provider } = provisions as AwsProviderDeployableResources;
      expect(provider).toBeInstanceOf(awsProvider.AwsProvider);
    });

    it('registers the Local provider', () => {
      const lookup = (p: BaseProvisionable) => (
        p.service.type === SERVICE_TYPE.PROVIDER && p.service.provider === PROVIDER.LOCAL
      );

      const provisions = getProvisions(provisionables, lookup);
      expect(isEmpty(provisions)).toBe(false);
      expect(new Set(Object.keys(provisions))).toEqual(new Set(['provider']));

      const { provider } = provisions as LocalProviderResources;
      expect(provider).toBeInstanceOf(localProvider.LocalProvider);
    });

    it('registers the Local state resources', () => {
      const lookup = (p: BaseProvisionable) => (
        p.service.type === SERVICE_TYPE.STATE && p.service.provider === PROVIDER.LOCAL
      );

      const provisions = getProvisions(provisionables, lookup);
      expect(isEmpty(provisions)).toBe(false);
      expect(new Set(Object.keys(provisions))).toEqual(new Set(['backend']));

      const { backend } = provisions as LocalStateResources;
      expect(backend).toBeInstanceOf(LocalBackend);
    });

    it('registers the AWS State provider resources (that are to be created)', () => {
      const lookup = (p: BaseProvisionable) => (
        p.service.type === SERVICE_TYPE.STATE && p.service.provider === PROVIDER.AWS
      );

      const provisions = getProvisions(provisionables, lookup);
      expect(isEmpty(provisions)).toBe(false);
      expect(new Set(Object.keys(provisions))).toEqual(new Set(['bucket']));

      const { bucket } = provisions as AwsStatePreparableResources;
      expect(bucket).toBeInstanceOf(s3Bucket.S3Bucket);
    });

    it('does not register any AWS secrets resources', () => {
      const provisions = getProvisions(provisionables, SERVICE_TYPE.SECRETS);
      expect(isEmpty(provisions)).toBe(true);
    });

    it('registers the database resources and returns the output', () => {
      const provisions = getProvisions(provisionables, SERVICE_TYPE.MYSQL);
      expect(isEmpty(provisions)).toBe(true);
    });
  });

  describe('getOperationByName', () => {
    it('returns a deployment operation', () => {
      const operation = getOperationByName(OPERATION_TYPE.DEPLOYMENT , project, 'production');
      expect(operation).not.toBeUndefined();
      expect(operation.scope).toEqual('deployable');
    });

    it('returns a destruction operation', () => {
      const operation = getOperationByName(OPERATION_TYPE.DESTRUCTION, project, 'production');
      expect(operation).not.toBeUndefined();
      expect(operation.scope).toEqual('destroyable');
    });

    it('returns a setup operation', () => {
      const operation = getOperationByName(OPERATION_TYPE.SETUP, project, 'production');
      expect(operation).not.toBeUndefined();
      expect(operation.scope).toEqual('preparable');
    });
  });
});
