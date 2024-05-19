import { hashSync } from "bcrypt";
import knexConnect from "../database/knex/knexConnect.js";
import AppError from "../utils/AppError.js";

class UserController {
	async create(request, response) {
		const { name, email, password } = request.body;

		if (!name || !email || !password) {
			throw new AppError("Por favor, informe o nome, email e senha!");
		}

		const user = await knexConnect("users").where({ email }).first();

		if (user) {
			throw new AppError(
				"Este e-mail já está em uso, por favor escolha outro email",
			);
		}

		await knexConnect("users").insert({
			name,
			email,
			password: hashSync(password, 8),
		});

		return response.json({
			message: "Usuario cadastrado com sucesso",
		});
	}

	async index(request, response) {
		const users = await knexConnect("users").select("*");

		return response.json(users);
	}
}

export default UserController;
