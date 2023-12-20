import fs from 'node:fs'
import path from 'node:path'
import { getProjectSchema } from '@src/project/utils/getProjectSchema'

const exportSchema = async () => {
  const schema = getProjectSchema()
  const target = path.join(__dirname, '..', '..', 'dist', 'schema.json')
  fs.writeFileSync(target, JSON.stringify(schema, null, 2))
}

exportSchema()
