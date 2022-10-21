import pipe from '@bitty/pipe';
import { dataAwsIamPolicyDocument, snsTopic, snsTopicPolicy } from '@cdktf/provider-aws';

import { Stack } from '@stackmate/engine/core/stack';
import { ServiceSchema } from '@stackmate/engine/core/schema';
import { SERVICE_TYPE } from '@stackmate/engine/constants';
import { DEFAULT_REGION, REGIONS } from '@stackmate/engine/providers/aws/constants';
import { AwsService, AwsServiceAttributes, getAwsCoreService } from '@stackmate/engine/providers/aws/service';
import {
  BaseServiceAttributes, Provisionable, ServiceTypeChoice,
  withHandler, withRegions, withSchema, withContext,
} from '@stackmate/engine/core/service';

type AdditionalAttrs = { email: string };

export type AwsMonitoringAttributes = AwsServiceAttributes<
  BaseServiceAttributes & AdditionalAttrs & { type: typeof SERVICE_TYPE.MONITORING; }
>;

export type AwsMonitoringService = AwsService<AwsMonitoringAttributes>;

export type AwsMonitoringDeployableResources = {
  document: dataAwsIamPolicyDocument.DataAwsIamPolicyDocument;
  topic: snsTopic.SnsTopic;
  policy: snsTopicPolicy.SnsTopicPolicy;
};

export type AwsMonitoringDeployableProvisionable = Provisionable<
  AwsMonitoringService, AwsMonitoringDeployableResources, 'deployable', {
    serviceTypes: ServiceTypeChoice[],
  }
>;

const serviceIdentifiersPerType: Map<ServiceTypeChoice, string> = new Map([
  [SERVICE_TYPE.MYSQL, 'rds.amazonaws.com'],
]);

export const onDeploy = (
  provisionable: AwsMonitoringDeployableProvisionable, stack: Stack,
): AwsMonitoringDeployableResources => {
  const topicId = `alerts-${stack.stageName}`;
  const { requirements: { providerInstance, account }, context: { serviceTypes } } = provisionable;

  const topic = new snsTopic.SnsTopic(stack.context, topicId, {
    name: topicId,
    provider: providerInstance,
  });

  // Extract the AWS identifiers to use
  const identifiers: string[] = [];
  serviceTypes.forEach((type) => {
    const identifier = serviceIdentifiersPerType.get(type);

    if (identifier) {
      identifiers.push(type);
    }
  });

  const document = new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
    stack.context, `sns-${topicId}-policy-document`, {
      dependsOn: [topic],
      statement: [{
        // Allow the account owner to manage SNS
        sid: 'AllowManageSNS',
        actions: [
          'SNS:Subscribe',
          'SNS:SetTopicAttributes',
          'SNS:RemovePermission',
          'SNS:Receive',
          'SNS:Publish',
          'SNS:ListSubscriptionsByTopic',
          'SNS:GetTopicAttributes',
          'SNS:DeleteTopic',
          'SNS:AddPermission',
        ],
        effect: 'Allow',
        resources: [topic.arn],
        principals: [{
          type: 'AWS',
          identifiers: ['*'],
        }],
        condition: [{
          test: 'StringEquals',
          variable: 'AWS:SourceOwner',
          values: [account.accountId],
        }],
      }, {
        sid: 'Allow Service Events',
        actions: ['sns:Publish'],
        resources: [topic.arn],
        principals: [{
          type: 'Service',
          identifiers: ['events.amazonaws.com', ...identifiers],
        }],
      }],
    },
  );

  const policy = new snsTopicPolicy.SnsTopicPolicy(stack.context, `${topicId}-policy`, {
    arn: topic.arn,
    policy: document.json,
    dependsOn: [document],
  });

  return { topic, policy, document };
};

const getEmailSchema = (): ServiceSchema<AdditionalAttrs> => ({
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'The email address to send the alerts to',
    },
  },
});

const contextHandler = (configurations: BaseServiceAttributes[]) => ({
  serviceTypes: configurations.map((cfg) => cfg.type),
});

export const getMonitoringService = (): AwsMonitoringService => (
  pipe(
    withHandler('deployable', onDeploy),
    withRegions(REGIONS, DEFAULT_REGION),
    withContext(contextHandler),
    withSchema<AwsMonitoringAttributes, AdditionalAttrs>(getEmailSchema()),
  )(getAwsCoreService(SERVICE_TYPE.MONITORING))
);

export const AwsMonitoring = getMonitoringService();
