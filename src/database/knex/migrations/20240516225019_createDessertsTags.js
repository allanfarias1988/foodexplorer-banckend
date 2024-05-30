export const up = async (knex) => {
	await knex.schema.createTable("dessertsTags", (table) => {
		table.increments("id").primary();
		table.string("name").notNullable();
		table
			.integer("desserts_id")
			.references("id")
			.inTable("desserts")
			.onDelete("CASCADE");
	});
};

export const down = async (knex) => {
	await knex.schema.dropTable("dessertsTags");
};
