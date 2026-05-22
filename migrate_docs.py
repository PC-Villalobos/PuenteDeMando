#!/usr/bin/env python3
"""Batch migrate Google Docs in Drive folders to plain Markdown files.

This script is the local/Antigravity companion to the GAS
Zoro_MigrateDocsToMD(folderId) function. It exports Google Docs as HTML,
converts the common structure to Markdown, uploads .md files back into the
same Drive folder, and logs each operation to the Thousand Sunny Bitacora
sheet when requested.
"""

from __future__ import annotations

import argparse
import io
import json
import os
import re
import sys
import unicodedata
from dataclasses import dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Iterable


DOC_MIME = "application/vnd.google-apps.document"
FOLDER_MIME = "application/vnd.google-apps.folder"
MARKDOWN_MIME = "text/markdown"
BITACORA_SHEET_ID = "1OGgPJdKYB12v7V3CfBP2P4P6ERB6vpM4gXzaVfHMvWQ"
SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
]


class SimpleHtmlToMarkdown(HTMLParser):
    """Small dependency-free converter for Google Docs HTML exports."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.list_stack: list[str] = []
        self.link_stack: list[str | None] = []
        self.heading_level: int | None = None
        self.in_pre = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = dict(attrs)
        if tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self._block()
            self.heading_level = int(tag[1])
            self.parts.append("#" * self.heading_level + " ")
        elif tag == "p":
            self._block()
        elif tag in {"strong", "b"}:
            self.parts.append("**")
        elif tag in {"em", "i"}:
            self.parts.append("*")
        elif tag == "br":
            self.parts.append("\n")
        elif tag == "pre":
            self._block()
            self.in_pre = True
            self.parts.append("```\n")
        elif tag == "code" and not self.in_pre:
            self.parts.append("`")
        elif tag in {"ul", "ol"}:
            self.list_stack.append(tag)
            self._block()
        elif tag == "li":
            self._block()
            indent = "  " * max(0, len(self.list_stack) - 1)
            bullet = "1. " if self.list_stack and self.list_stack[-1] == "ol" else "- "
            self.parts.append(indent + bullet)
        elif tag == "a":
            self.link_stack.append(attrs_dict.get("href"))
            self.parts.append("[")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self.heading_level = None
            self._block()
        elif tag == "p":
            self._block()
        elif tag in {"strong", "b"}:
            self.parts.append("**")
        elif tag in {"em", "i"}:
            self.parts.append("*")
        elif tag == "pre":
            self.parts.append("\n```")
            self.in_pre = False
            self._block()
        elif tag == "code" and not self.in_pre:
            self.parts.append("`")
        elif tag in {"ul", "ol"}:
            if self.list_stack:
                self.list_stack.pop()
            self._block()
        elif tag == "li":
            self.parts.append("\n")
        elif tag == "a":
            href = self.link_stack.pop() if self.link_stack else None
            if href:
                self.parts.append(f"]({href})")
            else:
                self.parts.append("]")

    def handle_data(self, data: str) -> None:
        if self.in_pre:
            self.parts.append(data)
        else:
            self.parts.append(re.sub(r"\s+", " ", data))

    def markdown(self) -> str:
        text = "".join(self.parts)
        text = re.sub(r"[ \t]+\n", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip() + "\n"

    def _block(self) -> None:
        current = "".join(self.parts)
        if current and not current.endswith("\n\n"):
            if current.endswith("\n"):
                self.parts.append("\n")
            else:
                self.parts.append("\n\n")


@dataclass
class MigrationConfig:
    folder_id: str
    recursive: bool
    dry_run: bool
    overwrite: bool
    local_out: Path | None
    log_sheet_id: str | None


def import_google_libs() -> dict[str, Any]:
    try:
        import google.auth
        from google.oauth2.credentials import Credentials
        from google.oauth2.service_account import Credentials as ServiceAccountCredentials
        from google_auth_oauthlib.flow import InstalledAppFlow
        from google.auth.transport.requests import Request
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaIoBaseDownload, MediaIoBaseUpload
    except ImportError as exc:
        raise SystemExit(
            "Missing Google client libraries. Install with:\n"
            "  python -m pip install google-api-python-client google-auth "
            "google-auth-oauthlib"
        ) from exc

    return {
        "google_auth": google.auth,
        "Credentials": Credentials,
        "ServiceAccountCredentials": ServiceAccountCredentials,
        "InstalledAppFlow": InstalledAppFlow,
        "Request": Request,
        "build": build,
        "MediaIoBaseDownload": MediaIoBaseDownload,
        "MediaIoBaseUpload": MediaIoBaseUpload,
    }


def get_credentials(args: argparse.Namespace, libs: dict[str, Any]) -> Any:
    if args.service_account:
        return libs["ServiceAccountCredentials"].from_service_account_file(
            args.service_account, scopes=SCOPES
        )

    token_path = Path(args.token)
    creds = None
    if token_path.exists():
        creds = libs["Credentials"].from_authorized_user_file(str(token_path), SCOPES)

    if creds and creds.expired and creds.refresh_token:
        creds.refresh(libs["Request"]())
        token_path.write_text(creds.to_json(), encoding="utf-8")

    if creds and creds.valid:
        return creds

    if args.client_secret:
        flow = libs["InstalledAppFlow"].from_client_secrets_file(args.client_secret, SCOPES)
        creds = flow.run_local_server(port=0)
        token_path.write_text(creds.to_json(), encoding="utf-8")
        return creds

    creds, _ = libs["google_auth"].default(scopes=SCOPES)
    return creds


def list_files(service: Any, folder_id: str, mime_type: str) -> list[dict[str, Any]]:
    query = (
        f"'{folder_id}' in parents and mimeType = '{mime_type}' and trashed = false"
    )
    files: list[dict[str, Any]] = []
    page_token = None
    while True:
        response = (
            service.files()
            .list(
                q=query,
                spaces="drive",
                fields="nextPageToken, files(id, name, mimeType, parents, modifiedTime)",
                pageToken=page_token,
                pageSize=1000,
                supportsAllDrives=True,
                includeItemsFromAllDrives=True,
            )
            .execute()
        )
        files.extend(response.get("files", []))
        page_token = response.get("nextPageToken")
        if not page_token:
            return files


def iter_docs(service: Any, folder_id: str, recursive: bool) -> Iterable[dict[str, Any]]:
    for doc in list_files(service, folder_id, DOC_MIME):
        doc["folderId"] = folder_id
        yield doc
    if recursive:
        for folder in list_files(service, folder_id, FOLDER_MIME):
            yield from iter_docs(service, folder["id"], recursive=True)


def export_doc_html(service: Any, libs: dict[str, Any], file_id: str) -> str:
    request = service.files().export_media(fileId=file_id, mimeType="text/html")
    buffer = io.BytesIO()
    downloader = libs["MediaIoBaseDownload"](buffer, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    return buffer.getvalue().decode("utf-8", errors="replace")


def html_to_markdown(html: str) -> str:
    parser = SimpleHtmlToMarkdown()
    parser.feed(html)
    parser.close()
    return parser.markdown()


def md_name(source_name: str) -> str:
    name = re.sub(r"\.gdoc$", "", source_name, flags=re.IGNORECASE)
    if not name.lower().endswith(".md"):
        name += ".md"
    return name


def find_existing(service: Any, folder_id: str, name: str) -> dict[str, Any] | None:
    safe_name = name.replace("'", "\\'")
    query = (
        f"'{folder_id}' in parents and name = '{safe_name}' and trashed = false"
    )
    response = (
        service.files()
        .list(
            q=query,
            spaces="drive",
            fields="files(id, name, mimeType)",
            pageSize=1,
            supportsAllDrives=True,
            includeItemsFromAllDrives=True,
        )
        .execute()
    )
    files = response.get("files", [])
    return files[0] if files else None


def upload_markdown(
    service: Any,
    libs: dict[str, Any],
    folder_id: str,
    name: str,
    markdown: str,
    overwrite: bool,
) -> dict[str, Any]:
    media = libs["MediaIoBaseUpload"](
        io.BytesIO(markdown.encode("utf-8")),
        mimetype=MARKDOWN_MIME,
        resumable=False,
    )
    existing = find_existing(service, folder_id, name)
    if existing and overwrite:
        return (
            service.files()
            .update(
                fileId=existing["id"],
                media_body=media,
                fields="id, name, webViewLink, mimeType",
                supportsAllDrives=True,
            )
            .execute()
        )
    if existing:
        stem, suffix = os.path.splitext(name)
        name = f"{stem}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}{suffix}"

    metadata = {"name": name, "parents": [folder_id], "mimeType": MARKDOWN_MIME}
    return (
        service.files()
        .create(
            body=metadata,
            media_body=media,
            fields="id, name, webViewLink, mimeType",
            supportsAllDrives=True,
        )
        .execute()
    )


def bitacora_range(sheets: Any, sheet_id: str) -> str:
    spreadsheet = (
        sheets.spreadsheets()
        .get(spreadsheetId=sheet_id, fields="sheets.properties.title")
        .execute()
    )
    titles = [s["properties"]["title"] for s in spreadsheet.get("sheets", [])]
    for title in titles:
        normalized = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode("ascii")
        if normalized.lower().startswith("bitacora"):
            return f"'{title}'!A:G"
    return f"'{titles[0]}'!A:G" if titles else "A:G"


def append_bitacora(sheets: Any, sheet_id: str, message: str) -> None:
    row = [
        datetime.now(timezone.utc).isoformat(),
        "zoro_migrate_docs_to_md",
        "Zoro",
        message,
        "python",
        0,
        "artefactos",
    ]
    sheets.spreadsheets().values().append(
        spreadsheetId=sheet_id,
        range=bitacora_range(sheets, sheet_id),
        valueInputOption="USER_ENTERED",
        insertDataOption="INSERT_ROWS",
        body={"values": [row]},
    ).execute()


def safe_append_bitacora(sheets: Any, sheet_id: str, message: str) -> None:
    try:
        append_bitacora(sheets, sheet_id, message)
    except Exception as exc:
        print(f"Bitacora log failed: {exc}", file=sys.stderr)


def migrate(config: MigrationConfig, drive: Any, sheets: Any, libs: dict[str, Any]) -> dict[str, Any]:
    result: dict[str, Any] = {
        "migrados": [],
        "fallidos": [],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    for doc in iter_docs(drive, config.folder_id, config.recursive):
        try:
            html = export_doc_html(drive, libs, doc["id"])
            markdown = html_to_markdown(html)
            target_name = md_name(doc["name"])

            if config.local_out:
                config.local_out.mkdir(parents=True, exist_ok=True)
                (config.local_out / target_name).write_text(markdown, encoding="utf-8")

            if config.dry_run:
                uploaded = {"id": None, "name": target_name, "webViewLink": None, "mimeType": MARKDOWN_MIME}
            else:
                uploaded = upload_markdown(
                    drive,
                    libs,
                    doc["folderId"],
                    target_name,
                    markdown,
                    config.overwrite,
                )

            item = {
                "sourceId": doc["id"],
                "sourceName": doc["name"],
                "folderId": doc["folderId"],
                "mdId": uploaded.get("id"),
                "mdName": uploaded.get("name"),
                "url": uploaded.get("webViewLink"),
                "mimeType": uploaded.get("mimeType"),
            }
            result["migrados"].append(item)
            if config.log_sheet_id and not config.dry_run:
                safe_append_bitacora(
                    sheets,
                    config.log_sheet_id,
                    f"OK {doc['name']} -> {uploaded.get('name')} ({uploaded.get('id')})",
                )
        except Exception as exc:  # Keep the batch moving.
            failed = {"sourceId": doc.get("id"), "sourceName": doc.get("name"), "error": str(exc)}
            result["fallidos"].append(failed)
            if config.log_sheet_id and not config.dry_run:
                safe_append_bitacora(
                    sheets,
                    config.log_sheet_id,
                    f"ERROR {doc.get('name')} ({doc.get('id')}): {exc}",
                )

    return result


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--folder-id", required=True, help="Drive folder id to migrate")
    parser.add_argument("--recursive", action="store_true", help="Recurse through subfolders")
    parser.add_argument("--dry-run", action="store_true", help="Convert but do not upload or log")
    parser.add_argument("--overwrite", action="store_true", help="Update existing .md files with same name")
    parser.add_argument("--local-out", type=Path, help="Optional local folder for exported .md files")
    parser.add_argument("--bitacora-sheet-id", default=BITACORA_SHEET_ID, help="Sheet id for operation logs")
    parser.add_argument("--no-bitacora", action="store_true", help="Disable Google Sheets logging")
    parser.add_argument("--service-account", help="Path to service-account JSON credentials")
    parser.add_argument("--client-secret", help="OAuth client_secret.json for installed app flow")
    parser.add_argument("--token", default="token.json", help="OAuth token cache path")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    libs = import_google_libs()
    creds = get_credentials(args, libs)
    drive = libs["build"]("drive", "v3", credentials=creds, cache_discovery=False)
    sheets = libs["build"]("sheets", "v4", credentials=creds, cache_discovery=False)
    config = MigrationConfig(
        folder_id=args.folder_id,
        recursive=args.recursive,
        dry_run=args.dry_run,
        overwrite=args.overwrite,
        local_out=args.local_out,
        log_sheet_id=None if args.no_bitacora else args.bitacora_sheet_id,
    )
    print(json.dumps(migrate(config, drive, sheets, libs), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
