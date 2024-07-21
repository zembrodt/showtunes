const now = new Date();
const year = now.getUTCFullYear();
const month = (now.getUTCMonth() + 1).toString(10).padStart(2, '0');
const day = now.getUTCDate().toString(10).padStart(2, '0');

export const environment = {
  production: true,
  name: 'staging',
  version: `${require('../../package.json').version}-rc${year}${month}${day}`
};
