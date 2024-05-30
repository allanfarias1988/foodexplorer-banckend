export const up = async (knex) => {
	await knex.schema.createTable("desserts", (table) => {
		table.increments("id").primary();
		table.string("img");
		table.string("name").notNullable();
		table.string("category").notNullable();
		table.string("description");
		table.decimal("price").notNullable();
		table
			.integer("users_id")
			.references("id")
			.inTable("users")
			.onDelete("CASCADE");
		table.timestamp("created_at").defaultTo(knex.fn.now());
		table.timestamp("updated_at").defaultTo(knex.fn.now());
	});
};

export const down = async (knex) => {
	await knex.schema.dropTable("desserts");
};
