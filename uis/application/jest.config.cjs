module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/lib"],
  testMatch: ["**/*.test.ts"],
  collectCoverageFrom: ["lib/auth.ts"],
};
