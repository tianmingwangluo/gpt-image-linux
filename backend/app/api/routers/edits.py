import asyncio
import mimetypes
from dataclasses import dataclass

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from ..gallery_archive import max_upload_bytes
from ..jobs import build_edit_request_from_form, queue_edit_job
from ..uploads import (
    IMAGE_UPLOAD_CONTENT_TYPES,
    is_image_upload,
    resolve_upload_content_type,
    validate_upload_image_bytes,
)
from ...core import settings as config
from ...repositories import storage
from ...schemas.models import EditRequest, GenerateJobResponse


router = APIRouter()


@dataclass(frozen=True)
class EditImageSource:
    image_bytes: bytes
    filename: str
    content_type: str


def edit_request_from_form(
    prompt: str = Form(...),
    size: str = Form("auto"),
    model: str = Form("gpt-image-2"),
    n: int = Form(1),
    quality: str = Form("auto"),
    output_format: str = Form("png"),
    output_compression: int | None = Form(None),
    response_format: str | None = Form(None),
    webhook_url: str | None = Form(None),
) -> EditRequest:
    return build_edit_request_from_form(
        prompt=prompt,
        size=size,
        model=model,
        n=n,
        quality=quality,
        output_format=output_format,
        output_compression=output_compression,
        response_format=response_format,
        webhook_url=webhook_url,
    )


def validate_edit_source_bytes(
    image_bytes: bytes,
    filename: str,
    content_type: str,
    *,
    empty_detail: str,
    too_large_detail: str,
):
    if not image_bytes:
        raise HTTPException(status_code=400, detail=empty_detail)
    if len(image_bytes) > max_upload_bytes():
        raise HTTPException(status_code=400, detail=too_large_detail)
    validate_upload_image_bytes(image_bytes, filename, content_type)


async def read_upload_edit_source(image: UploadFile = File(...)) -> EditImageSource:
    if not is_image_upload(image):
        raise HTTPException(status_code=400, detail="Upload must be an image file.")

    image_bytes = await image.read()
    image_content_type = resolve_upload_content_type(image)
    filename = image.filename or "image.png"
    validate_edit_source_bytes(
        image_bytes,
        filename,
        image_content_type,
        empty_detail="Uploaded image is empty.",
        too_large_detail=f"Uploaded image is too large. Max size is {config.MAX_FILE_SIZE_MB} MB.",
    )
    return EditImageSource(image_bytes, filename, image_content_type)


async def read_gallery_edit_source(image_id: str) -> EditImageSource:
    entry = storage.get_gallery_entry(image_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Gallery entry not found")

    path = storage.safe_image_path(entry.filename)
    if not path or not path.exists():
        raise HTTPException(status_code=404, detail="Gallery image file not found")

    try:
        image_bytes = await asyncio.to_thread(path.read_bytes)
    except OSError as e:
        raise HTTPException(status_code=500, detail="Failed to read gallery image") from e

    image_content_type = (
        mimetypes.guess_type(path.name)[0]
        or IMAGE_UPLOAD_CONTENT_TYPES.get(path.suffix.lower(), "application/octet-stream")
    )
    validate_edit_source_bytes(
        image_bytes,
        path.name,
        image_content_type,
        empty_detail="Gallery image is empty",
        too_large_detail=f"Gallery image is too large. Max size is {config.MAX_FILE_SIZE_MB} MB.",
    )
    return EditImageSource(image_bytes, path.name, image_content_type)


@router.post("/api/edits", response_model=GenerateJobResponse, status_code=202)
async def edit_image(
    req: EditRequest = Depends(edit_request_from_form),
    source: EditImageSource = Depends(read_upload_edit_source),
):
    return queue_edit_job(
        req=req,
        image_bytes=source.image_bytes,
        image_filename=source.filename,
        image_content_type=source.content_type,
    )


@router.post(
    "/api/edits/from-gallery/{image_id}",
    response_model=GenerateJobResponse,
    status_code=202,
)
async def edit_image_from_gallery(
    image_id: str,
    req: EditRequest = Depends(edit_request_from_form),
):
    source = await read_gallery_edit_source(image_id)
    return queue_edit_job(
        req=req,
        image_bytes=source.image_bytes,
        image_filename=source.filename,
        image_content_type=source.content_type,
    )
