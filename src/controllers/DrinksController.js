import knexConnect from "../database/knex/knexConnect.js";
import AppError from "../utils/AppError.js";

class DrinksController {
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
			const drinksQuery = knexConnect("drinks")
				.where("drinks.users_id", id)
				.select("drinks.*")
				.orderBy("drinks.name", "asc");

			const ingredientsQuery = knexConnect("drinksIngredients")
				.select(
					"drinksIngredients.drinks_id",
					knexConnect.raw(getAggregateFunction("drinksIngredients")),
				)
				.groupBy("drinksIngredients.drinks_id");

			const tagsQuery = knexConnect("drinksTags")
				.select(
					"drinksTags.drinks_id",
					knexConnect.raw(getAggregateFunction("drinksTags")),
				)
				.groupBy("drinksTags.drinks_id");

			const [drinks, ingredients, tags] = await Promise.all([
				drinksQuery,
				ingredientsQuery,
				tagsQuery,
			]);

			const ingredientsMap = ingredients.reduce((acc, ingredient) => {
				acc[ingredient.drinks_id] = ingredient.drinksIngredients;
				return acc;
			}, {});

			const tagsMap = tags.reduce((acc, tag) => {
				acc[tag.drinks_id] = tag.drinksTags;
				return acc;
			}, {});

			const result = drinks.map((drinks) => ({
				...drinks,
				drinksIngredients: ingredientsMap[drinks.id] || "",
				drinksTags: tagsMap[drinks.id] || "",
			}));

			if (result.length === 0) {
				throw new AppError("Não foram encontradas bebidas cadastrados!", 200);
			}

			return response.json(result);
		} catch (error) {
			if (error instanceof AppError) {
				throw error;
			}
			console.error("Erro:", error.message);
			throw new AppError(
				error.message ||
					"Não foi possível listar as bebidas! Tente novamente mais tarde!",
				error.statusCode || 500,
			);
		}
	}

	async show(request, response) {
		const { id } = request.params;

		try {
			const drinks = await knexConnect("drinks")
				.select("drinks.*")
				.where("drinks.id", id)
				.first();

			if (!drinks) {
				throw new AppError("bebida não encontrado!", 404);
			}

			const ingredients = await knexConnect("drinksIngredients")
				.select("name")
				.where("drinks_id", id);

			const tags = await knexConnect("drinksTags")
				.select("name")
				.where("drinks_id", id);

			drinks.ingredients = ingredients.map((ingredient) => ingredient.name);
			drinks.tags = tags.map((tag) => tag.name);

			return response.status(200).json(drinks);
		} catch (error) {
			if (error instanceof AppError) {
				throw error;
			}
			console.error("Erro:", error.message);
			throw new AppError("Não foi possível mostrar a bebida!");
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
				"Nome da bebida é obrigatório e não pode estar vazio!",
				400,
			);
		}

		if (!category || typeof category !== "string" || category.trim() === "") {
			throw new AppError(
				"Categoria da bebida é obrigatória e não pode estar vazia!",
				400,
			);
		}

		if (
			!description ||
			typeof description !== "string" ||
			description.trim() === ""
		) {
			throw new AppError(
				"Descrição da bebida é obrigatória e não pode estar vazia!",
				400,
			);
		}

		if (price === undefined || typeof price !== "number" || price <= 0) {
			throw new AppError(
				"Preço da bebida é obrigatório e deve ser um número positivo!",
				400,
			);
		}

		if (!Array.isArray(tags) || tags.length === 0) {
			throw new AppError(
				"Tags são obrigatórias e devem ser uma lista não vazia!",
				400,
			);
		}

		if (!Array.isArray(ingredients) || ingredients.length === 0) {
			throw new AppError(
				"Ingredientes são obrigatórios e devem ser uma lista não vazia!",
				400,
			);
		}

		const drinks = {
			name,
			category,
			description,
			price,
			users_id: Number(id),
		};

		const trx = await knexConnect.transaction();

		try {
			const [drinksID] = await trx("drinks").insert(drinks);

			const drinksTags = tags.map((tag) => ({
				name: tag,
				drinks_id: drinksID,
			}));
			await trx("drinksTags").insert(drinksTags);

			const drinksIngredients = ingredients.map((ingredient) => ({
				name: ingredient,
				drinks_id: drinksID,
			}));
			await trx("drinksIngredients").insert(drinksIngredients);

			await trx.commit();
		} catch (error) {
			await trx.rollback();
			throw new AppError(`Não foi possível inserir o bebida! ${error.message}`);
		}

		return response.status(201).json("bebida cadastrado com sucesso!");
	}

	async update(request, response) {
		const { id: drinksId } = request.params;
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
				"Nome do bebida é obrigatório e não pode estar vazio!",
				400,
			);
		}

		if (!category || typeof category !== "string" || category.trim() === "") {
			throw new AppError(
				"Categoria do bebida é obrigatória e não pode estar vazia!",
				400,
			);
		}

		if (
			!description ||
			typeof description !== "string" ||
			description.trim() === ""
		) {
			throw new AppError(
				"Descrição do bebida é obrigatória e não pode estar vazia!",
				400,
			);
		}

		if (price === undefined || typeof price !== "number" || price <= 0) {
			throw new AppError(
				"Preço do bebida é obrigatório e deve ser um número positivo!",
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

		const drinks = {
			name,
			category,
			description,
			price,
			users_id: Number(id),
		};

		const trx = await knexConnect.transaction();

		try {
			const updatedRows = await trx("drinks")
				.where({ id: drinksId })
				.update(drinks);

			if (updatedRows === 0) {
				throw new AppError("bebida não encontrado!", 404);
			}

			await trx("drinksTags").where({ drinks_id: drinksId }).del();

			const drinksTags = tags.map((tag) => ({
				name: tag,
				drinks_id: drinksId,
			}));
			await trx("drinksTags").insert(drinksTags);

			await trx("drinksIngredients").where({ drinks_id: drinksId }).del();

			const drinksIngredients = ingredients.map((ingredient) => ({
				name: ingredient,
				drinks_id: drinksId,
			}));
			await trx("drinksIngredients").insert(drinksIngredients);

			await trx.commit();

			return response.status(200).json("bebida atualizado com sucesso!");
		} catch (error) {
			await trx.rollback();
			throw new AppError(
				`Não foi possível atualizar o bebida! ${error.message}`,
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
			const deletedRows = await knexConnect("drinks").where({ id }).del();

			if (deletedRows === 0) {
				throw new AppError("bebida não encontrado!", 404);
			}

			return response
				.status(200)
				.json({ message: "bebida deletado com sucesso!" });
		} catch (error) {
			if (error.message) {
				throw new AppError(error.message);
			}

			throw new AppError(`Não foi possível deletar o bebida! ${error.message}`);
		}
	}
}

export default DrinksController;
