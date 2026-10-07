module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src/lib"],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.module\\.css$": "<rootDir>/src/lib/styleMock.ts",
  },
  collectCoverageFrom: ["src/lib/auth.ts"],
};
