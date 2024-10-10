/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // Step 1: Add a temporary UUID column
    await knex.schema.alterTable('boats_view', (table) => {
        table.uuid('temp_id').defaultTo(knex.raw('uuid_generate_v4()'));
    });

    // Step 2: Populate the temp_id column with new UUIDs
    await knex('boats_view').update({
        temp_id: knex.raw('uuid_generate_v4()')
    });

    // Step 3: Drop the old id column
    await knex.schema.alterTable('boats_view', (table) => {
        table.dropColumn('id');
    });

    // Step 4: Rename temp_id to id
    await knex.schema.alterTable('boats_view', (table) => {
        table.renameColumn('temp_id', 'id');
    });

    // Step 5: Add primary key constraint back
    await knex.schema.alterTable('boats_view', (table) => {
        table.primary('id');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    // Step 1: Drop the primary key constraint
    await knex.schema.alterTable('boats_view', (table) => {
        table.dropPrimary('id');
    });

    // Step 2: Add back the integer id column
    await knex.schema.alterTable('boats_view', (table) => {
        table.integer('id').notNullable();
    });

    // Step 3: Set id back to the primary key
    await knex.schema.alterTable('boats_view', (table) => {
        table.primary('id');
    });
};
