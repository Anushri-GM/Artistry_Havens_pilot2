module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
  },
  plugins: ["import"],
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "google",
  ],
  rules: {
    "import/no-dynamic-require": "off", // disables the rule entirely
    "require-jsdoc": "off", // disables Google's JSDoc requirement
    "valid-jsdoc": "off",
    "no-unused-vars": "warn",
    "quotes": ["error", "double", {allowTemplateLiterals: true}],
    "prefer-arrow-callback": "error",
    "no-restricted-globals": ["error", "name", "length"],
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {mocha: true},
    },
  ],
};
