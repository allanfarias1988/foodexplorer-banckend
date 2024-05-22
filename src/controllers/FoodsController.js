import knexConnect from "../database/knex/knexConnect.js";
import AppError from "../utils/AppError.js";

class FoodsController {
	async index(request, response) {
		const { id } = request.user;

		if (id === undefined) {
			throw AppError("Usuário não identificado!");
		}

		const foods = await knexConnect("foods").where({ user_id: id });

		if (!foods || foods.length === 0) {
			throw new AppError("Usuário não possui pratos para exibir", 200);
		}

		const foodsTags = await knexConnect("foodTags").where({ user_id: id });
		const foodsIngredients = await knexConnect("foodsIngredients").where({
			user_id: id,
		});

		return response.json(foods);
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
}

export default FoodsController;
