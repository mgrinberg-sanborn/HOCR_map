// db.js
const knex = require('knex');
const knexConfig = require('./knexfile');

// Create a knex instance based on the environment
const db = knex(knexConfig[process.env.NODE_ENV || 'development']);

module.exports = db;
