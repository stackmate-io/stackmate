run "end-to-end" {
  command = apply

  // Account owner
  assert {
    condition     = can(data.aws_caller_identity.aws_provider_1_account_id.id)
    error_message = "Caller account ID not set"
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

  // S3 Policy & User should have been created
  assert {
    condition     = can(data.aws_iam_policy_document.aws_objectstore_1_policy_document.id)
    error_message = "Policy Document is not defined"
  }

  // assert {
  //   condition     = aws_iam_policy.aws_objectstore_1_policy.id == data.aws_iam_policy_document.aws_objectstore_1_policy_document.arn
  //   error_message = "Policy is not defined"
  // }

  assert {
    condition     = can(aws_iam_user.aws_objectstore_1_user.id)
    error_message = "User is not defined"
  }

  assert {
    condition     = can(aws_iam_user_policy_attachment.aws_objectstore_1_policy_attachment.id)
    error_message = "User - policy attachment is not defined"
  }

  assert {
    condition     = aws_iam_user_policy_attachment.aws_objectstore_1_policy_attachment.user == aws_iam_user.aws_objectstore_1_user.name
    error_message = "User is not attached to the policy"
  }

  assert {
    condition     = aws_iam_user_policy_attachment.aws_objectstore_1_policy_attachment.policy_arn == aws_iam_policy.aws_objectstore_1_policy.arn
    error_message = "Policy is not attached to the user"
  }

  // S3 Buckets - Bucket 1: No encryption, no versioning
  assert {
    condition     = can(aws_s3_bucket.aws_objectstore_1_bucket_stackmate_e_2_e_bucket_test_1.id)
    error_message = "The bucket's name is other than the expected one"
  }

  assert {
    condition     = aws_s3_bucket_acl.aws_objectstore_1_stackmate_e_2_e_bucket_test_1_acl.acl == "private"
    error_message = "The bucket is not private"
  }

  assert {
    condition     = can(aws_s3_bucket_ownership_controls.aws_objectstore_1_stackmate_e_2_e_bucket_test_1_ownership.id)
    error_message = "No bucket owner setting present"
  }

  assert {
    condition     = can(aws_s3_bucket_versioning.aws_objectstore_1_stackmate_e_2_e_bucket_test_1_versioning.id)
    error_message = "No versioning defined for bucket"
  }

  // S3 Buckets - Bucket 2: Encrypted, versioned
  assert {
    condition     = can(aws_s3_bucket.aws_objectstore_1_bucket_stackmate_e_2_e_bucket_test_2.id)
    error_message = "The bucket's name is other than the expected one"
  }

  assert {
    condition     = aws_s3_bucket_acl.aws_objectstore_1_stackmate_e_2_e_bucket_test_2_acl.acl == "private"
    error_message = "The bucket is not private"
  }

  assert {
    condition     = can(aws_s3_bucket_ownership_controls.aws_objectstore_1_stackmate_e_2_e_bucket_test_2_ownership.id)
    error_message = "No bucket owner setting present"
  }

  assert {
    condition     = can(aws_s3_bucket_versioning.aws_objectstore_1_stackmate_e_2_e_bucket_test_2_versioning.id)
    error_message = "No versioning defined for bucket"
  }

  assert {
    condition     = can(aws_s3_bucket_server_side_encryption_configuration.aws_objectstore_1_stackmate_e_2_e_bucket_test_2_encryption.id)
    error_message = "No encryption defined for bucket"
  }
}
