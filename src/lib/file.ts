import fs from 'node:fs'
import path from 'node:path'
import { isString } from 'lodash'
import YAML from 'yaml'

const writeFile = (contents: string, filepath: string) => {
  const directory = path.dirname(filepath)
  const filename = path.basename(filepath)

  if (!fs.existsSync(directory) || !fs.lstatSync(directory).isDirectory()) {
    fs.mkdirSync(directory, { recursive: true })
  }

  fs.writeFileSync(path.join(directory, filename), contents)
}

const readFile = (path: string) => {
  if (!fs.existsSync(path) || !fs.lstatSync(path).isFile()) {
    throw new Error(`File ${path} does not exist or is not readable`)
  }

  return fs.readFileSync(path, 'utf-8')
}

export const writeJsonFile = (contents: object | string, filename: string) => {
  const data = isString(contents) ? contents : JSON.stringify(contents, null, 2)
  writeFile(data, filename)
}

export const readJsonFile = <T = object>(path: string): T => {
  const contents = readFile(path)

  try {
    return JSON.parse(contents)
  } catch (err) {
    console.error(err) // eslint-disable-line no-console
    throw new Error(`File ${path} is not a valid JSON file`)
  }
}

export const readYamlFile = <T = object>(path: string): T => {
  const contents = readFile(path)

  try {
    return YAML.parse(contents)
  } catch (err) {
    console.error(err) // eslint-disable-line no-console
    throw new Error(`File ${path} is not a valid YAML file`)
  }
}
