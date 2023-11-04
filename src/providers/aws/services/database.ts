import pipe from 'lodash/fp/pipe'
import { kebabCase } from 'lodash'
import { TerraformOutput } from 'cdktf'
import { dbInstance as rdsDbInstance, dbParameterGroup } from '@cdktf/provider-aws'
import { SERVICE_TYPE } from '@constants'
import { DEFAULT_PORT } from '@core/services/constants'
import { withRootCredentials } from '@core/service/credentials'
import { awsDatabaseAlarms } from '@providers/aws/alarms/database'
import { getResourcesProfile } from '@core/profile'
import {
  getAwsService,
  onExternalLink,
  onServiceLinked,
  withAwsAlarms,
} from '@providers/aws/service'
import {
  DEFAULT_RDS_INSTANCE_SIZE,
  RDS_DEFAULT_VERSIONS_PER_ENGINE,
  RDS_INSTANCE_SIZES,
  RDS_LOG_EXPORTS_PER_ENGINE,
  RDS_MAJOR_VERSIONS_PER_ENGINE,
  RDS_PARAM_FAMILY_MAPPING,
} from '@providers/aws/constants'
import {
  multiNode,
  profilable,
  sizeable,
  storable,
  versioned,
  withDatabase,
  withEngine,
  withHandler,
  connectable,
  linkable,
  externallyLinkable,
  monitored,
} from '@core/service'
import type { Stack } from '@lib/stack'
import type { ChoiceOf, OneOfType } from '@lib/util'
import type { DatabaseServiceAttributes } from '@providers/types'
import type { PROVIDER } from '@constants'
import type { RootCredentialsAssociations } from '@core/service/credentials'
import type { Provisionable } from '@core/provision'
import type { AwsService } from '@providers/aws/service'
import type { RdsEngine, REGIONS } from '@providers/aws/constants'
import type { ServiceTypeChoice } from '@services/types'
import type { EngineAttributes, RegionalAttributes, MonitoringAttributes } from '@core/service'

type DatabaseAttributes = DatabaseServiceAttributes &
  RegionalAttributes<ChoiceOf<typeof REGIONS>> &
  EngineAttributes<RdsEngine> &
  MonitoringAttributes & {
    provider: typeof PROVIDER.AWS
  }

export type AwsDatabaseResources = {
  dbInstance: rdsDbInstance.DbInstance
  paramGroup: dbParameterGroup.DbParameterGroup
  outputs: TerraformOutput[]
}

export type AwsDatabaseAttributes<
  T extends ServiceTypeChoice,
  E extends RdsEngine,
> = DatabaseAttributes & EngineAttributes<E> & { type: T }

export type AwsMySQLAttributes = AwsDatabaseAttributes<'mysql', 'mysql'>
export type AwsPostgreSQLAttributes = AwsDatabaseAttributes<'postgresql', 'postgres'>
export type AwsMariaDBAttributes = AwsDatabaseAttributes<'mariadb', 'mariadb'>

type AwsDbService<Attrs extends DatabaseAttributes> = AwsService<Attrs, RootCredentialsAssociations>

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
  const triad = RDS_PARAM_FAMILY_MAPPING.find(
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
      requirements: { providerInstance, rootCredentials },
    } = provisionable
    const { instance, params } = getResourcesProfile(config)

    const paramGroup = new dbParameterGroup.DbParameterGroup(
      stack.context,
      `${provisionable.resourceId}-params`,
      {
        ...params,
        family: getParamGroupFamily(config),
      },
    )

    const dbInstance = new rdsDbInstance.DbInstance(stack.context, config.name, {
      ...instance,
      allocatedStorage: config.storage,
      applyImmediately: true,
      count: config.nodes,
      enabledCloudwatchLogsExports: RDS_LOG_EXPORTS_PER_ENGINE[
        config.engine
      ] as unknown as string[],
      engine: config.engine,
      engineVersion: config.version,
      identifier: kebabCase(`${config.name}-${stack.name}`),
      instanceClass: config.size,
      dbName: config.database,
      parameterGroupName: paramGroup.name,
      port: config.port,
      provider: providerInstance,
      dbSubnetGroupName: `db-subnet-${provisionable.resourceId}`,
      username: rootCredentials.username.expression,
      password: rootCredentials.password.expression,
      lifecycle: {
        createBeforeDestroy: true,
      },
    })

    const outputs: TerraformOutput[] = [
      new TerraformOutput(stack.context, `${config.name}-endpoint-output`, {
        description: `Connection endpoint for "${config.name}" RDS service`,
        value: dbInstance.endpoint,
      }),
    ]

    return { dbInstance, paramGroup, outputs }
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
    withAwsAlarms<AwsDatabaseProvisionable>(provisionable, stack, awsDatabaseAlarms),
  )()

/**
 * @param {ServiceTypeChoice} type the type of service to instantiate
 * @param {RdsEngine} engine the RDS engine to use
 * @returns {AwsDatabaseService<DatabaseAttributes>} the database service
 */
export const getDatabaseService = <T extends ServiceTypeChoice, E extends RdsEngine>(
  type: T,
  engine: E,
): AwsDbService<AwsDatabaseAttributes<T, E>> => {
  const defaultPort = DEFAULT_PORT.get(type)
  if (!defaultPort) {
    throw new Error(`There is no default port set for service ${type}`)
  }

  return pipe(
    withRootCredentials(),
    withHandler(resourceHandler),
    linkable(onServiceLinked),
    externallyLinkable(onExternalLink),
    monitored(),
    sizeable(RDS_INSTANCE_SIZES, DEFAULT_RDS_INSTANCE_SIZE),
    versioned(RDS_MAJOR_VERSIONS_PER_ENGINE[engine], RDS_DEFAULT_VERSIONS_PER_ENGINE[engine]),
    connectable(defaultPort),
    storable(),
    withEngine(engine),
    multiNode(),
    profilable(),
    withDatabase(),
  )(getAwsService(type))
}

export const AWSMySQL: AwsMySQLService = getDatabaseService(SERVICE_TYPE.MYSQL, 'mysql')
export const AWSMariaDB: AwsMariaDBService = getDatabaseService(SERVICE_TYPE.MARIADB, 'mariadb')
export const AWSPostgreSQL: AwsPostgreSQLService = getDatabaseService(
  SERVICE_TYPE.POSTGRESQL,
  'postgres',
)
