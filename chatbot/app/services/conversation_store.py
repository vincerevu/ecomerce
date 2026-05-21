from pathlib import Path

import aiosqlite

from app.schemas.chat import ChatMessage


class SQLiteConversationStore:
    def __init__(self, sqlite_path: str) -> None:
        self._sqlite_path = sqlite_path

    async def initialize(self) -> None:
        Path(self._sqlite_path).parent.mkdir(parents=True, exist_ok=True)
        async with aiosqlite.connect(self._sqlite_path) as db:
            await db.execute(
                """
                create table if not exists chat_messages (
                  id integer primary key autoincrement,
                  conversation_id text not null,
                  role text not null check (role in ('user', 'assistant')),
                  content text not null,
                  created_at text not null default current_timestamp
                )
                """
            )
            await db.execute(
                "create index if not exists idx_chat_messages_conversation on chat_messages (conversation_id, id)"
            )
            await db.commit()

    async def append(self, conversation_id: str, role: str, content: str) -> None:
        await self.initialize()
        async with aiosqlite.connect(self._sqlite_path) as db:
            await db.execute(
                "insert into chat_messages (conversation_id, role, content) values (?, ?, ?)",
                (conversation_id, role, content),
            )
            await db.commit()

    async def get_recent(self, conversation_id: str, limit: int = 8) -> list[ChatMessage]:
        await self.initialize()
        async with aiosqlite.connect(self._sqlite_path) as db:
            cursor = await db.execute(
                """
                select role, content
                from chat_messages
                where conversation_id = ?
                order by id desc
                limit ?
                """,
                (conversation_id, limit),
            )
            rows = await cursor.fetchall()

        return [ChatMessage(role=role, content=content) for role, content in reversed(rows)]
