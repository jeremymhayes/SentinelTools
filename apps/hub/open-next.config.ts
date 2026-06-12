import { defineCloudflareConfig } from '@opennextjs/cloudflare'

export default {
  ...defineCloudflareConfig(),
  // OpenNext cannot consume Turbopack build output yet — force webpack
  // for Cloudflare bundles. Local `npm run dev`/`build` keep Turbopack.
  buildCommand: 'npx next build --webpack',
}
