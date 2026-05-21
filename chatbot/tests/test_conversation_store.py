import pytest

from app.services.conversation_store import SQLiteConversationStore


@pytest.mark.asyncio
async def test_sqlite_conversation_store_persists_recent_messages(tmp_path) -> None:
    store = SQLiteConversationStore(str(tmp_path / "chatbot.sqlite3"))

    await store.append("conv_1", "user", "Xin chào")
    await store.append("conv_1", "assistant", "Chào bạn")

    messages = await store.get_recent("conv_1", limit=8)

    assert [(message.role, message.content) for message in messages] == [
        ("user", "Xin chào"),
        ("assistant", "Chào bạn"),
    ]

