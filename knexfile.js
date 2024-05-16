import { resolve } from "node:path";

export const knexConfig = {
	client: "sqlite3",
	connection: {
		filename: resolve("src", "database", "database.db"),
	},
	migrations: {
		tableName: "knex_migrations",
		directory: resolve("src", "database", "knex", "migrations"),
	},

	useNullAsDefault: true,

	pool: {
		afterCreate: (connect, callback) =>
			connect.run("PRAGMA foreign_keys = ON", callback),
	},
};

export default knexConfig;
