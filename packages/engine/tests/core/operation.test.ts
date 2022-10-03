import { isEmpty } from 'lodash';
import { KmsKey } from '@cdktf/provider-aws/lib/kms';
import { LocalProvider as TerraformLocalProvider } from '@cdktf/provider-local';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3';
import { LocalBackend, S3Backend, TerraformStack } from 'cdktf';
import { InternetGateway, Subnet, Vpc } from '@cdktf/provider-aws/lib/vpc';
import { AwsProvider as TerraformAwsProvider } from '@cdktf/provider-aws';
import { DbInstance, DbParameterGroup } from '@cdktf/provider-aws/lib/rds';

import { validateProject } from '@stackmate/engine/core/validation';
import { LocalStateResources } from '@stackmate/engine/providers/local/services/state';
import { ProjectConfiguration } from '@stackmate/engine/core/project';
import { LocalProviderResources } from '@stackmate/engine/providers/local/services/provider';
import { PROVIDER, SERVICE_TYPE } from '@stackmate/engine/constants';
import { deployment, destruction, Operation, setup } from '@stackmate/engine/core/operation';
import { Provisionable, Provisions, ServiceTypeChoice } from '@stackmate/engine/core/service';
import { AwsDatabaseDeployableResources } from '@stackmate/engine/providers/aws/services/database';
import { AwsProviderDeployableResources } from '@stackmate/engine/providers/aws/services/provider';
import { AwsStateDeployableResources, AwsStatePreparableResources } from '@stackmate/engine/providers/aws/services/state';

describe('Operation', () => {
  let operation: Operation;
  let provisionables: Provisionable[];

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

  const getProvisions = (provs: Provisionable[], lookup: ServiceTypeChoice | ((p: Provisionable) => boolean)): Provisions => {
    const finder = typeof lookup === 'function'
      ? lookup
      : ((p: Provisionable) => p.service.type === lookup);

    const serviceProvisionables = provs.find(finder)
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

      expect(provider).toBeInstanceOf(TerraformAwsProvider);
      expect(gateway).toBeInstanceOf(InternetGateway);
      expect(kmsKey).toBeInstanceOf(KmsKey);
      expect(Array.isArray(subnets)).toBe(true);
      expect(subnets.every(s => s instanceof Subnet)).toBe(true);
      expect(vpc).toBeInstanceOf(Vpc);
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
      expect(dbInstance).toBeInstanceOf(DbInstance);
      expect(paramGroup).toBeInstanceOf(DbParameterGroup);
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
      expect(provider).toBeInstanceOf(TerraformAwsProvider);
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
      const lookup = (p: Provisionable) => (
        p.service.type === SERVICE_TYPE.PROVIDER && p.service.provider === PROVIDER.AWS
      );

      const provisions = getProvisions(provisionables, lookup);
      expect(isEmpty(provisions)).toBe(false);
      expect(new Set(Object.keys(provisions))).toEqual(new Set(['provider', 'kmsKey']));

      const { provider } = provisions as AwsProviderDeployableResources;
      expect(provider).toBeInstanceOf(TerraformAwsProvider);
    });

    it('registers the Local provider', () => {
      const lookup = (p: Provisionable) => (
        p.service.type === SERVICE_TYPE.PROVIDER && p.service.provider === PROVIDER.LOCAL
      );

      const provisions = getProvisions(provisionables, lookup);
      expect(isEmpty(provisions)).toBe(false);
      expect(new Set(Object.keys(provisions))).toEqual(new Set(['provider']));

      const { provider } = provisions as LocalProviderResources;
      expect(provider).toBeInstanceOf(TerraformLocalProvider);
    });

    it('registers the Local state resources', () => {
      const lookup = (p: Provisionable) => (
        p.service.type === SERVICE_TYPE.STATE && p.service.provider === PROVIDER.LOCAL
      );

      const provisions = getProvisions(provisionables, lookup);
      expect(isEmpty(provisions)).toBe(false);
      expect(new Set(Object.keys(provisions))).toEqual(new Set(['backend']));

      const { backend } = provisions as LocalStateResources;
      expect(backend).toBeInstanceOf(LocalBackend);
    });

    it('registers the AWS State provider resources (that are to be created)', () => {
      const lookup = (p: Provisionable) => (
        p.service.type === SERVICE_TYPE.STATE && p.service.provider === PROVIDER.AWS
      );

      const provisions = getProvisions(provisionables, lookup);
      expect(isEmpty(provisions)).toBe(false);
      expect(new Set(Object.keys(provisions))).toEqual(new Set(['bucket']));

      const { bucket } = provisions as AwsStatePreparableResources;
      expect(bucket).toBeInstanceOf(S3Bucket);
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
});
