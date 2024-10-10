/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema.createTable('users', function(table) {
      table.increments('id').primary();
      table.string('email').notNullable().unique();
      table.string('password').notNullable();
      table.boolean('editor').notNullable().defaultTo(false);
      table.timestamps(true, true);
    });
  };
  
exports.down = async function(knex) {
    return knex.schema.dropTable('users');
};

