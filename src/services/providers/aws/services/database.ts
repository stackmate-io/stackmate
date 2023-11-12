import pipe from 'lodash/fp/pipe'
import { kebabCase } from 'lodash'
import { TerraformOutput } from 'cdktf'
import { dbInstance as rdsDbInstance, dbParameterGroup, dbSubnetGroup } from '@cdktf/provider-aws'
import { SERVICE_TYPE, DEFAULT_PORT } from '@src/constants'
import { awsDatabaseAlarms } from '@aws/alerts/database'
import { getProfile } from '@services/utils'
import { getAwsService } from '@aws/utils/getAwsService'
import * as AWS from '@aws/constants'
import * as behavior from '@services/behaviors'
import { onServiceLinked } from '@aws/utils/onServiceLinked'
import { onExternalLink } from '@aws/utils/onExternalLink'
import { withAwsAlerts } from '@aws/utils/withAlerts'
import type { Stack } from '@lib/stack'
import type { ChoiceOf, OneOfType } from '@lib/util'
import type { PROVIDER } from '@src/constants'
import type { BaseServiceAttributes, Provisionable, ServiceTypeChoice } from '@services/types'
import type { AwsService } from '@aws/types'
import type { RdsEngine, REGIONS } from '@aws/constants'

type DatabaseAttributes = BaseServiceAttributes &
  behavior.SizeableAttributes &
  behavior.VersioningAttributes &
  behavior.LinkableAttributes &
  behavior.ExternallyLinkableAttributes &
  behavior.MultiNodeAttributes &
  behavior.StorableAttributes &
  behavior.ConnectableAttributes &
  behavior.ProfilableAttributes &
  behavior.RegionalAttributes<ChoiceOf<typeof REGIONS>> &
  behavior.EngineAttributes<RdsEngine> &
  behavior.MonitoringAttributes & {
    provider: typeof PROVIDER.AWS
    database: string
  }

export type AwsDatabaseResources = {
  dbInstance: rdsDbInstance.DbInstance
  paramGroup: dbParameterGroup.DbParameterGroup
  subnetGroup: dbSubnetGroup.DbSubnetGroup
  outputs: TerraformOutput[]
}

export type AwsDatabaseAttributes<
  T extends ServiceTypeChoice,
  E extends RdsEngine,
> = DatabaseAttributes & behavior.EngineAttributes<E> & { type: T }

export type AwsMySQLAttributes = AwsDatabaseAttributes<'mysql', 'mysql'>
export type AwsPostgreSQLAttributes = AwsDatabaseAttributes<'postgresql', 'postgres'>
export type AwsMariaDBAttributes = AwsDatabaseAttributes<'mariadb', 'mariadb'>

type AwsDbService<Attrs extends DatabaseAttributes> = AwsService<
  Attrs,
  behavior.RootCredentialsAssociations
>

export type AwsMySQLService = AwsDbService<AwsMySQLAttributes>
export type AwsPostgreSQLService = AwsDbService<AwsPostgreSQLAttributes>
export type AwsMariaDBService = AwsDbService<AwsMariaDBAttributes>

type AwsDb = OneOfType<[AwsMySQLService, AwsPostgreSQLService, AwsMariaDBService]>

export type AwsDatabaseProvisionable = Provisionable<AwsDb, AwsDatabaseResources>

/**
 * @param {DatabaseAttributes} config the service's configuration
 * @returns {String} the parameter group family to use when provisioning the database
 */
export const getParamGroupFamily = (config: DatabaseAttributes): string => {
  const triad = AWS.RDS_PARAM_FAMILY_MAPPING.find(
    ([engine, version]) => engine === config.engine && config.version.startsWith(version),
  )

  if (!triad) {
    throw new Error(
      `We couldn’t determine the parameter group family for engine ${config.engine} version ${config.version}`,
    )
  }

  return triad[2]
}

/**
 * Provisions the database service
 *
 * @param {AwsDatabaseProvisionable} provisionable the service's configuration
 * @param {Stack} stack the stack to deploy
 * @returns {Provisions} the provisions generated
 */
const deployDatabases =
  (provisionable: AwsDatabaseProvisionable, stack: Stack): (() => AwsDatabaseResources) =>
  (): AwsDatabaseResources => {
    const {
      config,
      requirements: { providerInstance, rootCredentials, vpc, subnets },
      resourceId,
    } = provisionable
    const { instance, params } = getProfile(config)
    const dbInstanceName = kebabCase(`${config.name}-${stack.name}`)

    const subnetGroup = new dbSubnetGroup.DbSubnetGroup(
      stack.context,
      `${resourceId}-subnetGroup`,
      {
        subnetIds: subnets.map((subnet) => subnet.id),
        namePrefix: dbInstanceName,
        provider: providerInstance,
      },
    )

    const paramGroup = new dbParameterGroup.DbParameterGroup(
      stack.context,
      `${resourceId}_params`,
      {
        ...params,
        family: getParamGroupFamily(config),
      },
    )

    const dbInstance = new rdsDbInstance.DbInstance(stack.context, resourceId, {
      ...instance,
      allocatedStorage: config.storage,
      applyImmediately: true,
      count: config.nodes,
      enabledCloudwatchLogsExports: AWS.RDS_LOG_EXPORTS_PER_ENGINE[
        config.engine
      ] as unknown as string[],
      engine: config.engine,
      engineVersion: config.version,
      identifier: dbInstanceName,
      instanceClass: config.size,
      dbName: config.database,
      parameterGroupName: paramGroup.name,
      port: config.port,
      provider: providerInstance,
      dbSubnetGroupName: subnetGroup.name,
      username: rootCredentials.username.expression,
      password: rootCredentials.password.expression,
      vpcSecurityGroupIds: [vpc.defaultSecurityGroupId],
      lifecycle: {
        createBeforeDestroy: true,
      },
    })

    const outputs: TerraformOutput[] = [
      new TerraformOutput(stack.context, `${resourceId}_endpoint`, {
        description: `Connection endpoint for "${config.name}" RDS service`,
        value: dbInstance.endpoint,
      }),
      new TerraformOutput(stack.context, `${resourceId}_root_credentials`, {
        description: `Root Credentials`,
        sensitive: true,
        value: {
          username: rootCredentials.username.asString,
          password: rootCredentials.password.asString,
        },
      }),
    ]

    return { dbInstance, paramGroup, subnetGroup, outputs }
  }

/**
 * Provisions the database resources along with monitoring resources
 *
 * @param {AwsDatabaseProvisionable} provisionable the service's configuration
 * @param {Stack} stack the stack to deploy
 * @returns {Provisions} the provisions generated
 */
export const resourceHandler = (
  provisionable: AwsDatabaseProvisionable,
  stack: Stack,
): AwsDatabaseResources =>
  pipe(
    deployDatabases(provisionable, stack),
    withAwsAlerts<AwsDatabaseProvisionable>(provisionable, stack, awsDatabaseAlarms),
  )()

/**
 * @param {ServiceTypeChoice} type the type of service to instantiate
 * @param {RdsEngine} engine the RDS engine to use
 * @returns {AwsDatabaseService<DatabaseAttributes>} the database service
 */
const getDatabaseService = <T extends AWS.AwsDbServiceType, E extends RdsEngine>(
  type: T,
  engine: E,
): AwsDbService<AwsDatabaseAttributes<T, E>> => {
  const defaultPort = DEFAULT_PORT.get(type)
  if (!defaultPort) {
    throw new Error(`There is no default port set for service ${type}`)
  }

  return pipe(
    behavior.withRootCredentials(),
    behavior.withHandler(resourceHandler),
    behavior.linkable(onServiceLinked),
    behavior.externallyLinkable(onExternalLink),
    behavior.monitored(),
    behavior.sizeable('^db\\.[a-z0-9]+\\.[a-z0-9]+$', AWS.DEFAULT_RDS_INSTANCE_SIZE),
    behavior.versioned(
      AWS.RDS_MAJOR_VERSIONS_PER_ENGINE[engine],
      AWS.RDS_DEFAULT_VERSIONS_PER_ENGINE[engine],
    ),
    behavior.connectable(defaultPort),
    behavior.storable(),
    behavior.withEngine<typeof engine>(engine),
    behavior.multiNode(),
    behavior.profileable(),
    behavior.withDatabase(),
  )(getAwsService(type))
}

export const AWSMySQL: AwsMySQLService = getDatabaseService(SERVICE_TYPE.MYSQL, 'mysql')
export const AWSMariaDB: AwsMariaDBService = getDatabaseService(SERVICE_TYPE.MARIADB, 'mariadb')
export const AWSPostgreSQL: AwsPostgreSQLService = getDatabaseService(
  SERVICE_TYPE.POSTGRESQL,
  'postgres',
)
