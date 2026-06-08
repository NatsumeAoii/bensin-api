from __future__ import annotations
from typing import Annotated, List, Optional, Literal
from pydantic import BaseModel, Field, StringConstraints


Availability = Literal['available', 'unavailable', 'unknown']

# Pydantic v2 string-constraint aliases (replaces the deprecated constr()).
StrippedStr = Annotated[str, StringConstraints(strip_whitespace=True)]
NonEmptyStr = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1)
]


class ProductModel(BaseModel):
    product: StrippedStr
    price_rupiah: Optional[int] = None
    availability: Availability
    pertamina_updated_at: Optional[str] = None


class ProvinceModel(BaseModel):
    province: StrippedStr
    province_slug: StrippedStr
    pertamina_updated_at: Optional[str] = None
    synced_at: StrippedStr
    products: List[ProductModel]


class IndexProvinceEntry(BaseModel):
    name: StrippedStr
    slug: StrippedStr
    path: StrippedStr
    pertamina_updated_at: Optional[str] = None
    synced_at: StrippedStr
    products_count: int
    file_size_bytes: int


class NationalModel(BaseModel):
    version: NonEmptyStr
    synced_at: NonEmptyStr
    pertamina_updated_at: Optional[str] = None
    provinces: List[ProvinceModel] = Field(..., min_length=1)


class IndexModel(BaseModel):
    api_name: StrippedStr
    version: StrippedStr
    author: StrippedStr
    github_repository: StrippedStr
    synced_at: StrippedStr
    pertamina_updated_at: Optional[str] = None
    provinsi_count: int
    provinsi: dict[str, IndexProvinceEntry]
    endpoints: dict
    notes: Optional[str] = None


class HistoryPointModel(BaseModel):
    """A single recorded price-change event for one product."""
    date: NonEmptyStr
    price_rupiah: int


class HistoryModel(BaseModel):
    """Per-province price history: each product maps to its change events.

    Only price *changes* are stored (change-based/event storage), so the list
    for a product holds one point per actual price revision, not one per sync.
    """
    province: NonEmptyStr
    province_slug: NonEmptyStr
    products: dict[str, List[HistoryPointModel]]
