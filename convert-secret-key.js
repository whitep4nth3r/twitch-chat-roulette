import fs from "fs/promises";

const data = await fs.readFile("secret-key");
console.log(data.toString("base64"));
