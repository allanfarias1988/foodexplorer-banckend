import knexConnect from "../database/knex/knexConnect.js";
import AppError from "../utils/AppError.js";

class DrinksController {
	async index(request, response) {
		const { id } = request.user;

		try {
			const drinks = await knexConnect("drinks")
				.where("drinks.users_id", id)
				.select("drinks.*")
				.orderBy("drinks.name", "asc");

			if (drinks.length === 0) {
				throw new AppError("Não foram encontrados drinks cadastrados!", 200);
			}

			return response.json(drinks);
		} catch (error) {
			if (error instanceof AppError) {
				throw error;
			}
			console.error("Erro:", error.message);
			throw new AppError(
				error.message ||
					"Não foi possível listar os drinks! Tente novamente mais tarde!",
				error.statusCode || 500,
			);
		}
	}

	async show(request, response) {
		const { id } = request.params;

		try {
			const drink = await knexConnect("drinks")
				.select("drinks.*")
				.where("drinks.id", id)
				.first();

			if (!drink) {
				throw new AppError("Drink não encontrado!", 404);
			}

			const ingredients = await knexConnect("drinksIngredients")
				.select("name")
				.where("drinks_id", id);

			const tags = await knexConnect("drinksTags")
				.select("name")
				.where("drinks_id", id);

			drink.ingredients = ingredients.map((ingredient) => ingredient.name);
			drink.tags = tags.map((tag) => tag.name);

			return response.status(200).json(drink);
		} catch (error) {
			if (error instanceof AppError) {
				throw error;
			}
			console.error("Erro:", error.message);
			throw new AppError("Não foi possível mostrar o drink!");
		}
	}

	async create(request, response) {
		const { name, category, description, price, img, ingredients, tags } =
			request.body;
		const { id, role } = request.user;

		if (id === undefined || role !== "admin") {
			throw new AppError(
				"Usuário sem autorização para cadastrar ou alterar drinks!",
				401,
			);
		}

		if (!name || typeof name !== "string" || name.trim() === "") {
			throw new AppError(
				"Nome do drink é obrigatório e não pode estar vazio!",
				400,
			);
		}

		if (!category || typeof category !== "string" || category.trim() === "") {
			throw new AppError(
				"Categoria do drink é obrigatória e não pode estar vazia!",
				400,
			);
		}

		if (price === undefined || typeof price !== "number" || price <= 0) {
			throw new AppError(
				"Preço do drink é obrigatório e deve ser um número positivo!",
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

		const drink = {
			name,
			category,
			description,
			price,
			img,
			users_id: Number(id),
		};

		const trx = await knexConnect.transaction();

		try {
			const [drinkID] = await trx("drinks").insert(drink);

			const drinksTags = tags.map((tag) => ({ name: tag, drinks_id: drinkID }));

			await trx("drinksTags").insert(drinksTags);

			const drinkIngredients = ingredients.map((ingredient) => ({
				name: ingredient,
				drinks_id: drinkID,
			}));

			await trx("drinksIngredients").insert(drinkIngredients);

			await trx.commit();
		} catch (error) {
			await trx.rollback();
			throw new AppError(`Não foi possível inserir o drink! ${error.message}`);
		}

		return response.status(201).json("Drink cadastrado com sucesso!");
	}

	async update(request, response) {
		const { id: drinkId } = request.params;
		const { name, category, description, price, img, ingredients, tags } =
			request.body;
		const { id, role } = request.user;

		if (id === undefined || role !== "admin") {
			throw new AppError(
				"Usuário sem autorização para cadastrar ou alterar drinks!",
				401,
			);
		}

		if (!name || typeof name !== "string" || name.trim() === "") {
			throw new AppError(
				"Nome do drink é obrigatório e não pode estar vazio!",
				400,
			);
		}

		if (!category || typeof category !== "string" || category.trim() === "") {
			throw new AppError(
				"Categoria do drink é obrigatória e não pode estar vazia!",
				400,
			);
		}

		if (price === undefined || typeof price !== "number" || price <= 0) {
			throw new AppError(
				"Preço do drink é obrigatório e deve ser um número positivo!",
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

		const drink = {
			name,
			category,
			description,
			price,
			img,
			users_id: Number(id),
		};

		const trx = await knexConnect.transaction();

		try {
			const updatedRows = await trx("drinks")
				.where({ id: drinkId })
				.update(drink);

			if (updatedRows === 0) {
				throw new AppError("Drink não encontrado!", 404);
			}

			await trx("drinksTags").where({ drinks_id: drinkId }).del();
			await trx("drinksIngredients").where({ drinks_id: drinkId }).del();

			const drinksTags = tags.map((tag) => ({ name: tag, drinks_id: drinkId }));
			await trx("drinksTags").insert(drinksTags);

			const drinkIngredients = ingredients.map((ingredient) => ({
				name: ingredient,
				drinks_id: drinkId,
			}));
			await trx("drinksIngredients").insert(drinkIngredients);

			await trx.commit();

			return response.status(200).json("Drink atualizado com sucesso!");
		} catch (error) {
			await trx.rollback();
			console.error("Error during update:", error.message);
			throw new AppError(
				`Não foi possível atualizar o drink! ${error.message}`,
			);
		}
	}

	async delete(request, response) {
		const { id } = request.params;
		const { role } = request.user;

		if (role !== "admin") {
			throw new AppError("Usuário sem autorização para deletar drinks!", 401);
		}

		try {
			const deletedRows = await knexConnect("drinks").where({ id }).del();

			if (deletedRows === 0) {
				throw new AppError("Drink não encontrado!", 404);
			}

			return response
				.status(200)
				.json({ message: "Drink deletado com sucesso!" });
		} catch (error) {
			if (error.message) {
				throw new AppError(error.message);
			}

			throw new AppError(`Não foi possível deletar o drink! ${error.message}`);
		}
	}
}

export default DrinksController;
