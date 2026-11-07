"""
Security and privacy utilities for Facial Emotion Recognizer AI.
Phase 3 Features:
- Strict upload size limit enforcement (Images: 25MB, Videos: 50MB)
- File extension and container whitelisting
- Magic bytes / content integrity validation
- Zero retention policy enforcement for webcam/temporary frames
"""

from pathlib import Path
from typing import Optional, Tuple
from backend.app.core.config import settings


def validate_file_upload(
    filename: str,
    file_size_bytes: int,
    is_video: bool = False,
    header_bytes: Optional[bytes] = None,
    content_type: Optional[str] = None,
) -> Tuple[bool, str]:
    """
    Validates uploaded file against security constraints:
    - Maximum file size limit (MAX_UPLOAD_SIZE_MB for images, MAX_VIDEO_SIZE_MB for videos)
    - File extension whitelisting
    - Container magic bytes / content integrity
    """
    if file_size_bytes == 0:
        return False, "Uploaded file is empty (0 bytes)."

    max_mb = settings.MAX_VIDEO_SIZE_MB if is_video else settings.MAX_UPLOAD_SIZE_MB
    max_bytes = max_mb * 1024 * 1024
    if file_size_bytes > max_bytes:
        return False, f"File size ({file_size_bytes / (1024 * 1024):.2f}MB) exceeds limit of {max_mb}MB."

    ext = Path(filename).suffix.lower()
    allowed_extensions = settings.ALLOWED_VIDEO_EXTENSIONS if is_video else settings.ALLOWED_IMAGE_EXTENSIONS

    if ext not in allowed_extensions:
        allowed_str = ", ".join(allowed_extensions)
        return False, f"Unsupported file extension '{ext}'. Allowed extensions: {allowed_str}"

    # Content integrity check if header bytes are provided
    if header_bytes and len(header_bytes) >= 8:
        if is_video:
            # Check for standard video container signatures
            is_mp4_mov = (
                b"ftyp" in header_bytes[:16]
                or b"moov" in header_bytes[:16]
                or b"mdat" in header_bytes[:16]
                or b"wide" in header_bytes[:16]
            )
            is_webm = header_bytes[:4] == b"\x1a\x45\xdf\xa3"

            if not (is_mp4_mov or is_webm):
                # Reject files that merely disguised extension (e.g. text or arbitrary binary)
                return False, f"Invalid or corrupted video container for '{filename}'. Header does not match supported video format."
        else:
            # Image signatures: JPEG (0xFFD8FF), PNG (0x89504E47), WebP (RIFF....WEBP)
            is_jpeg = header_bytes[:2] == b"\xff\xd8"
            is_png = header_bytes[:4] == b"\x89PNG"
            is_webp = header_bytes[:4] == b"RIFF" and b"WEBP" in header_bytes[:16]

            if not (is_jpeg or is_png or is_webp):
                return False, f"Invalid image file signature for '{filename}'. Content does not match supported image format."

    return True, "Valid"
