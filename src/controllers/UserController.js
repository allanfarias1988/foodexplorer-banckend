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

		console.log(user);
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
}

export default UserController;
