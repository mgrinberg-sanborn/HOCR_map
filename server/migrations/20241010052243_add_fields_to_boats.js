/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex.schema.table('boats', (table) => {
        table.text('WaterorLand');
        table.integer('Zone');
        table.varchar('Position');
        table.varchar('assignment');
        table.varchar('motor_position');
        table.varchar('at_ready_position');
        table.varchar('nearest_biobreak_location');
        table.varchar('launch_origin');
        table.varchar('launch_type');
        table.varchar('notes');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return knex.schema.table('boats', (table) => {
        table.dropColumn('WaterorLand');
        table.dropColumn('Zone');
        table.dropColumn('Position');
        table.dropColumn('assignment');
        table.dropColumn('motor_position');
        table.dropColumn('at_ready_position');
        table.dropColumn('nearest_biobreak_location');
        table.dropColumn('launch_origin');
        table.dropColumn('launch_type');
        table.dropColumn('notes');
    });
};
