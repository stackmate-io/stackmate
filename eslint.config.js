module.exports = [
  {
    "rules": {
      "class-methods-use-this": "off",
      "function-paren-newline": "off",
      "monorepo/no-relative-import": "error",
      "object-curly-newline": "off",
      "semi": [
        "error",
        "always"
      ],
      "object-curly-spacing": [
        "error",
        "always"
      ]
    },
    "extends": [
      "airbnb-base",
      "airbnb-typescript/base",
      "plugin:monorepo/recommended"
    ],
    "ignorePatterns": [
      "**/dist/**"
    ],
    "parserOptions": {
      "project": "./tsconfig.json"
    }
  }
]
