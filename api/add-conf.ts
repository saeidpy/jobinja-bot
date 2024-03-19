import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse,
) {
    try {
        if (request.method === "POST") {
            const chatId = request.body.chatId as string;
            const confVal = request.body.confVal as string;
            if (!chatId || !confVal) throw new Error('Pet and owner names required');
            await sql`INSERT INTO Configs (key, value) VALUES (${chatId}, ${confVal});`;
        } else if (request.method === 'GET') {
            const chatId = request.query.chatId as string;
            const configs = await sql`SELECT value FROM Configs WHERE key = ${chatId};`;
            return response.status(200).json({ configs });
        }
    } catch (error) {
        return response.status(500).json({ error });
    }

    const configs = await sql`SELECT * FROM Configs;`;
    return response.status(200).json({ configs });
}