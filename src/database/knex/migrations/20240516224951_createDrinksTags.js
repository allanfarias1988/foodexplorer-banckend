export const up = async (knex) => {
	await knex.schema.createTable("drinksTags", (table) => {
		table.increments("id").primary();
		table.string("name").notNullable();
		table
			.integer("tags_id")
			.references("id")
			.inTable("drinks")
			.onDelete("CASCADE");
	});
};

export const down = async (knex) => {
	await knex.schema.dropTable("drinksTags");
};
