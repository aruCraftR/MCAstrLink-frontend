// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import prettierRecommended from 'eslint-plugin-prettier/recommended'

export default withNuxt(
  // Prettier 格式规则: 单引号、无分号等见 .prettierrc.json
  prettierRecommended
)
