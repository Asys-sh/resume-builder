import type { Config } from 'robo.js'

export default (<Config>{
  logger: {
    level: 'debug',
  },
  experimental: {
    disableBot: true,
  },
  plugins: ['@robojs/auth'],
  type: 'robo',
  watcher: {
    ignore: ['app', 'src/components', 'src/lib', 'src/contexts'],
  },
})
