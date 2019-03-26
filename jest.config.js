// https://jestjs.io/docs/en/configuration.html

module.exports = {
  preset: "ts-jest",
  roots: ["<rootDir>/server/src", "<rootDir>/client/src"],
  testEnvironment: "node",
};
