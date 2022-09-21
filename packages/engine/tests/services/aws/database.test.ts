import { AWSPostgreSQL } from '@stackmate/engine/providers/aws/services/database';

describe('AWSPostgreSQL', () => {
  const service = AWSPostgreSQL;

  it('returns the correct schema ID', () => {
    expect(service.schemaId).toEqual('services/aws/postgresql');
  });
});
