import * as migration_20260814_120000_checkout_integrity from './20260814_120000_checkout_integrity'

export const migrations = [
  {
    up: migration_20260814_120000_checkout_integrity.up,
    down: migration_20260814_120000_checkout_integrity.down,
    name: '20260814_120000_checkout_integrity',
  },
]
