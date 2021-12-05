import crypto from 'crypto';

export const hashObject = (obj: object): string => (
  crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex').toString()
);
