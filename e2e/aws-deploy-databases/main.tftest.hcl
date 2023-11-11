run "aws_prerequisites" {
  command = apply

  assert {
    condition     = aws_kms_key.aws_provider_aws_eu_central_1_key.is_enabled == true
    error_message = "KMS key is not enabled"
  }
}
