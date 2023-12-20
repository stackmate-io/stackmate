import fs from 'node:fs'
import path from 'node:path'
import semver from 'semver'
import { readJsonFile, writeJsonFile } from '@src/lib/file'
import { SERVICE_TYPE } from '@src/constants'
import { head, isEmpty, uniq } from 'lodash'
import { execute } from '@src/lib/shell'
import type {
  AwsServiceConstraints,
  ElasticacheEngine,
  RdsEngine,
} from '@src/services/providers/aws/types'

const cache: Record<string, object> = {}

const getContents = (file: string): any => {
  if (!cache[file]) {
    cache[file] = readJsonFile(path.join(__dirname, 'data', file))
  }

  return cache[file]
}

const getDefaultVersion = (versions: string[]): string => {
  const defaultVersion = versions.reduce((prev, curr) => {
    const previous = semver.clean(prev)
    const current = semver.clean(curr)
    return previous && current && semver.gte(current, previous) ? current : previous
  }, '0.0.0')

  return defaultVersion || head(versions) || '0.0.0'
}

type EngineSpec = { Engine: string; EngineVersion: string }

type RdsConstraints = {
  DBEngineVersions: (EngineSpec & {
    DBParameterGroupFamily: string
  })[]
}

type ElasticacheConstraints = {
  CacheEngineVersions: (EngineSpec & {
    CacheParameterGroupFamily: string
  })[]
}

type EngineConstraints = Omit<AwsServiceConstraints[string], 'regions' | 'sizes'>

const getRdsVersionData = (engine: RdsEngine): EngineConstraints => {
  const output: EngineConstraints = { familyMapping: [], versions: [], defaultVersion: '0.0.0' }
  const contents: RdsConstraints = getContents(`rds-engines-${engine}.json`)

  contents.DBEngineVersions.filter((entry) => entry.Engine === engine).forEach((entry) => {
    output.familyMapping.push([engine, entry.EngineVersion, entry.DBParameterGroupFamily])
    output.versions.push(entry.EngineVersion)
  })

  output.defaultVersion = getDefaultVersion(output.versions)
  return output
}

const getElasticacheVersionData = (engine: ElasticacheEngine): EngineConstraints => {
  const output: EngineConstraints = { familyMapping: [], versions: [], defaultVersion: '0.0.0' }
  const contents: ElasticacheConstraints = getContents(`elasticache-engines-${engine}.json`)

  contents.CacheEngineVersions.filter((entry) => entry.Engine === engine).forEach((entry) => {
    output.familyMapping.push([engine, entry.EngineVersion, entry.CacheParameterGroupFamily])
    output.versions.push(entry.EngineVersion)
  })

  output.defaultVersion = getDefaultVersion(output.versions)
  return output
}

export const exportServiceConstraints = async () => {
  const shouldFetchFromAWS = isEmpty(
    fs.readdirSync(path.join(__dirname, 'data')).filter((file) => file.endsWith('.json')),
  )

  if (shouldFetchFromAWS) {
    // download data using the AWS CLI
    await execute(['/bin/bash', path.join(__dirname, 'aws.sh')])
  }

  const regions = getContents('regions.json')
  const dirPath = path.join(process.cwd(), 'src', 'services', 'providers', 'aws')

  const constraints: AwsServiceConstraints = {
    [SERVICE_TYPE.MYSQL]: {
      regions,
      sizes: uniq(getContents('rds-instances-mysql.json')),
      ...getRdsVersionData('mysql'),
    },
    [SERVICE_TYPE.MARIADB]: {
      regions,
      sizes: uniq(getContents('rds-instances-mariadb.json')),
      ...getRdsVersionData('mariadb'),
    },
    [SERVICE_TYPE.POSTGRESQL]: {
      regions,
      sizes: uniq(getContents('rds-instances-postgres.json')),
      ...getRdsVersionData('postgres'),
    },
    [SERVICE_TYPE.MEMCACHED]: {
      regions,
      sizes: uniq(getContents('elasticache-node-types.json')),
      ...getElasticacheVersionData('memcached'),
    },
    [SERVICE_TYPE.REDIS]: {
      regions,
      sizes: uniq(getContents('elasticache-node-types.json')),
      ...getElasticacheVersionData('memcached'),
    },
  }

  writeJsonFile(JSON.stringify(constraints, null, 2), path.join(dirPath, 'constraints.json'))
  writeJsonFile(JSON.stringify(regions, null, 2), path.join(dirPath, 'regions.json'))
}
