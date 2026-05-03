import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { AvailabilityTags } from './collections/AvailabilityTags'
import { Categories } from './collections/Categories'
import { Clients } from './collections/Clients'
import { Collections } from './collections/Collections'
import { Media } from './collections/Media'
import { Orders } from './collections/Orders'
import { Scarves } from './collections/Scarves'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    AvailabilityTags,
    Categories,
    Collections,
    Tags,
    Scarves,
    Clients,
    Orders,
  ],
  editor: lexicalEditor({}),
  sharp,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
})
