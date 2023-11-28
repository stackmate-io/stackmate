import fs from 'node:fs'
import { getProjectSchema } from '@src/project/utils/getProjectSchema'

const exportSchema = async () => {
  const schema = getProjectSchema()
  fs.writeFileSync('dist/schema.json', JSON.stringify(schema, null, 2))
}

exportSchema()
