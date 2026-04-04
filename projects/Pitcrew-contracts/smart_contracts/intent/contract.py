from algopy import ARC4Contract, String, UInt64
from algopy.arc4 import abimethod


class Intent(ARC4Contract):
    """
    Lightweight on-chain helper contract for the Pitcrew MVP.

    The MVP keeps intent storage and trigger orchestration in the backend,
    then asks the user to approve real transactions via wallet signing.
    This contract provides deterministic helper methods that can be called
    from clients without auto-executing funds.
    """

    @abimethod()
    def hello(self, name: String) -> String:
        return "Hello, " + name

    @abimethod()
    def version(self) -> String:
        return String("pitcrew-intent-v1")

    @abimethod()
    def validate_drop_threshold(self, drop_percent: UInt64) -> UInt64:
        """Returns 1 when drop_percent is in [1, 100], else 0."""
        if drop_percent == 0:
            return UInt64(0)
        if drop_percent > 100:
            return UInt64(0)
        return UInt64(1)

    @abimethod()
    def calculate_drop_percent(
        self,
        initial_price_micro_usd: UInt64,
        current_price_micro_usd: UInt64,
    ) -> UInt64:
        """
        Returns percentage drop as an integer.

        Example:
        initial=200000 (0.20), current=190000 (0.19) => 5
        """
        if initial_price_micro_usd == 0:
            return UInt64(0)
        if current_price_micro_usd >= initial_price_micro_usd:
            return UInt64(0)

        drop = initial_price_micro_usd - current_price_micro_usd
        return (drop * 100) // initial_price_micro_usd

    @abimethod()
    def is_triggered(
        self,
        initial_price_micro_usd: UInt64,
        current_price_micro_usd: UInt64,
        target_drop_percent: UInt64,
    ) -> UInt64:
        """Returns 1 if the price-drop condition is met, else 0."""
        computed_drop = self.calculate_drop_percent(
            initial_price_micro_usd=initial_price_micro_usd,
            current_price_micro_usd=current_price_micro_usd,
        )
        if computed_drop >= target_drop_percent:
            return UInt64(1)
        return UInt64(0)

    @abimethod()
    def intent_note(
        self,
        user: String,
        recipient: String,
        amount_micro_algo: String,
        target_drop_percent: String,
    ) -> String:
        """
        Returns a canonical note string that clients can attach to txns.

        Format:
        PITCREW|user=<addr>|to=<addr>|amt=<microAlgo>|drop=<pct>
        """
        return (
            "PITCREW|user="
            + user
            + "|to="
            + recipient
            + "|amt="
            + amount_micro_algo
            + "|drop="
            + target_drop_percent
        )
