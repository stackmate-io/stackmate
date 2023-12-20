/* eslint-disable no-console */
import { exportServiceConstraints as exportAwsConstraints } from './aws'

const fetchConstraints = async () => {
  await exportAwsConstraints()
}

fetchConstraints()
  .then(() => console.log('Process finished'))
  .catch((err) => console.error(err))
