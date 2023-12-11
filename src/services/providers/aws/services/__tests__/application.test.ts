import { AwsApplication } from '@aws/services/application'
import { PROVIDER, SERVICE_TYPE } from '@src/constants'
import { Registry } from '@src/services/registry'
import { REGIONS } from '@aws/constants'
import { faker } from '@faker-js/faker'
import { getValidData } from '@src/validation'
import type { AwsApplicationAttributes } from '@aws/services/application'

describe('Application Service', () => {
  const service = AwsApplication

  it('is a valid AWS App service', () => {
    expect(service.provider).toEqual(PROVIDER.AWS)
    expect(service.type).toEqual(SERVICE_TYPE.APP)
  })

  it('is fetched by the registry', () => {
    expect(Registry.get(PROVIDER.AWS, SERVICE_TYPE.APP))
  })

  it('has the AWS regions set', () => {
    expect(new Set(service.regions)).toEqual(new Set(REGIONS))
  })

  describe('CPU and memory validation', () => {
    const baseConfig: Partial<AwsApplicationAttributes> = {
      name: faker.lorem.word(),
      provider: PROVIDER.AWS,
      type: SERVICE_TYPE.APP,
      region: 'eu-central-1',
      port: 4000,
    }

    it('requires valid cpu and memory configurations - 0.25 vCPU', () => {
      expect(() =>
        getValidData({ ...baseConfig, cpu: 0.25, memory: 30 }, service.schema),
      ).toThrowValidationError('Memory for 0.25 vCPU should be either 0.5, 1 or 2 GB')
    })

    it('requires valid cpu and memory configurations - 0.5 vCPU', () => {
      expect(() =>
        getValidData({ ...baseConfig, cpu: 0.5, memory: 30 }, service.schema),
      ).toThrowValidationError('Memory for 0.5 vCPU should be between 1 and 4 GB')
    })

    it('requires valid cpu and memory configurations - 1 vCPU', () => {
      expect(() =>
        getValidData({ ...baseConfig, cpu: 1, memory: 30 }, service.schema),
      ).toThrowValidationError('Memory for 1 vCPU should be between 2 and 8 GB')
    })

    it('requires valid cpu and memory configurations - 2 vCPUs', () => {
      expect(() =>
        getValidData({ ...baseConfig, cpu: 2, memory: 19 }, service.schema),
      ).toThrowValidationError('Memory for 2 vCPUs should be between 4 and 16 GB')
    })

    it('requires valid cpu and memory configurations - 4 vCPUs', () => {
      expect(() =>
        getValidData({ ...baseConfig, cpu: 4, memory: 120 }, service.schema),
      ).toThrowValidationError('Memory for 4 vCPUs should be between 8 and 30 GB')
    })

    it('requires valid cpu and memory configurations - 8 vCPUs', () => {
      expect(() =>
        getValidData({ ...baseConfig, cpu: 8, memory: 1 }, service.schema),
      ).toThrowValidationError('Memory for 8 vCPUs should be between 16 and 60 GB')
    })

    it('requires valid cpu and memory configurations - 16 vCPUs', () => {
      expect(() =>
        getValidData({ ...baseConfig, cpu: 16, memory: 130 }, service.schema),
      ).toThrowValidationError('Memory for 16 vCPUs should be between 32 and 120 GB')
    })
  })
})
