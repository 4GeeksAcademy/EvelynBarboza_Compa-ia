module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src/lib"],
  testMatch: ["**/*.test.ts"],
  collectCoverageFrom: ["src/lib/auth.ts"],
};
