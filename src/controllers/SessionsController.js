import { compare } from "bcrypt";
import jwt from "jsonwebtoken";
import { jwtConfig } from "../configs/jwtConfig.js";
import knexConnect from "../database/knex/knexConnect.js";
import AppError from "../utils/AppError.js";

class SessionsController {
	async create(request, response) {
		const { email, password } = request.body;

		const user = await knexConnect("users").where({ email }).first();

		if (!user) {
			throw new AppError("E-mail e/ou senha icorretos. Tente novamente!");
		}

		const checkPassword = await compare(password, user.password);

		if (!checkPassword) {
			throw new AppError("E-mail e/ou senha incorretos. Tente novamente!");
		}

		const { secret, expiresIn } = jwtConfig;

		const token = jwt.sign({}, secret, {
			subject: String(user.id),
			expiresIn,
		});

		const userData = {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			avatar: user.avatar,
		};

		return response.json({ user: userData, token });
	}
}

export default SessionsController;
