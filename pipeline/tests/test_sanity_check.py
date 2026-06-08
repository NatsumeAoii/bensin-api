"""Property-based tests for the data sanity check logic.

Validates: Requirements 4.3

These tests import the same `check_price_non_null_ratio` used by both the CI
workflow and `pipeline/sanity_check.main()`, so the validated logic and the
deployed logic cannot drift apart.
"""

from typing import List

from hypothesis import given, settings
from hypothesis import strategies as st

from pipeline.sanity_check import (
    check_price_non_null_ratio,
    check_province_count,
    check_nasional_size,
    MIN_PROVINCE_COUNT,
    MIN_NASIONAL_BYTES,
    MAX_NASIONAL_BYTES,
)


# Strategy: generate a product entry with price_rupiah either None or an int
product_strategy = st.fixed_dictionaries(
    {"price_rupiah": st.one_of(st.none(), st.integers(min_value=1, max_value=50000))}
)


@settings(max_examples=100)
@given(products=st.lists(product_strategy, min_size=0, max_size=200))
def test_property_7_price_non_null_ratio_check(products: List[dict]):
    """Property 7: Price non-null ratio check.

    For any collection of product entries, the sanity check logic SHALL pass
    if and only if the count of entries with non-null price_rupiah divided by
    total entries is >= 0.5.

    **Validates: Requirements 4.3**
    """
    result = check_price_non_null_ratio(products)

    total = len(products)
    if total == 0:
        assert result is False, "Empty product list should fail the check"
    else:
        non_null = sum(1 for p in products if p.get("price_rupiah") is not None)
        expected = (non_null / total) >= 0.5
        assert result is expected, (
            f"Expected {expected} for {non_null}/{total} non-null ratio, got {result}"
        )


@given(n=st.integers(min_value=0, max_value=100))
@settings(max_examples=50)
def test_province_count_check(n: int):
    """check_province_count passes iff there are >= MIN_PROVINCE_COUNT entries."""
    index = {"provinsi": {str(i): {} for i in range(n)}}
    assert check_province_count(index) is (n >= MIN_PROVINCE_COUNT)


@given(size=st.integers(min_value=0, max_value=20 * 1024 * 1024))
@settings(max_examples=100)
def test_nasional_size_check(size: int):
    """check_nasional_size passes iff size is within the inclusive byte range."""
    expected = MIN_NASIONAL_BYTES <= size <= MAX_NASIONAL_BYTES
    assert check_nasional_size(size) is expected
