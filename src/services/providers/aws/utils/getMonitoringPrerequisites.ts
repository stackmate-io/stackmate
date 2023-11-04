import { isEmpty, snakeCase } from 'lodash'
import {
  snsTopic,
  snsTopicPolicy,
  snsTopicSubscription,
  dataAwsIamPolicyDocument,
} from '@cdktf/provider-aws'
import { SERVICE_TYPE } from '@src/constants'
import { hashString } from '@lib/hash'
import type { Stack } from '@lib/stack'
import type { AwsAlertPrerequisites, MonitoredServiceProvisionable } from '@aws/types'
import type { ServiceTypeChoice } from '@services/types'

export const AWS_SERVICE_INFO: Map<ServiceTypeChoice, { name: string; url: string }> = new Map([
  [SERVICE_TYPE.MYSQL, { name: 'Allow RDS Events', url: 'rds.amazonaws.com' }],
  [SERVICE_TYPE.MARIADB, { name: 'Allow RDS Events', url: 'rds.amazonaws.com' }],
  [SERVICE_TYPE.POSTGRESQL, { name: 'Allow RDS Events', url: 'rds.amazonaws.com' }],
])

export const SNS_RETRY_POLICY = {
  defaultHealthyRetryPolicy: {
    minDelayTarget: 20,
    maxDelayTarget: 20,
    numRetries: 3,
    numMaxDelayRetries: 0,
    numNoDelayRetries: 0,
    numMinDelayRetries: 0,
    backoffFunction: 'linear',
  },
  disableSubscriptionOverrides: false,
  defaultThrottlePolicy: {
    maxReceivesPerSecond: 1,
  },
} as const

/**
 * @param {MonitoredServiceProvisionable} provisionable the current service's provisionable
 * @param {Stack} stack the stack to provision resources on
 * @returns {AwsAlertPrerequisites} the prerequisites for alert generator functions
 */
export const getMonitoringPrerequisites = (
  provisionable: MonitoredServiceProvisionable,
  stack: Stack,
): AwsAlertPrerequisites => {
  const {
    service: { type: targetType },
    config: { name, region, monitoring },
    requirements: { account, providerInstance },
  } = provisionable

  const topicId = `${name}-${region || 'global'}-${stack.name}`
  const topic = new snsTopic.SnsTopic(stack.context, topicId, {
    name: snakeCase(topicId),
    provider: providerInstance,
    deliveryPolicy: JSON.stringify(SNS_RETRY_POLICY),
  })

  const serviceStatements = [
    {
      sid: 'Allow CloudWatch Events',
      actions: ['sns:Publish'],
      resources: [topic.arn],
      principals: [{ type: 'Service', identifiers: ['events.amazonaws.com'] }],
    },
  ]

  const serviceIdentifier = AWS_SERVICE_INFO.get(targetType)
  if (serviceIdentifier) {
    serviceStatements.push({
      sid: serviceIdentifier.name,
      actions: ['sns:Publish'],
      resources: [topic.arn],
      principals: [{ type: 'Service', identifiers: [serviceIdentifier.url] }],
    })
  }

  const document = new dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
    stack.context,
    `sns-${topicId}-policy-document`,
    {
      dependsOn: [topic],
      statement: [
        {
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
          principals: [
            {
              type: 'AWS',
              identifiers: ['*'],
            },
          ],
          condition: [
            {
              test: 'StringEquals',
              variable: 'AWS:SourceOwner',
              values: [account.accountId],
            },
          ],
        },
      ],
    },
  )

  const policy = new snsTopicPolicy.SnsTopicPolicy(stack.context, `${topicId}-policy`, {
    arn: topic.arn,
    policy: document.json,
    dependsOn: [document],
  })

  const subscriptions: snsTopicSubscription.SnsTopicSubscription[] = []

  if (!isEmpty(monitoring.emails)) {
    monitoring.emails.forEach((email) => {
      const hash = hashString(email)

      subscriptions.push(
        new snsTopicSubscription.SnsTopicSubscription(
          stack.context,
          `${topicId}-subscription-email-${hash}`,
          {
            topicArn: topic.arn,
            protocol: 'email',
            endpoint: email,
          },
        ),
      )
    })
  }

  if (!isEmpty(monitoring.urls)) {
    monitoring.urls.forEach((url) => {
      const hash = hashString(url)
      const protocol = url.startsWith('https') ? 'https' : 'http'

      subscriptions.push(
        new snsTopicSubscription.SnsTopicSubscription(
          stack.context,
          `${topicId}-subscription-url-${hash}`,
          {
            topicArn: topic.arn,
            endpoint: url,
            protocol,
          },
        ),
      )
    })
  }

  return { topic, policy, document, subscriptions }
}
