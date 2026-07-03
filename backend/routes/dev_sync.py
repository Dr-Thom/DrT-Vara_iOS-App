"""
Dev-only endpoint to serve clean mobile source tarball to the user's iMac.
Not intended for production — this route is only registered on the Emergent
preview backend and is NOT pushed to Render.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
import subprocess

router = APIRouter(prefix="/api/dev", tags=["dev-sync"])

MOBILE_DIR = Path("/app/mobile")
TARBALL_PATH = Path("/tmp/mobile_src_clean.tar.gz")


def _build_tarball() -> Path:
    """Rebuild the tarball from the current clean /app/mobile source files."""
    subprocess.run(
        [
            "tar",
            "--exclude=node_modules",
            "--exclude=.expo",
            "--exclude=dist",
            "--exclude=android",
            "--exclude=ios",
            "-czf",
            str(TARBALL_PATH),
            "App.js",
            "config.js",
            "index.js",
            "app.json",
            "eas.json",
            "package.json",
            "components/",
            "contexts/",
            "plugins/",
            "screens/",
            "services/",
        ],
        cwd=str(MOBILE_DIR),
        check=True,
    )
    return TARBALL_PATH


@router.get("/mobile-tarball")
async def mobile_tarball():
    if not MOBILE_DIR.exists():
        raise HTTPException(status_code=404, detail="mobile dir not found")
    path = _build_tarball()
    return FileResponse(
        path,
        media_type="application/gzip",
        filename="mobile_src_clean.tar.gz",
    )
