export const up = async (knex) => {
	await knex.schema.createTable("foodsTags", (table) => {
		table.increments("id").primary();
		table.string("name").notNullable();
		table
			.integer("food_id")
			.references("id")
			.inTable("foods")
			.onDelete("CASCADE");
	});
};

export const down = async (knex) => {
	await knex.schema.dropTable("foodsTags");
};
