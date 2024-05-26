import knexConnect from "../database/knex/knexConnect.js";
import AppError from "../utils/AppError.js";

class FoodsController {
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
			const foodsQuery = knexConnect("foods")
				.where("foods.user_id", id)
				.select("foods.*")
				.orderBy("foods.name", "asc");

			const ingredientsQuery = knexConnect("foodsIngredients")
				.select(
					"foodsIngredients.food_id",
					knexConnect.raw(getAggregateFunction("foodsIngredients")),
				)
				.groupBy("foodsIngredients.food_id");

			const tagsQuery = knexConnect("foodTags")
				.select(
					"foodTags.food_id",
					knexConnect.raw(getAggregateFunction("foodTags")),
				)
				.groupBy("foodTags.food_id");

			const [foods, ingredients, tags] = await Promise.all([
				foodsQuery,
				ingredientsQuery,
				tagsQuery,
			]);

			const ingredientsMap = ingredients.reduce((acc, ingredient) => {
				acc[ingredient.food_id] = ingredient.foodsIngredients;
				return acc;
			}, {});

			const tagsMap = tags.reduce((acc, tag) => {
				acc[tag.food_id] = tag.foodTags;
				return acc;
			}, {});

			const result = foods.map((food) => ({
				...food,
				foodsIngredients: ingredientsMap[food.id] || "",
				foodTags: tagsMap[food.id] || "",
			}));

			if (result.length === 0) {
				throw new AppError("Não foram encontrados pratos cadastrados!", 200);
			}

			return response.json(result);
		} catch (error) {
			if (error instanceof AppError) {
				throw error;
			}
			console.error("Erro:", error.message);
			throw new AppError(
				error.message ||
					"Não foi possível listar os pratos! Tente novamente mais tarde!",
				error.statusCode || 500,
			);
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

		const food = {
			name,
			category,
			description,
			price,
			user_id: Number(id),
		};

		try {
			const [foodID] = await knexConnect("foods").insert(food);

			const foodTags = tags.map((tag) => ({ name: tag, food_id: foodID }));

			await knexConnect("foodTags").insert(foodTags);

			const foodIngredients = ingredients.map((ingredient) => ({
				name: ingredient,
				food_id: foodID,
			}));

			await knexConnect("foodsIngredients").insert(foodIngredients);
		} catch (error) {
			throw new AppError(`Não foi possível inserir o prato!, ${error.message}`);
		}

		return response.status(201).json("Prato cadastrado com sucesso!");
	}

	async update(request, response) {
		const { id: foodId } = request.params;
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
			throw new AppError("Nome do prato é obrigatório e não pode estar vazio!");
		}

		if (!category || typeof category !== "string" || category.trim() === "") {
			throw new AppError(
				"Categoria do prato é obrigatória e não pode estar vazia!",
			);
		}

		if (price === undefined || typeof price !== "number" || price <= 0) {
			throw new AppError(
				"Preço do prato é obrigatório e deve ser um número positivo!",
			);
		}

		if (!Array.isArray(ingredients) || ingredients.length === 0) {
			throw new AppError(
				"Ingredientes são obrigatórios e deve ser uma lista não vazia!",
			);
		}

		const food = {
			name,
			category,
			description,
			price,
			user_id: Number(id),
		};

		const trx = await knexConnect.transaction();

		try {
			const updatedRows = await trx("foods").where({ id: foodId }).update(food);

			if (updatedRows === 0) {
				throw new AppError("Prato não encontrado!", 404);
			}

			await trx("foodTags").where({ food_id: foodId }).del();

			const foodTags = tags.map((tag) => ({ name: tag, food_id: foodId }));
			await trx("foodTags").insert(foodTags);

			await trx("foodsIngredients").where({ food_id: foodId }).del();

			const foodIngredients = ingredients.map((ingredient) => ({
				name: ingredient,
				food_id: foodId,
			}));
			await trx("foodsIngredients").insert(foodIngredients);

			await trx.commit();

			return response.status(200).json("Prato atualizado com sucesso!");
		} catch (error) {
			await trx.rollback();
			throw new AppError(
				`Não foi possível atualizar o prato! ${error.message}`,
			);
		}
	}
}

export default FoodsController;
