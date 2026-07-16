import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db  = new Database(
    path.join(__dirname , "../../urls.db")
);

db.pragma("journal_mode = WAL");

export default db;