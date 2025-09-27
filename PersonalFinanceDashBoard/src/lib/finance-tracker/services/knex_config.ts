import Knex from 'knex';
const knexConfig = require('../../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

const knex = Knex(config);

export default knex;
