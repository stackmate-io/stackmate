export type TestConfig = {
  region: string
  bucket: string
  lock: string
  key: string
}

/**
 * WARNING: we should make sure that the values here, are aligned with the "create-e2e-tests-setup"
 *          module, in the operations repository.
 *
 * The reasoning for this is that if we use `terraform test` to create the bucket,
 * we would need to wait for a few seconds until the bucket becomes available, so we're going
 * with a pre-provisioned bucket to make tests run faster
 *
 * @param {String} testCase the name of the test case
 * @returns {Object} the setup to use
 */
export const getAwsTestsConfig = (testCase: string): TestConfig => ({
  region: 'eu-central-1',
  bucket: 'stackmate-e2e-tests',
  lock: 'stackmate-state-lock',
  key: `stackmate-e2e-${testCase}/state-${Date.now()}.tfstate`,
})
