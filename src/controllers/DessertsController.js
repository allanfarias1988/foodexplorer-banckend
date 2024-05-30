import knexConnect from "../database/knex/knexConnect.js";
import AppError from "../utils/AppError.js";

class DessertsController {
	async index(request, response) {
		const { id } = request.user;

		function getAggregateFunction(columnName) {
			const dbClient = knexConnect.client.config.client;
			if (dbClient === "mysql" || dbClient === "sqlite3") {
				return `GROUP_CONCAT(${columnName}.name) as ${columnName}`;
			}
			if (dbClient === "postgresql") {
				return `STRING_AGG(${columnName}.name, ', ') as ${columnName}`;
			}
			throw new Error("Unsupported database client");
		}

		try {
			const dessertsQuery = knexConnect("desserts")
				.where("desserts.users_id", id)
				.select("desserts.*")
				.orderBy("desserts.name", "asc");

			const ingredientsQuery = knexConnect("dessertsIngredients")
				.select(
					"desserts_id",
					knexConnect.raw(getAggregateFunction("dessertsIngredients")),
				)
				.groupBy("desserts_id");

			const tagsQuery = knexConnect("dessertsTags")
				.select(
					"desserts_id",
					knexConnect.raw(getAggregateFunction("dessertsTags")),
				)
				.groupBy("desserts_id");

			const [desserts, ingredients, tags] = await Promise.all([
				dessertsQuery,
				ingredientsQuery,
				tagsQuery,
			]);

			const ingredientsMap = ingredients.reduce((acc, ingredient) => {
				acc[ingredient.desserts_id] = ingredient.dessertsIngredients;
				return acc;
			}, {});

			const tagsMap = tags.reduce((acc, tag) => {
				acc[tag.desserts_id] = tag.dessertsTags;
				return acc;
			}, {});

			const result = desserts.map((dessert) => ({
				...dessert,
				dessertsIngredients: ingredientsMap[dessert.id] || "",
				dessertsTags: tagsMap[dessert.id] || "",
			}));

			if (result.length === 0) {
				throw new AppError(
					"Não foram encontradas sobremesas cadastradas!",
					200,
				);
			}

			return response.json(result);
		} catch (error) {
			if (error instanceof AppError) {
				throw error;
			}
			console.error("Erro:", error.message);
			throw new AppError(
				error.message ||
					"Não foi possível listar as sobremesas! Tente novamente mais tarde!",
				error.statusCode || 500,
			);
		}
	}

	async show(request, response) {
		const { id } = request.params;

		try {
			const dessert = await knexConnect("desserts")
				.select("desserts.*")
				.where("desserts.id", id)
				.first();

			if (!dessert) {
				throw new AppError("Sobremesa não encontrada!", 404);
			}

			const ingredients = await knexConnect("dessertsIngredients")
				.select("name")
				.where("desserts_id", id);

			const tags = await knexConnect("dessertsTags")
				.select("name")
				.where("desserts_id", id);

			dessert.ingredients = ingredients.map((ingredient) => ingredient.name);
			dessert.tags = tags.map((tag) => tag.name);

			return response.status(200).json(dessert);
		} catch (error) {
			if (error instanceof AppError) {
				throw error;
			}
			console.error("Erro:", error.message);
			throw new AppError("Não foi possível mostrar a sobremesa!");
		}
	}

	async create(request, response) {
		const { name, category, description, price, tags, ingredients } =
			request.body;
		const { id, role } = request.user;

		if (id === undefined || role !== "admin") {
			throw new AppError(
				"Usuário sem autorização para cadastrar ou alterar produtos!",
				401,
			);
		}

		if (!name || typeof name !== "string" || name.trim() === "") {
			throw new AppError(
				"Nome da sobremesa é obrigatório e não pode estar vazio!",
				400,
			);
		}

		if (!category || typeof category !== "string" || category.trim() === "") {
			throw new AppError(
				"Categoria da sobremesa é obrigatória e não pode estar vazia!",
				400,
			);
		}

		if (
			!description ||
			typeof description !== "string" ||
			description.trim() === ""
		) {
			throw new AppError(
				"Descrição da sobremesa é obrigatória e não pode estar vazia!",
				400,
			);
		}

		if (price === undefined || typeof price !== "number" || price <= 0) {
			throw new AppError(
				"Preço da sobremesa é obrigatório e deve ser um número positivo!",
				400,
			);
		}

		if (!Array.isArray(tags) || tags.length === 0) {
			throw new AppError(
				"Tags são obrigatórias e devem ser um array não vazio!",
				400,
			);
		}

		if (!Array.isArray(ingredients) || ingredients.length === 0) {
			throw new AppError(
				"Ingredientes são obrigatórios e devem ser um array não vazio!",
				400,
			);
		}

		const dessert = {
			name,
			category,
			description,
			price,
			users_id: Number(id),
		};

		const trx = await knexConnect.transaction();

		try {
			const [dessertID] = await trx("desserts").insert(dessert);

			const dessertsTags = tags.map((tag) => ({
				name: tag,
				desserts_id: dessertID,
			}));

			await trx("dessertsTags").insert(dessertsTags);

			const dessertIngredients = ingredients.map((ingredient) => ({
				name: ingredient,
				desserts_id: dessertID,
			}));

			await trx("dessertsIngredients").insert(dessertIngredients);

			await trx.commit();
		} catch (error) {
			await trx.rollback();
			throw new AppError(
				`Não foi possível inserir a sobremesa! ${error.message}`,
			);
		}

		return response.status(201).json("Sobremesa cadastrada com sucesso!");
	}

	async update(request, response) {
		const { id: dessertId } = request.params;
		const { name, category, description, price, tags, ingredients } =
			request.body;
		const { id, role } = request.user;

		if (id === undefined || role !== "admin") {
			throw new AppError(
				"Usuário sem autorização para cadastrar ou alterar produtos!",
				401,
			);
		}

		if (!name || typeof name !== "string" || name.trim() === "") {
			throw new AppError(
				"Nome da sobremesa é obrigatório e não pode estar vazio!",
				400,
			);
		}

		if (!category || typeof category !== "string" || category.trim() === "") {
			throw new AppError(
				"Categoria da sobremesa é obrigatória e não pode estar vazia!",
				400,
			);
		}

		if (
			!description ||
			typeof description !== "string" ||
			description.trim() === ""
		) {
			throw new AppError(
				"Descrição da sobremesa é obrigatória e não pode estar vazia!",
				400,
			);
		}

		if (price === undefined || typeof price !== "number" || price <= 0) {
			throw new AppError(
				"Preço da sobremesa é obrigatório e deve ser um número positivo!",
				400,
			);
		}

		if (!Array.isArray(tags) || tags.length === 0) {
			throw new AppError(
				"Tags são obrigatórias e devem ser um array não vazio!",
				400,
			);
		}

		if (!Array.isArray(ingredients) || ingredients.length === 0) {
			throw new AppError(
				"Ingredientes são obrigatórios e devem ser um array não vazio!",
				400,
			);
		}

		const dessert = {
			name,
			category,
			description,
			price,
			users_id: Number(id),
		};

		const trx = await knexConnect.transaction();

		try {
			const updatedRows = await trx("desserts")
				.where({ id: dessertId })
				.update(dessert);

			if (updatedRows === 0) {
				throw new AppError("Sobremesa não encontrada!", 404);
			}

			await trx("dessertsTags").where({ desserts_id: dessertId }).del();
			await trx("dessertsIngredients").where({ desserts_id: dessertId }).del();

			const dessertsTags = tags.map((tag) => ({
				name: tag,
				desserts_id: dessertId,
			}));
			await trx("dessertsTags").insert(dessertsTags);

			const dessertIngredients = ingredients.map((ingredient) => ({
				name: ingredient,
				desserts_id: dessertId,
			}));
			await trx("dessertsIngredients").insert(dessertIngredients);

			await trx.commit();

			return response.status(200).json("Sobremesa atualizada com sucesso!");
		} catch (error) {
			await trx.rollback();
			console.error("Error during update:", error.message);
			throw new AppError(
				`Não foi possível atualizar a sobremesa! ${error.message}`,
			);
		}
	}

	async delete(request, response) {
		const { id } = request.params;
		const { role } = request.user;

		if (role !== "admin") {
			throw new AppError("Usuário sem autorização para deletar produtos!", 401);
		}

		try {
			const deletedRows = await knexConnect("desserts").where({ id }).del();

			if (deletedRows === 0) {
				throw new AppError("Sobremesa não encontrada!", 404);
			}

			return response
				.status(200)
				.json({ message: "Sobremesa deletada com sucesso!" });
		} catch (error) {
			if (error.message) {
				throw new AppError(error.message);
			}

			throw new AppError(
				`Não foi possível deletar a sobremesa! ${error.message}`,
			);
		}
	}
}

export default DessertsController;
