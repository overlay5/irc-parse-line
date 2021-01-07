module.exports = (wallaby) => {
  process.env.NODE_ENV = 'development';
  return {
    files: [
      'index.js',
      { pattern: 'test/**/*.yaml', load: true, instrument: false },
    ],
    tests: [
      'test/index.test.js',
    ],
    env: {
      type: 'node',
      params: { runner: '--harmony', }
    }
  }
}
