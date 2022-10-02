import { isEmpty } from 'lodash';
import { TerraformStack } from 'cdktf';

import { validateProject } from '@stackmate/engine/core/validation';
import { Project } from '@stackmate/engine/core/project';
import { deployment, Operation } from '@stackmate/engine/core/operation';
import { SERVICE_TYPE } from '@stackmate/engine';
import { Provisionable } from '@stackmate/engine/core/service';
import { AwsDatabaseDeployableResources } from '@stackmate/engine/providers/aws/services/database';
import { DbInstance, DbParameterGroup } from '@cdktf/provider-aws/lib/rds';

describe('Operation', () => {
  const project: Project = validateProject({
    name: 'my-super-project',
    provider: 'aws',
    state: {
      provider: 'local',
    },
    region: 'eu-central-1',
    stages: [{
      name: 'production',
      services: [{
        name: 'database-service',
        provider: 'aws',
        type: 'mysql',
      }],
    }],
  });

  describe('generic operation', () => {
    let operation: Operation;

    beforeEach(() => {
      operation = deployment(project, 'production');
    });

    it('is populates the stack properly', () => {
      expect(operation.stack).not.toBeUndefined();
      expect(operation.stack.projectName).toEqual(project.name);
      expect(operation.stack.stageName).toEqual('production');
      expect(operation.stack.context).toBeInstanceOf(TerraformStack)
    });

    it('populates the provisionables', () => {
      // Provisionables should be provider + state + secerets + database = 4
      const provisionables = Array.from(operation.provisionables.values());
      expect(provisionables).toHaveLength(4);
      expect(new Set(provisionables.map(p => p.service.type))).toEqual(new Set([
        SERVICE_TYPE.PROVIDER,
        SERVICE_TYPE.STATE,
        SERVICE_TYPE.SECRETS,
        SERVICE_TYPE.MYSQL,
      ]));
    });
  });

  describe('register', () => {
    let operation: Operation;
    let provisionables: Provisionable[];

    beforeEach(() => {
      operation = deployment(project, 'production');
      provisionables = Array.from(operation.provisionables.values());
    });

    it('registers the resources and returns the output', () => {
      const output = operation.process();
      expect(output).toBeInstanceOf(Object);

      const db = provisionables.find(p => p.service.type === SERVICE_TYPE.MYSQL);
      expect(db).not.toBeUndefined();
      expect(db?.provisions).toBeInstanceOf(Object);
      expect(isEmpty(db?.provisions)).toBe(false);
      const { dbInstance, paramGroup } = db?.provisions as AwsDatabaseDeployableResources;
      expect(dbInstance).toBeInstanceOf(DbInstance);
      expect(paramGroup).toBeInstanceOf(DbParameterGroup);
    });
  });
});
