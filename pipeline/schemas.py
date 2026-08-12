from __future__ import annotations
from datetime import date, datetime
from typing import Annotated, List, Optional, Literal
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_validator


Availability = Literal['available', 'unavailable', 'unknown']

# Pydantic v2 string-constraint aliases (replaces the deprecated constr()).
StrippedStr = Annotated[str, StringConstraints(strip_whitespace=True)]
NonEmptyStr = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1)
]


class ProductModel(BaseModel):
    model_config = ConfigDict(extra='forbid')
    product: StrippedStr
    price_rupiah: Optional[int] = Field(default=None, ge=1, le=10_000_000)
    availability: Availability
    pertamina_updated_at: Optional[str] = None

    @model_validator(mode='after')
    def validate_price_availability(self) -> 'ProductModel':
        if self.availability == 'available' and self.price_rupiah is None:
            raise ValueError('available products require a positive price')
        if self.availability == 'unavailable' and self.price_rupiah is not None:
            raise ValueError('unavailable products require a null price')
        return self

    @field_validator('pertamina_updated_at')
    @classmethod
    def validate_timestamp(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            datetime.fromisoformat(value.replace('Z', '+00:00'))
        return value


class ProvinceModel(BaseModel):
    model_config = ConfigDict(extra='forbid')
    province: StrippedStr
    province_slug: StrippedStr
    pertamina_updated_at: Optional[str] = None
    synced_at: StrippedStr
    generated_at: Optional[str] = None
    source_status: Optional[Literal['fresh', 'fallback']] = None
    source_snapshot_at: Optional[str] = None
    source_fetched_at: Optional[str] = None
    source_hash: Optional[str] = None
    products: List[ProductModel] = Field(..., min_length=1)

    @model_validator(mode='after')
    def validate_products(self) -> 'ProvinceModel':
        names = [product.product for product in self.products]
        if len(names) != len(set(names)):
            raise ValueError('province products must be unique')
        return self

    @field_validator('synced_at', 'pertamina_updated_at')
    @classmethod
    def validate_timestamp(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            datetime.fromisoformat(value.replace('Z', '+00:00'))
        return value


class IndexProvinceEntry(BaseModel):
    model_config = ConfigDict(extra='forbid')
    name: StrippedStr
    slug: StrippedStr
    path: StrippedStr
    pertamina_updated_at: Optional[str] = None
    synced_at: StrippedStr
    products_count: int = Field(..., ge=0)
    file_size_bytes: int = Field(..., ge=0)


class NationalModel(BaseModel):
    model_config = ConfigDict(extra='forbid')
    version: NonEmptyStr
    synced_at: NonEmptyStr
    pertamina_updated_at: Optional[str] = None
    generated_at: Optional[str] = None
    source_status: Optional[Literal['fresh', 'fallback']] = None
    source_snapshot_at: Optional[str] = None
    source_fetched_at: Optional[str] = None
    source_hash: Optional[str] = None
    provinces: List[ProvinceModel] = Field(..., min_length=1)


class IndexModel(BaseModel):
    model_config = ConfigDict(extra='forbid')
    api_name: StrippedStr
    version: StrippedStr
    author: StrippedStr
    github_repository: StrippedStr
    synced_at: StrippedStr
    pertamina_updated_at: Optional[str] = None
    generated_at: Optional[str] = None
    source_status: Optional[Literal['fresh', 'fallback']] = None
    source_snapshot_at: Optional[str] = None
    source_fetched_at: Optional[str] = None
    source_hash: Optional[str] = None
    provinsi_count: int = Field(..., ge=0)
    provinsi: dict[str, IndexProvinceEntry]
    endpoints: dict
    notes: Optional[str] = None


class HistoryPointModel(BaseModel):
    """A single recorded price-change event for one product."""
    date: str = Field(pattern=r'^\d{4}-\d{2}-\d{2}$')
    price_rupiah: int = Field(..., ge=1, le=10_000_000)

    @field_validator('date')
    @classmethod
    def validate_date(cls, value: str) -> str:
        date.fromisoformat(value)
        return value


class HistoryModel(BaseModel):
    """Per-province price history: each product maps to its change events.

    Only price *changes* are stored (change-based/event storage), so the list
    for a product holds one point per actual price revision, not one per sync.
    """
    province: NonEmptyStr
    province_slug: NonEmptyStr
    products: dict[str, List[HistoryPointModel]]

    @model_validator(mode='after')
    def validate_order(self) -> 'HistoryModel':
        for points in self.products.values():
            dates = [point.date for point in points]
            if dates != sorted(set(dates)):
                raise ValueError('history dates must be unique and ordered')
        return self


class HistoryIndexEntry(BaseModel):
    slug: NonEmptyStr
    name: NonEmptyStr
    path: NonEmptyStr
    point_count: int = Field(..., ge=0)


class HistoryIndexModel(BaseModel):
    count: int = Field(..., ge=0)
    synced_at: NonEmptyStr
    provinsi: List[HistoryIndexEntry]
