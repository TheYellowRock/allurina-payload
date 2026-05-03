import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
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

const s3Bucket = process.env.S3_BUCKET ?? ''
const s3StorageEnabled = Boolean(
  process.env.S3_ENDPOINT &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    s3Bucket &&
    process.env.S3_PUBLIC_URL,
)

/** Public object URL base (`…/storage/v1/object/public/<bucket>`), not the S3 API endpoint. */
function supabasePublicMediaUrl(filename: string, prefix?: string | null) {
  const base = (process.env.S3_PUBLIC_URL ?? '').replace(/\/$/, '')
  const key = [prefix?.replace(/^\/+|\/+$/g, ''), filename].filter(Boolean).join('/')
  const encodedPath = key.split('/').map((segment) => encodeURIComponent(segment)).join('/')
  return `${base}/${encodedPath}`
}

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
  plugins: [
    s3Storage({
      enabled: s3StorageEnabled,
      bucket: s3Bucket,
      collections: {
        media: {
          generateFileURL: ({ filename, prefix }) => supabasePublicMediaUrl(filename, prefix),
        },
      },
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
        },
        region: process.env.S3_REGION || 'eu-west-1',
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: true,
      },
    }),
  ],
})
