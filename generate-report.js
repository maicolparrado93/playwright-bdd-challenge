const reporter = require('cucumber-html-reporter');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const jsonFile = args[0] || 'reports/cucumber-report.json';
const htmlOutput = args[1] || 'reports/cucumber-report.html';

if (!fs.existsSync(jsonFile)) {
  console.error(`JSON report not found: ${jsonFile}`);
  console.error('Run tests first with: npm test');
  process.exit(1);
}

const options = {
  theme: 'bootstrap',
  jsonFile,
  output: htmlOutput,
  reportSuiteAsScenarios: true,
  scenarioTimestamp: true,
  launchReport: false,
  ignoreBadJsonData: true,
  metadata: {
    'App Version': '1.0.0',
    'Test Environment': process.env.TEST_ENV || 'staging',
    'Platform': 'API',
    'Executed': new Date().toISOString(),
  },
};

reporter.generate(options);
console.log(`HTML report generated: ${path.resolve(htmlOutput)}`);
