variable "infrastructure_region" {}
variable "aws_s3_bucket_name" {}
variable "aws_dynamodb_lock_table_name" {}

provider "aws" {
  region = var.infrastructure_region
}

resource "aws_s3_bucket" "terraform_state" {
  bucket = var.aws_s3_bucket_name

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
    bucket = aws_s3_bucket.terraform_state.id

    versioning_configuration {
      status = "Enabled"
    }
}

resource "aws_dynamodb_table" "terraform_state_lock" {
  name           = var.aws_dynamodb_lock_table_name

  read_capacity  = 1
  write_capacity = 1
  hash_key       = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}

output "state_bucket" {
  value = aws_s3_bucket.terraform_state.bucket
  description = "use this as the bucket for your state configuration"
}

output "lock_table" {
  value = aws_dynamodb_table.terraform_state_lock.name
  description = "use this as the lockTable for your state configuration"
}
