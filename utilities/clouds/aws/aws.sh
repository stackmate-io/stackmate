#!/bin/bash
data="$( dirname -- "${BASH_SOURCE[0]}" )/data"
opts="--output json"
region="eu-central-1"

# Get all regions available
echo "Fetching data for EC2 regions"
aws ec2 describe-regions --all-regions --query Regions[].RegionName $opts > "$data/regions.json"

# AWS RDS
db_engines=(mysql postgres mariadb)
for engine in "${db_engines[@]}"; do
  echo "Fetching versions, db params, instance sizes for the $engine RDS engine"
  aws rds describe-orderable-db-instance-options --engine $engine --region $region $opts --query OrderableDBInstanceOptions[].DBInstanceClass > "$data/rds-instances-$engine.json"
  aws rds describe-db-engine-versions --engine $engine > "$data/rds-engines-$engine.json"
done

echo "Fetching node type information & versions for Elasticache"
aws elasticache describe-reserved-cache-nodes-offerings --no-paginate --query ReservedCacheNodesOfferings[].CacheNodeType > "$data/elasticache-node-types.json"

cache_engines=(redis memcached)
for engine in "${cache_engines[@]}"; do
  echo "Fetching versions, cache engine versions for the the $engine Elasticache engine"
  aws elasticache describe-cache-engine-versions --no-paginate --output json --engine $engine > "$data/elasticache-engines-$engine.json"
done
