from __future__ import annotations
import typing
from solana.publickey import PublicKey
from solana.system_program import SYS_PROGRAM_ID
from solana.sysvar import SYSVAR_RENT_PUBKEY
from spl.token.constants import TOKEN_PROGRAM_ID
from solana.transaction import TransactionInstruction, AccountMeta
import borsh_construct as borsh
from ..program_id import PROGRAM_ID


class InitializeNewVaultArgs(typing.TypedDict):
    application_idx: int
    state_bump: int
    wallet_bump: int
    amount: int


layout = borsh.CStruct(
    "application_idx" / borsh.U64,
    "state_bump" / borsh.U8,
    "wallet_bump" / borsh.U8,
    "amount" / borsh.U64,
)


class InitializeNewVaultAccounts(typing.TypedDict):
    application_state: PublicKey
    escrow_wallet_state: PublicKey
    user_sending: PublicKey
    mint_of_token_being_sent: PublicKey
    wallet_to_withdraw_from: PublicKey


def initialize_new_vault(
    args: InitializeNewVaultArgs,
    accounts: InitializeNewVaultAccounts,
    program_id: PublicKey = PROGRAM_ID,
    remaining_accounts: typing.Optional[typing.List[AccountMeta]] = None,
) -> TransactionInstruction:
    keys: list[AccountMeta] = [
        AccountMeta(
            pubkey=accounts["application_state"], is_signer=False, is_writable=True
        ),
        AccountMeta(
            pubkey=accounts["escrow_wallet_state"], is_signer=False, is_writable=True
        ),
        AccountMeta(pubkey=accounts["user_sending"], is_signer=True, is_writable=True),
        AccountMeta(
            pubkey=accounts["mint_of_token_being_sent"],
            is_signer=False,
            is_writable=False,
        ),
        AccountMeta(
            pubkey=accounts["wallet_to_withdraw_from"],
            is_signer=False,
            is_writable=True,
        ),
        AccountMeta(pubkey=SYS_PROGRAM_ID, is_signer=False, is_writable=False),
        AccountMeta(pubkey=TOKEN_PROGRAM_ID, is_signer=False, is_writable=False),
        AccountMeta(pubkey=SYSVAR_RENT_PUBKEY, is_signer=False, is_writable=False),
    ]
    if remaining_accounts is not None:
        keys += remaining_accounts
    identifier = b"B\xe5-\x82`\xc5\x9c\x92"
    encoded_args = layout.build(
        {
            "application_idx": args["application_idx"],
            "state_bump": args["state_bump"],
            "wallet_bump": args["wallet_bump"],
            "amount": args["amount"],
        }
    )
    data = identifier + encoded_args
    return TransactionInstruction(keys, program_id, data)
