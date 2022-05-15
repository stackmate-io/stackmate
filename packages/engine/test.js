const util = require('util');
const { schema, serviceDefinitions } = require('./dist/schema');

console.log(
  util.inspect(schema, { depth: 20 })
);
