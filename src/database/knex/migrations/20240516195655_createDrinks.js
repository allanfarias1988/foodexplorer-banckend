export const up = async (knex) => {
	await knex.schema.createTable("drinks", (table) => {
		table.increments("id").primary();
		table.string("img");
		table.string("name").notNullable();
		table.string("category").notNullable();
		table.string("description");
		table.decimal("price").notNullable();
		table
			.integer("user_id")
			.references("id")
			.inTable("users")
			.onDelete("CASCADE");
		table.timestamp("created_at").defaultTo(knex.fn.now());
		table.timestamp("updated_at").defaultTo(knex.fn.now());
	});
};

export const down = async (knex) => {
	await knex.schema.dropTable("drinks");
};