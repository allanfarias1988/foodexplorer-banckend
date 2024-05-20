export const up = async (knex) => {
	await knex.schema.createTable("dessertsIngredients", (table) => {
		table.string("name").notNullable();
		table
			.integer("desserts_id")
			.references("id")
			.inTable("desserts")
			.onDelete("CASCADE");
	});
};

export const down = async (knex) => {
	await knex.schema.dropTable("dessertsIngredients");
};
