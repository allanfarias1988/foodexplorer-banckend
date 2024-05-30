export const up = async (knex) => {
	await knex.schema.createTable("drinksIngredients", (table) => {
		table.increments("id").primary();
		table.string("name").notNullable();
		table
			.integer("drinks_id")
			.references("id")
			.inTable("drinks")
			.onDelete("CASCADE");
	});
};

export const down = async (knex) => {
	await knex.schema.dropTable("drinksIngredients");
};
