import pipe from 'lodash/fp/pipe'
import { camelCase, kebabCase } from 'lodash'
import { TerraformOutput } from 'cdktf'
import { dbInstance as rdsDbInstance, dbParameterGroup, dbSubnetGroup } from '@cdktf/provider-aws'
import { SERVICE_TYPE, DEFAULT_PORT, PROVIDER, DEFAULT_RESOURCE_COMMENT } from '@src/constants'
import { awsDatabaseAlarms } from '@aws/alerts/database'
import { getBaseService, getProfile } from '@services/utils'
import * as AWS from '@aws/constants'
import * as behavior from '@services/behaviors'
import { onServiceLinked } from '@aws/utils/onServiceLinked'
import { onExternalLink } from '@aws/utils/onExternalLink'
import { withAwsAlerts } from '@aws/utils/withAlerts'
import { getProviderAssociations } from '@aws/utils/getProviderAssociations'
import { getNetworkingAssociations } from '@aws/utils/getNetworkingAssociations'
import type {
  RdsEngine,
  AwsDbServiceType,
  AwsNetworkingAssociations,
  AwsProviderAssociations,
} from '@aws/types'
import type { Stack } from '@lib/stack'
import type { OneOfType } from '@lib/util'
import type {
  BaseServiceAttributes,
  Provisionable,
  Service,
  ServiceTypeChoice,
} from '@services/types'

type DatabaseAttributes = BaseServiceAttributes &
  behavior.SizeableAttributes &
  behavior.VersioningAttributes &
  behavior.LinkableAttributes &
  behavior.ExternallyLinkableAttributes &
  behavior.StorableAttributes &
  behavior.ConnectableAttributes &
  behavior.ProfilableAttributes &
  behavior.RegionalAttributes &
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

type AwsDbService<Attrs extends DatabaseAttributes> = Service<
  Attrs,
  AwsProviderAssociations & AwsNetworkingAssociations
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
  const triad = (AWS.CONSTRAINTS[config.type].familyMapping || []).find(
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
const deployDatabases = (
  provisionable: AwsDatabaseProvisionable,
  stack: Stack,
): AwsDatabaseResources => {
  const {
    config,
    requirements: { providerInstance, vpc, subnets, kmsKey },
    resourceId,
  } = provisionable
  const { instance, params } = getProfile(config)
  const dbInstanceName = kebabCase(`${config.name}-${stack.name}`)

  const subnetGroup = new dbSubnetGroup.DbSubnetGroup(stack.context, `${resourceId}_subnet_group`, {
    subnetIds: subnets.map((subnet) => subnet.id),
    namePrefix: dbInstanceName,
    provider: providerInstance,
    description: DEFAULT_RESOURCE_COMMENT,
  })

  const paramGroup = new dbParameterGroup.DbParameterGroup(stack.context, `${resourceId}_params`, {
    ...params,
    family: getParamGroupFamily(config),
    description: DEFAULT_RESOURCE_COMMENT,
    namePrefix: kebabCase(`stackmate-${dbInstanceName}`),
  })

  const dbInstance = new rdsDbInstance.DbInstance(stack.context, resourceId, {
    ...instance,
    allocatedStorage: config.storage,
    applyImmediately: true,
    enabledCloudwatchLogsExports: AWS.RDS_LOG_EXPORTS_PER_ENGINE[config.engine],
    engine: config.engine,
    engineVersion: config.version,
    identifier: dbInstanceName,
    instanceClass: config.size,
    dbName: config.database,
    parameterGroupName: paramGroup.name,
    port: config.port,
    provider: providerInstance,
    dbSubnetGroupName: subnetGroup.name,
    manageMasterUserPassword: true,
    masterUserSecretKmsKeyId: kmsKey.id,
    username: camelCase(`stackmate-${config.name}-root`),
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
    new TerraformOutput(stack.context, `${resourceId}_secret`, {
      description: 'Database master password in secrets manager',
      sensitive: true,
      value: dbInstance.masterUserSecret.get(0).fqn,
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
    () => deployDatabases(provisionable, stack),
    withAwsAlerts<AwsDatabaseProvisionable>(provisionable, stack, awsDatabaseAlarms),
  )()

/**
 * @param {ServiceTypeChoice} type the type of service to instantiate
 * @param {RdsEngine} engine the RDS engine to use
 * @returns {AwsDatabaseService<DatabaseAttributes>} the database service
 */
const getDatabaseService = <T extends AwsDbServiceType, E extends RdsEngine>(
  type: T,
  engine: E,
): AwsDbService<AwsDatabaseAttributes<T, E>> => {
  const defaultPort = DEFAULT_PORT.get(type)
  if (!defaultPort) {
    throw new Error(`There is no default port set for service ${type}`)
  }

  const constraints = AWS.CONSTRAINTS[type]
  if (!constraints) {
    throw new Error(`Constraints for service type ${type} not available`)
  }

  return pipe(
    behavior.withHandler(resourceHandler),
    behavior.linkable(onServiceLinked),
    behavior.externallyLinkable(onExternalLink),
    behavior.monitored(),
    behavior.sizeable(constraints.sizes, AWS.DEFAULT_RDS_INSTANCE_SIZE),
    behavior.versioned(constraints.versions, constraints.defaultVersion),
    behavior.withRegions(constraints.regions),
    behavior.connectable(defaultPort),
    behavior.storable(),
    behavior.withEngine<typeof engine>(engine),
    behavior.profileable(),
    behavior.withDatabase(),
    behavior.withAssociations({
      ...getProviderAssociations(),
      ...getNetworkingAssociations(),
    }),
  )(getBaseService(PROVIDER.AWS, type))
}

export const AwsMySQL: AwsMySQLService = getDatabaseService(SERVICE_TYPE.MYSQL, 'mysql')
export const AwsMariaDB: AwsMariaDBService = getDatabaseService(SERVICE_TYPE.MARIADB, 'mariadb')
export const AwsPostgreSQL: AwsPostgreSQLService = getDatabaseService(
  SERVICE_TYPE.POSTGRESQL,
  'postgres',
)
