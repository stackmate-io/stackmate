import { CredentialsProvider, CredentialsResource } from '@stackmate/interfaces';

class Credentials implements CredentialsProvider {
  username: CredentialsResource;
  password: CredentialsResource;
}

export default Credentials;
