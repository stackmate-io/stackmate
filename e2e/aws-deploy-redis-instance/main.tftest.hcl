run "end-to-end" {
  command = apply

  // Account owner
  assert {
    condition     = can(data.aws_caller_identity.aws_provider_1_account_id.id)
    error_message = "Caller account ID not set"
  }

  // VPC
  assert {
    condition     = can(aws_vpc.aws_networking_1.id)
    error_message = "VPC is not defined"
  }

  assert {
    condition     = aws_vpc.aws_networking_1.cidr_block == "10.0.0.0/16"
    error_message = "The CIDR for networking is other than 10.0.0.0/16"
  }

  // KMS
  assert {
    condition     = can(aws_kms_key.aws_provider_1_key)
    error_message = "KMS key is not enabled"
  }

  assert {
    condition     = aws_kms_key.aws_provider_1_key.is_enabled == true
    error_message = "KMS key is not enabled"
  }

  // Internet gateway
  assert {
    condition     = aws_internet_gateway.aws_networking_1_gateway.vpc_id == aws_vpc.aws_networking_1.id
    error_message = "The internet gateway is not defined"
  }

  // Subnets
  assert {
    condition     = can(regex("^[a-z0-9-]+a$", aws_subnet.aws_networking_1_subnet1.availability_zone)) && aws_subnet.aws_networking_1_subnet1.cidr_block == "10.0.1.0/24"
    error_message = "Subnet #1 is invalid"
  }

  assert {
    condition     = can(regex("^[a-z0-9-]+b$", aws_subnet.aws_networking_1_subnet2.availability_zone)) && aws_subnet.aws_networking_1_subnet2.cidr_block == "10.0.2.0/24"
    error_message = "Subnet #2 is invalid"
  }

  assert {
    condition     = aws_subnet.aws_networking_1_subnet1.vpc_id == aws_vpc.aws_networking_1.id
    error_message = "Subnet #1 is not assigned to the right VPC"
  }

  assert {
    condition     = aws_subnet.aws_networking_1_subnet2.vpc_id == aws_vpc.aws_networking_1.id
    error_message = "Subnet #2 is not assigned to the right VPC"
  }

  // Pnstance
  assert {
    condition     = can(aws_elasticache_cluster.aws_redis_1.id)
    error_message = "redis instance not defined"
  }

  assert {
    condition     = contains(aws_elasticache_cluster.aws_redis_1.security_group_ids, aws_vpc.aws_networking_1.default_security_group_id)
    error_message = "redis instance does not contain the default security group"
  }

  assert {
    condition     = aws_elasticache_cluster.aws_redis_1.engine == "redis"
    error_message = "The cache engine is other than redis"
  }

  // Log configuration
  assert {
    condition     = can(aws_cloudwatch_log_group.aws_redis_1_log_group.id)
    error_message = "The log group is not defined"
  }

  // Param group
  assert {
    condition     = can(regex("^redis[0-9.]", aws_elasticache_parameter_group.aws_redis_1_params.family))
    error_message = "The redis parameter group is invalid"
  }

  // Pubnet
  assert {
    condition     = can(aws_elasticache_subnet_group.aws_redis_1_subnet_group.id)
    error_message = "The redis subnet group is not defined"
  }
}