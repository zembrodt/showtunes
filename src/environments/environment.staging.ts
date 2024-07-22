const buildDateJson = require('./build-date.json');
let buildDate = null;
if (buildDateJson) {
  buildDate = buildDateJson.timestamp;
}

let dateString = '';
if (buildDate && !isNaN(Number(buildDate))) {
  const year = buildDate.getFullYear();
  const month = (buildDate.getMonth() + 1).toString(10).padStart(2, '0');
  const day = buildDate.getDate().toString(10).padStart(2, '0');
  dateString = `${year}${month}${day}`;
}

export const environment = {
  production: true,
  name: 'staging',
  version: `${require('../../package.json').version}-rc${dateString}`
};
