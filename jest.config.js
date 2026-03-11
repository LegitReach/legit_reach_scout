/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/src/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    // Resolve the @/* path alias from tsconfig.json
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          jsx: "react",
        },
      },
    ],
  },
  transformIgnorePatterns: ["/node_modules/"],
};

module.exports = config;
