import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);

export default async function getUserData(collectionName) {
  await client.connect();
  const db = client.db("rtw");

  const col = db.collection(collectionName);
  return col;
}
