module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  ignorePatterns: ["dist/", "node_modules/"],
  overrides: [
    {
      files: ["src/middlewares/auth.middleware.ts"],
      rules: {
        "@typescript-eslint/no-namespace": "off",
      },
    },
  ],
};
