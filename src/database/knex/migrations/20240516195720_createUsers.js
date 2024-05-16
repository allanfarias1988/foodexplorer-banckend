export const up = async (knex) => {
	await knex.schema.createTable("users", (table) => {
		table.increments("id").primary();
		table.string("name").notNullable();
		table.string("email").notNullable().unique();
		table.string("password").notNullable();
		table.enum("role", ["admin", "customer"]).defaultTo("customer");
		table.string("avatar");
		table.timestamp("created_at").defaultTo(knex.fn.now());
		table.timestamp("updated_at").defaultTo(knex.fn.now());
	});
};

export const down = async (knex) => {
	await knex.schema.dropTable("users");
};
