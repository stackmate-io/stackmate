import type {
  elasticacheReplicationGroup,
  elasticacheParameterGroup,
  elasticacheCluster,
} from '@cdktf/provider-aws'

const cluster: Partial<elasticacheReplicationGroup.ElasticacheReplicationGroupConfig> = {
  autoMinorVersionUpgrade: 'true',
  automaticFailoverEnabled: false,
  snapshotRetentionLimit: 7,
}

const instance: Partial<elasticacheCluster.ElasticacheClusterConfig> = {
  autoMinorVersionUpgrade: 'true',
  snapshotRetentionLimit: 7,
}

const params: elasticacheParameterGroup.ElasticacheParameterGroup[] = []

export { cluster, instance, params }
