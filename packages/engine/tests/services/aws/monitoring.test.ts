import { Testing } from 'cdktf';
import {
  cloudwatchMetricAlarm, snsTopic, snsTopicPolicy, dataAwsIamPolicyDocument, dbEventSubscription,
} from '@cdktf/provider-aws';

import { deployment, ProjectConfiguration, PROVIDER, SERVICE_TYPE, validateProject } from '@stackmate/engine';
import { DEFAULT_REGION, REGIONS } from '@stackmate/engine/providers/aws/constants';
import { AwsMonitoring } from '@stackmate/engine/providers/aws/services/monitoring';

describe('AWS Monitoring', () => {
  const service = AwsMonitoring;

  it('is a valid AWS Monitoring service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS);
    expect(service.type).toEqual(SERVICE_TYPE.MONITORING);
  });

  it('has the AWS regions set', () => {
    expect(new Set(service.regions)).toEqual(new Set(REGIONS));
  });

  it('does not have any handler registered', () => {
    expect(service.handlers.size).toBe(0);
  });

  it('provides a valid schema', () => {
    expect(service.schema).toMatchObject({
      type: 'object',
      properties: {
        name: { type: 'string' },
        region: { type: 'string', default: DEFAULT_REGION },
        provider: { type: 'string', default: PROVIDER.AWS, enum: [PROVIDER.AWS] },
        type: { type: 'string', default: SERVICE_TYPE.MONITORING, enum: [SERVICE_TYPE.MONITORING] },
        emails: {
          type: 'array',
          items: {
            type: 'string',
            format: 'email',
          },
        },
      },
    });
  });

  it('associates with database services and creates all the resources required', () => {
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
    const alarmPrefix = 'database_service_production';

    const operation = deployment(project, 'production');
    operation.process();

    const synthesized = Testing.synth(operation.stack.context);

    expect(synthesized).toHaveResourceWithProperties(snsTopic.SnsTopic, {
      name: expect.stringContaining('monitoring_database_service'),
    });

    expect(synthesized).toHaveResourceWithProperties(snsTopicPolicy.SnsTopicPolicy, {});

    expect(synthesized).toHaveDataSourceWithProperties(
      dataAwsIamPolicyDocument.DataAwsIamPolicyDocument, {},
    );

    expect(synthesized).toHaveResourceWithProperties(dbEventSubscription.DbEventSubscription, {
      name: expect.stringContaining(`${alarmPrefix}_event_subscription`),
      source_type: 'db-instance',
      event_categories: [
        'failover', 'failure', 'low storage', 'maintenance', 'notification', 'recovery',
      ],
    });

    expect(synthesized).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_burst_balance`),
      metric_name: 'BurstBalance',
    });

    expect(synthesized).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_cpu_utilization`),
      metric_name: 'CPUUtilization',
    });

    expect(synthesized).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_cpu_credit_balance`),
      metric_name: 'CPUCreditBalance',
    });

    expect(synthesized).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_disk_depth`),
      metric_name: 'DiskQueueDepth',
    });

    expect(synthesized).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_freeable_memory`),
      metric_name: 'FreeableMemory',
    });

    expect(synthesized).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_free_storage`),
      metric_name: 'FreeStorageSpace',
    });

    expect(synthesized).toHaveResourceWithProperties(cloudwatchMetricAlarm.CloudwatchMetricAlarm, {
      alarm_name: expect.stringContaining(`${alarmPrefix}_swap_usage`),
      metric_name: 'SwapUsage',
    });
  });
});
