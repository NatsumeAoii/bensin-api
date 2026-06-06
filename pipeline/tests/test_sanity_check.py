"""Property-based tests for the data sanity check logic.

Validates: Requirements 4.3
"""

from typing import List, Optional

from hypothesis import given, settings
from hypothesis import strategies as st


def check_price_non_null_ratio(products: List[dict]) -> bool:
    """Replicate the sanity check logic from sync.yml workflow.

    Returns True (pass) iff non-null price_rupiah count / total >= 0.5.
    Returns False (fail) when total == 0 or ratio < 0.5.
    """
    total = len(products)
    if total == 0:
        return False
    non_null = sum(1 for p in products if p.get("price_rupiah") is not None)
    return (non_null / total) >= 0.5


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
