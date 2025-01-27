import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const account = await prisma.account.findUnique({ where: { username } });

        if (!account || account.password !== password) {
            return res.status(401).json({ error: 'Invalid name or password' });
        }

        const token = jwt.sign({ id: account.id, username: account.username }, JWT_SECRET, { expiresIn: '5d' });

        res.setHeader('Authorization', `Bearer ${token}`);

        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
