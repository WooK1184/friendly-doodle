import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 아이템 생성 API
export const createItem = async (req, res) => {
    const { name, stat, description, rarity, price } = req.body;

    try {
        const item = await prisma.item.create({
            data: {
                name,
                stat,
                description,
                rarity,
                price: price,
            },
        });
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//아이템 수정 API
export const updateItem = async (req, res) => {
    const { id: itemId } = req.params;
    const { name, stat, description, rarity } = req.body;

    try {
        const item = await prisma.item.update({
            where: { id: Number(itemId) },
            data: {
                name,
                stat,
                description,
                rarity,
            },
        });

        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


//아이템 목록 조회 API

export const getItemList = async (req, res) => {
    try {
        // 아이템 데이터 가져오기
        const items = await prisma.item.findMany({
            select: {
                id : true, //아이템 코드
                name: true, // 아이템 이름
                price: true, // 아이템 가격
            },
        });

        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//아이템 상세 조회 API

export const getItemDetails = async (req, res) => {
    const { id } = req.params;

    try {
        // 아이템 조회
        const item = await prisma.item.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true, //아이템 코드
                name: true, // 아이템 이름
                stat: true, // 아이템 스탯
                description: true, // 아이템 설명
                rarity: true, // 아이템 희귀도
                price: true, // 아이템 가격
            },
        });

        if (!item) {
            return res.status(404).json({ error: "Item not found" });
        }

        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 아이템 구입 API
export const buyItems = async (req, res) => {
    const characterId = parseInt(req.params.id);  // URI로부터 캐릭터 ID 가져오기
    const itemsToBuy = req.body;  // 구입할 아이템들의 정보 (id, count)

    try {
        // 캐릭터 조회
        const character = await prisma.character.findUnique({
            where: { id: characterId },
            select: { gameMoney: true, inventoryId: true },
        });

        if (!character) {
            return res.status(404).json({ error: "Character not found" });
        }

        let totalPrice = 0;  // 총 금액
        const inventoryItems = [];  // 구입한 아이템들을 저장할 배열

        // 아이템 가격 계산 및 유효성 검사
        for (const { itemId, count } of itemsToBuy) {
            // 아이템 정보 조회
            const item = await prisma.item.findUnique({
                where: { id: itemId },
                select: { price: true, id: true, name: true },
            });

            if (!item) {
                return res.status(400).json({ error: `Item with id ${id} not found` });
            }

            // 아이템 가격 * 개수 계산
            totalPrice += item.price * count;

            // 구입할 아이템들을 인벤토리에 추가할 데이터로 준비
            inventoryItems.push({
                itemId: item.id,
                quantity: count,
            });
        }

        // 게임 머니가 충분한지 체크
        if (character.gameMoney < totalPrice) {
            return res.status(400).json({ error: "Not enough game money" });
        }

        // 게임 머니 차감
        await prisma.character.update({
            where: { id: characterId },
            data: { gameMoney: character.gameMoney - totalPrice },
        });

        // 아이템을 인벤토리에 추가
        for (const inventoryItem of inventoryItems) {
            await prisma.inventoryItem.create({
                data: {
                    inventoryId: character.inventoryId,
                    itemId: inventoryItem.itemId,
                    quantity: inventoryItem.quantity,
                },
            });
        }

        // 구입 후 변경된 게임 머니 잔액 반환
        res.status(200).json({
            message: "Items purchased successfully",
            remainingGameMoney: character.gameMoney - totalPrice,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};