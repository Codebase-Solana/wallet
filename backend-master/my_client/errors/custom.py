import typing
from anchorpy.error import ProgramError


class WalletToWithdrawFromInvalid(ProgramError):
    def __init__(self) -> None:
        super().__init__(6000, "Wallet to withdraw from is not owned by owner")

    code = 6000
    name = "WalletToWithdrawFromInvalid"
    msg = "Wallet to withdraw from is not owned by owner"


class InvalidStateIdx(ProgramError):
    def __init__(self) -> None:
        super().__init__(6001, "State index is inconsistent")

    code = 6001
    name = "InvalidStateIdx"
    msg = "State index is inconsistent"


class DelegateNotSetCorrectly(ProgramError):
    def __init__(self) -> None:
        super().__init__(6002, "Delegate is not set correctly")

    code = 6002
    name = "DelegateNotSetCorrectly"
    msg = "Delegate is not set correctly"


class StageInvalid(ProgramError):
    def __init__(self) -> None:
        super().__init__(6003, "Stage is invalid")

    code = 6003
    name = "StageInvalid"
    msg = "Stage is invalid"


class InsufficientFunds(ProgramError):
    def __init__(self) -> None:
        super().__init__(6004, "Insufficient funds")

    code = 6004
    name = "InsufficientFunds"
    msg = "Insufficient funds"


CustomError = typing.Union[
    WalletToWithdrawFromInvalid,
    InvalidStateIdx,
    DelegateNotSetCorrectly,
    StageInvalid,
    InsufficientFunds,
]
CUSTOM_ERROR_MAP: dict[int, CustomError] = {
    6000: WalletToWithdrawFromInvalid(),
    6001: InvalidStateIdx(),
    6002: DelegateNotSetCorrectly(),
    6003: StageInvalid(),
    6004: InsufficientFunds(),
}


def from_code(code: int) -> typing.Optional[CustomError]:
    maybe_err = CUSTOM_ERROR_MAP.get(code)
    if maybe_err is None:
        return None
    return maybe_err
