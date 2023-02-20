import typing
from dataclasses import dataclass
from solana.publickey import PublicKey
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Commitment
import borsh_construct as borsh
from anchorpy.coder.accounts import ACCOUNT_DISCRIMINATOR_SIZE
from anchorpy.error import AccountInvalidDiscriminator
from anchorpy.utils.rpc import get_multiple_accounts
from anchorpy.borsh_extension import BorshPubkey
from ..program_id import PROGRAM_ID


class StateJSON(typing.TypedDict):
    idx: int
    user_sending: str
    mint_of_token_being_sent: str
    escrow_wallet: str


@dataclass
class State:
    discriminator: typing.ClassVar = b"\xd8\x92k^hK\xb6\xb1"
    layout: typing.ClassVar = borsh.CStruct(
        "idx" / borsh.U64,
        "user_sending" / BorshPubkey,
        "mint_of_token_being_sent" / BorshPubkey,
        "escrow_wallet" / BorshPubkey,
    )
    idx: int
    user_sending: PublicKey
    mint_of_token_being_sent: PublicKey
    escrow_wallet: PublicKey

    @classmethod
    async def fetch(
        cls,
        conn: AsyncClient,
        address: PublicKey,
        commitment: typing.Optional[Commitment] = None,
        program_id: PublicKey = PROGRAM_ID,
    ) -> typing.Optional["State"]:
        resp = await conn.get_account_info(address, commitment=commitment)
        info = resp.value
        if info is None:
            return None
        if info.owner != program_id.to_solders():
            raise ValueError("Account does not belong to this program")
        bytes_data = info.data
        return cls.decode(bytes_data)

    @classmethod
    async def fetch_multiple(
        cls,
        conn: AsyncClient,
        addresses: list[PublicKey],
        commitment: typing.Optional[Commitment] = None,
        program_id: PublicKey = PROGRAM_ID,
    ) -> typing.List[typing.Optional["State"]]:
        infos = await get_multiple_accounts(conn, addresses, commitment=commitment)
        res: typing.List[typing.Optional["State"]] = []
        for info in infos:
            if info is None:
                res.append(None)
                continue
            if info.account.owner != program_id:
                raise ValueError("Account does not belong to this program")
            res.append(cls.decode(info.account.data))
        return res

    @classmethod
    def decode(cls, data: bytes) -> "State":
        if data[:ACCOUNT_DISCRIMINATOR_SIZE] != cls.discriminator:
            raise AccountInvalidDiscriminator(
                "The discriminator for this account is invalid"
            )
        dec = State.layout.parse(data[ACCOUNT_DISCRIMINATOR_SIZE:])
        return cls(
            idx=dec.idx,
            user_sending=dec.user_sending,
            mint_of_token_being_sent=dec.mint_of_token_being_sent,
            escrow_wallet=dec.escrow_wallet,
        )

    def to_json(self) -> StateJSON:
        return {
            "idx": self.idx,
            "user_sending": str(self.user_sending),
            "mint_of_token_being_sent": str(self.mint_of_token_being_sent),
            "escrow_wallet": str(self.escrow_wallet),
        }

    @classmethod
    def from_json(cls, obj: StateJSON) -> "State":
        return cls(
            idx=obj["idx"],
            user_sending=PublicKey(obj["user_sending"]),
            mint_of_token_being_sent=PublicKey(obj["mint_of_token_being_sent"]),
            escrow_wallet=PublicKey(obj["escrow_wallet"]),
        )
