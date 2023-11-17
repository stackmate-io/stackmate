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

  // DB Instance
  assert {
    condition     = can(aws_db_instance.aws_mysql_1.id)
    error_message = "Database instance not defined"
  }

  assert {
    condition     = contains(aws_db_instance.aws_mysql_1.vpc_security_group_ids, aws_vpc.aws_networking_1.default_security_group_id)
    error_message = "Database instance not defined"
  }

  assert {
    condition     = aws_db_instance.aws_mysql_1.engine == "mysql"
    error_message = "The database engine is other than mysql"
  }

  // DB param group
  assert {
    condition     = can(regex("^mysql[0-9.]", aws_db_parameter_group.aws_mysql_1_params.family))
    error_message = "The database parameter group is invalid"
  }

  // DB subnet
  assert {
    condition     = can(aws_db_subnet_group.aws_mysql_1-subnetGroup.id)
    error_message = "The db subnet group is not defined"
  }
}
