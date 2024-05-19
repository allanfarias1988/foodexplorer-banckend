import knex from "knex";
import knexConfig from "../../../knexfile.js";

const knexConnect = knex(knexConfig);

export default knexConnect;
