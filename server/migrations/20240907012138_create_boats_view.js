/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex.schema.createTable('boats_view', (table) => {
        table.increments('id').primary();
        table.integer('boat_id').unsigned();
        table.foreign('boat_id').references('boats.id');
        table.text('view_name'); 
        table.float('lat');
        table.float('lon');
        table.timestamps(true, true);
      });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema.dropTable('boats_view');
};
