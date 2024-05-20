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

		return response.json(foods);
	}

	async create(request, response) {
		const { name, category, description, price } = request.body;
		const { id, role } = request.user;

		console.log(request.user);

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

		await knexConnect("foods").insert(food);

		return response.status(201).json("Prato cadastrado com sucesso!");
	}
}

export default FoodsController;
