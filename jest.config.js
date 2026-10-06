module.exports = {
    testEnvironment: 'jsdom',
    testMatch: ['**/assets/js/test-unit/**/*.spec.js'],
    transform: {
        '^.+\\.js$': [
            'babel-jest',
            {
                presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
            },
        ],
    },
    moduleNameMapper: {
        '\\.(scss|css)$': '<rootDir>/assets/js/test-unit/style-mock.js',
        '\\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$': '<rootDir>/assets/js/test-unit/file-mock.js',
    },
    transformIgnorePatterns: ['/node_modules/(?!(@bigcommerce)/)'],
};
