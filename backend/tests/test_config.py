import os

from app.config import load_root_env


def test_load_root_env_sets_missing_values(tmp_path, monkeypatch) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text(
        """
        # Comment
        OPENAI_API_KEY=test-key
        export SCOPUS_API_KEY="scopus-key"
        GOOGLE_CSE_ID='google-id'
        """,
        encoding="utf-8",
    )
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("SCOPUS_API_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_CSE_ID", raising=False)

    load_root_env(env_file)

    assert os.environ["OPENAI_API_KEY"] == "test-key"
    assert os.environ["SCOPUS_API_KEY"] == "scopus-key"
    assert os.environ["GOOGLE_CSE_ID"] == "google-id"


def test_load_root_env_keeps_existing_environment_value(tmp_path, monkeypatch) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text("OPENAI_API_KEY=file-key", encoding="utf-8")
    monkeypatch.setenv("OPENAI_API_KEY", "shell-key")

    load_root_env(env_file)

    assert os.environ["OPENAI_API_KEY"] == "shell-key"
