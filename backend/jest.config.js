module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/**/*.test.ts'],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    moduleFileExtensions: ['js', 'ts'],
    moduleDirectories: ['node_modules', '<rootDir>/src'],
};
