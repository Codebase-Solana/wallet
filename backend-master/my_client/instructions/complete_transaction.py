from __future__ import annotations
import typing
from solana.publickey import PublicKey
from solana.system_program import SYS_PROGRAM_ID
from solana.sysvar import SYSVAR_RENT_PUBKEY
from spl.token.constants import TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
from solana.transaction import TransactionInstruction, AccountMeta
import borsh_construct as borsh
from ..program_id import PROGRAM_ID


class CompleteTransactionArgs(typing.TypedDict):
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


class CompleteTransactionAccounts(typing.TypedDict):
    application_state: PublicKey
    escrow_wallet_state: PublicKey
    wallet_to_deposit_to: PublicKey
    user_sending: PublicKey
    user_receiving: PublicKey
    backend_account: PublicKey
    mint_of_token_being_sent: PublicKey


def complete_transaction(
    args: CompleteTransactionArgs,
    accounts: CompleteTransactionAccounts,
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
        AccountMeta(
            pubkey=accounts["wallet_to_deposit_to"], is_signer=False, is_writable=True
        ),
        AccountMeta(pubkey=accounts["user_sending"], is_signer=True, is_writable=True),
        AccountMeta(
            pubkey=accounts["user_receiving"], is_signer=False, is_writable=True
        ),
        AccountMeta(
            pubkey=accounts["backend_account"], is_signer=True, is_writable=True
        ),
        AccountMeta(
            pubkey=accounts["mint_of_token_being_sent"],
            is_signer=False,
            is_writable=False,
        ),
        AccountMeta(pubkey=SYS_PROGRAM_ID, is_signer=False, is_writable=False),
        AccountMeta(pubkey=TOKEN_PROGRAM_ID, is_signer=False, is_writable=False),
        AccountMeta(
            pubkey=ASSOCIATED_TOKEN_PROGRAM_ID, is_signer=False, is_writable=False
        ),
        AccountMeta(pubkey=SYSVAR_RENT_PUBKEY, is_signer=False, is_writable=False),
    ]
    if remaining_accounts is not None:
        keys += remaining_accounts
    identifier = b'"\x98\xc6\xd3x\xa5B\xa1'
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
