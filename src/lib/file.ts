import fs from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'

const writeFile = (contents: string, directory: string, filename: string) => {
  if (!fs.existsSync(directory) || !fs.lstatSync(directory).isDirectory()) {
    fs.mkdirSync(directory, { recursive: true })
  }

  fs.writeFileSync(path.join(directory, filename), JSON.stringify(contents, null, 2))
}

const readFile = (path: string) => {
  if (!fs.existsSync(path) || !fs.lstatSync(path).isFile()) {
    throw new Error(`File ${path} does not exist or is not readable`)
  }

  return fs.readFileSync(path, 'utf-8')
}

export const createJsonFile = (contents: object, directory: string, filename: string) =>
  writeFile(JSON.stringify(contents, null, 2), directory, filename)

export const readJsonFile = (path: string): object => {
  const contents = readFile(path)

  try {
    return JSON.parse(contents)
  } catch (err) {
    console.error(err) // eslint-disable-line no-console
    throw new Error(`File ${path} is not a valid JSON file`)
  }
}

export const readYamlFile = (path: string): object => {
  const contents = readFile(path)

  try {
    return YAML.parse(contents)
  } catch (err) {
    console.error(err) // eslint-disable-line no-console
    throw new Error(`File ${path} is not a valid YAML file`)
  }
}
