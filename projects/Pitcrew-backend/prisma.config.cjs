const path = require('path');

module.exports = {
  datasources: {
    db: {
      adapter: 'sqlite',
      url: process.env.DATABASE_URL || 'file:./dev.db',
    },
  },
};
