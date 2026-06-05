require('dotenv').config();

const COMMON_REQUIRES = [
  'src/support/**/*.ts',
  'src/step-definitions/**/*.ts',
];

const COMMON_OPTIONS = {
  requireModule: ['ts-node/register'],
  formatOptions: { snippetInterface: 'async-await' },
  publishQuiet: true,
  // Allow pending scenarios (e.g. FakeStoreAPI blocked by Cloudflare WAF on CI runners)
  // without failing the build. Real failures (Error/undefined steps) still fail.
  strict: false,
};

module.exports = {
  default: {
    ...COMMON_OPTIONS,
    require: COMMON_REQUIRES,
    features: ['features/**/*.feature'],
    format: [
      'progress-bar',
      'json:reports/cucumber-report.json',
    ],
  },

  smoke: {
    ...COMMON_OPTIONS,
    require: COMMON_REQUIRES,
    features: ['features/**/*.feature'],
    tags: '@smoke',
    format: [
      'progress-bar',
      'json:reports/smoke-report.json',
    ],
  },

  regression: {
    ...COMMON_OPTIONS,
    require: COMMON_REQUIRES,
    features: ['features/**/*.feature'],
    tags: '@smoke or @regression',
    format: [
      'progress-bar',
      'json:reports/regression-report.json',
    ],
  },

  fakestore: {
    ...COMMON_OPTIONS,
    require: [
      'src/support/**/*.ts',
      'src/step-definitions/common/*.ts',
      'src/step-definitions/fakestore/*.ts',
    ],
    features: ['features/fakestore/**/*.feature'],
    format: ['progress-bar', 'json:reports/fakestore-report.json'],
  },

  gorest: {
    ...COMMON_OPTIONS,
    require: [
      'src/support/**/*.ts',
      'src/step-definitions/common/*.ts',
      'src/step-definitions/gorest/*.ts',
    ],
    features: ['features/gorest/**/*.feature'],
    format: ['progress-bar', 'json:reports/gorest-report.json'],
  },
};
