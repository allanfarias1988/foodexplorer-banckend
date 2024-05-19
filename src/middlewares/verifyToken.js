import jwt from "jsonwebtoken";
import { jwtConfig } from "../configs/jwtConfig.js";
import knexConnect from "../database/knex/knexConnect.js";
import AppError from "../utils/AppError.js";

async function verifyToken(request, response, next) {
	try {
		const authHeader = request.headers.authorization;

		if (!authHeader) {
			throw new AppError("Token não encontrrado", 401);
		}
		const [, token] = authHeader.split(" ");

		const { secret } = jwtConfig;
		const { sub: id } = jwt.verify(token, secret);

		const user = await knexConnect("users").where({ id }).first();

		if (!user) {
			throw new AppError("Usuario não encontrado", 401);
		}

		request.user = {
			id: user.id,
			name: user.name,
			email: user.email,
		};
	} catch (error) {
		throw new AppError("Token inválido!", 401);
	}

	next();
}

export default verifyToken;
