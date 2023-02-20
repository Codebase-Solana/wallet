from flask import Flask, request, jsonify, make_response
from flask_cors import CORS, cross_origin
import random
import json
import asyncio
import time
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from bson import ObjectId
from datetime import datetime
from solana.publickey import PublicKey
from anchorpy import Provider
from pathlib import Path
import pyrebase 
from solana.publickey import PublicKey
from solana.keypair import Keypair
from solana.transaction import Transaction
from spl.token.instructions import get_associated_token_address, create_associated_token_account
from spl.token.client import Token
from spl.token.constants import WRAPPED_SOL_MINT
from solana.rpc.api import Client
import datetime
import spl      
from my_client.instructions import deposit, initialize_new_vault, complete_transaction, withdraw

client = Client("https://api.devnet.solana.com")

app = Flask(__name__)
CORS(app, supports_credentials=True, origins="*")

SOLANA_EMAIL = 'solana2fa@gmail.com'
SG_API_KEY = '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'
trialID = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
TOKEN_PROGRAM_ID = spl.token.constants.TOKEN_PROGRAM_ID

MY_PROGRAM_ID = PublicKey("5Nh6B8mvMuHkn9bgB2Sh59zypRLVcHNCe5bBQyE1b2Ey")

BACKEND_WALLET = Keypair.from_secret_key(bytes([
      144, 247, 101, 216, 217, 74, 146, 124, 188, 130, 198, 201, 95, 115, 70,
      28, 91, 48, 180, 87, 222, 168, 5, 197, 197, 156, 178, 231, 122, 87, 74,
      87, 47, 200, 72, 129, 31, 62, 119, 90, 57, 252, 240, 34, 145, 192, 141,
      109, 173, 173, 114, 196, 154, 194, 157, 116, 205, 124, 93, 252, 35, 148,
      185, 171,
    ]))

with Path("./firebase_config.json").open() as f: 
    config = json.load(f)
firebase = pyrebase.initialize_app(config)
auth = firebase.auth()
authentication_mappings = {}

class JSONEncoder(json.JSONEncoder):
    def default(self,o):
        if (isinstance(o,ObjectId)):
            return str(o)
        elif (isinstance(o,datetime)):
            return o.isoformat()
        return json.JSONEncoder.default(self,o)

@app.route('/send-email', methods=['POST'])
@cross_origin(supports_credentials=True)
def send_email():
    global authentication_mappings
    
    req_data = request.json
    recipient_address = req_data['email']
    code = random.choice(range(100000, 999999 + 1))
    authentication_mappings[recipient_address] =  code
    message = Mail(
        from_email=SOLANA_EMAIL,
        to_emails = recipient_address,
        subject = f'Authenticate Transaction: {code}',
        html_content=f'<strong>Please verify your transaction using this code: {code}</strong>'
    )
    
    try:   
        sg = SendGridAPIClient(SG_API_KEY)
        sg.send(message)
    except Exception as e:
        print(e)
    
    return JSONEncoder().encode({'success': True})

@app.route('/send-transaction', methods=['POST'])
@cross_origin(supports_credentials=True)
def verify_code():
    req_data = request.json
    entered_code = req_data['code']
    user_email = req_data['email'] 

    if authentication_mappings[user_email] != int(entered_code): 
        return JSONEncoder().encode({'is_valid': False})
    else:
        seed = req_data['seed']
        senderKeypair = Keypair.from_secret_key(bytes(seed))
        amount = req_data['amount']
        recipientPubkey = PublicKey(req_data['recipient_address'])
        send_funds(senderKeypair, recipientPubkey, amount)
        return JSONEncoder().encode({'is_valid': True})

@app.route('/withdraw', methods=['POST'])
@cross_origin(supports_credentials=True)
def withdraw():
    req_data = request.json
    seed = req_data["seed"]
    senderKeypair = Keypair.from_secret_key(bytes(seed))
    amount = req_data["amount"]

    token_account_pubkey = get_associated_token_address(senderKeypair.public_key, WRAPPED_SOL_MINT)
    
    pdaParams = getPda(senderKeypair.public_key, MY_PROGRAM_ID) 
    instruction = withdraw(
        {
        "application_idx" : pdaParams["idx"], 
        "state_bump": pdaParams["stateBump"],
        "wallet_bump": pdaParams["escrowBump"],
        "amount": int(amount),
        },
        {
          "application_state": pdaParams["stateKey"],
          "escrow_wallet_state": pdaParams["escrowWalletKey"],
          "user_sending": senderKeypair.public_key,
          "mint_of_token_being_sent": WRAPPED_SOL_MINT,
          "refund_wallet": token_account_pubkey,
        },
        MY_PROGRAM_ID
    )
    transaction = Transaction().add(instruction)
    provider = Provider.local("https://api.devnet.solana.com")
    asyncio.run(provider.send(transaction, [senderKeypair]))
    return JSONEncoder().encode({'success': True})

@app.route('/create-user', methods=['POST'])
@cross_origin(supports_credentials=True)
def createUser():
    req_data = request.json
    email = req_data["email"]
    password = req_data["password"]
    items = req_data["seed"].items()
    seed = [int(v) for k, v in items]
    senderKeypair = Keypair.from_secret_key(bytes(seed))
    try: 
        auth.create_user_with_email_and_password(email, password)
        initialize(senderKeypair)
        return JSONEncoder().encode({"success": True})
    except Exception as e: 
        print(e)
        initialize(senderKeypair)
        return JSONEncoder().encode({"success": False})

@app.route('/login-user', methods=['POST'])
@cross_origin(supports_credentials=True)
def signIn():
    req_data = request.json
    email = req_data["email"]
    password = req_data["password"]

    try: 
        auth.sign_in_with_email_and_password(email, password)
        return JSONEncoder().encode({"success": True})
    except Exception as e: 
        return JSONEncoder().encode({"success": False})

@app.route('/get-balance', methods=['POST'])
@cross_origin(supports_credentials=True)
def getBalance():
    import time
    time.sleep(10)
    sender_pubkey = PublicKey(request.json["public_key"])
    wallet_lamports = client.get_balance(sender_pubkey).value
    wallet_sols = wallet_lamports / 1000000000

    params = getPda(sender_pubkey, MY_PROGRAM_ID)
    escrow_pubkey = params["escrowWalletKey"]
    escrow_lamports = client.get_balance(escrow_pubkey).value
    escrow_sols = escrow_lamports / 1000000000

    print("wallet, escrow", wallet_sols, escrow_sols)

    return JSONEncoder().encode({"wallet_balance": wallet_sols, "escrow_balance": escrow_sols})

def getPda(senderPubkey, programID): 
    uid = 1
    uid_buffer = uid.to_bytes(8, 'little')
    
    statePubKey, stateBump = PublicKey.find_program_address(
        [
            bytes('state', 'utf-8'), 
            bytes(senderPubkey), 
            bytes(WRAPPED_SOL_MINT), 
            uid_buffer, 
        ], 
        programID
    )
    walletPubKey, walletBump = PublicKey.find_program_address(
        [
            bytes('wallet', 'utf-8'), 
            bytes(senderPubkey), 
            bytes(WRAPPED_SOL_MINT), 
            uid_buffer, 
        ], 
        programID
    )
    result = {'idx': uid, 'escrowBump' :walletBump, 'escrowWalletKey' : walletPubKey, 'stateBump': stateBump, 'stateKey': statePubKey}
    return result 


def initialize(senderKeypair):
    pdaParams = getPda(senderKeypair.public_key, MY_PROGRAM_ID) 
   
    sig = client.request_airdrop(senderKeypair.public_key, int(2e9)).value
    client.confirm_transaction(sig)

    token_account_pubkey = Token(client, WRAPPED_SOL_MINT, TOKEN_PROGRAM_ID, senderKeypair).create_associated_token_account(senderKeypair.public_key)

    instruction = initialize_new_vault(
        {
        "application_idx" : pdaParams["idx"], 
        "state_bump": pdaParams["stateBump"],
        "wallet_bump": pdaParams["escrowBump"],
        "amount": 0,
        },
        {
          "application_state": pdaParams["stateKey"],
          "escrow_wallet_state": pdaParams["escrowWalletKey"],
          "user_sending": senderKeypair.public_key,
          "mint_of_token_being_sent": WRAPPED_SOL_MINT,
          "wallet_to_withdraw_from": token_account_pubkey,
        },
        MY_PROGRAM_ID
    )
    transaction = Transaction().add(instruction)
    provider = Provider.local("https://api.devnet.solana.com")
    asyncio.run(provider.send(transaction, [senderKeypair]))

def send_funds(senderKeypair, receiverPubkey, amount):
    pdaParams = getPda(senderKeypair.public_key, MY_PROGRAM_ID)
    try:
        token_account_pubkey = Token(client, WRAPPED_SOL_MINT, TOKEN_PROGRAM_ID, senderKeypair).create_associated_token_account(receiverPubkey)
        instruction = complete_transaction(
            {
            "application_idx": pdaParams["idx"], 
            "state_bump": pdaParams["stateBump"],
            "wallet_bump": pdaParams["escrowBump"],
            "amount": int(amount),
            },
            {
            "application_state": pdaParams["stateKey"],
            "escrow_wallet_state": pdaParams["escrowWalletKey"],
            "wallet_to_deposit_to": token_account_pubkey,
            "user_sending": senderKeypair.public_key,
            "user_receiving": receiverPubkey,
            "backend_account": BACKEND_WALLET.public_key,
            "mint_of_token_being_sent": WRAPPED_SOL_MINT,
            },
            MY_PROGRAM_ID
        )
        transaction = Transaction().add(instruction)
        provider = Provider.local("https://api.devnet.solana.com")
        asyncio.run(provider.send(transaction, [senderKeypair, BACKEND_WALLET]))
    except Exception as e:
        print(e)
        token_account_pubkey = get_associated_token_address(receiverPubkey, WRAPPED_SOL_MINT)
        instruction = complete_transaction(
            {
            "application_idx": pdaParams["idx"], 
            "state_bump": pdaParams["stateBump"],
            "wallet_bump": pdaParams["escrowBump"],
            "amount": int(amount),
            },
            {
            "application_state": pdaParams["stateKey"],
            "escrow_wallet_state": pdaParams["escrowWalletKey"],
            "wallet_to_deposit_to": token_account_pubkey,
            "user_sending": senderKeypair.public_key,
            "user_receiving": receiverPubkey,
            "backend_account": BACKEND_WALLET.public_key,
            "mint_of_token_being_sent": WRAPPED_SOL_MINT,
            },
            MY_PROGRAM_ID
        )
        transaction = Transaction().add(instruction)
        provider = Provider.local("https://api.devnet.solana.com")
        asyncio.run(provider.send(transaction, [senderKeypair, BACKEND_WALLET]))

@app.route('/deposit', methods=['POST'])
@cross_origin(supports_credentials=True)
def deposit_funds():
    req_data = request.json
    seed = req_data["seed"]
    senderKeypair = Keypair.from_secret_key(bytes(seed))
    amount = req_data["amount"]

    token_account_pubkey = get_associated_token_address(senderKeypair.public_key, WRAPPED_SOL_MINT)
    wrapped_pubkey = Token.create_wrapped_native_account(client, TOKEN_PROGRAM_ID, senderKeypair.public_key, senderKeypair, int(amount))
    Token(client, WRAPPED_SOL_MINT, TOKEN_PROGRAM_ID, senderKeypair).transfer(wrapped_pubkey, token_account_pubkey, senderKeypair, int(amount))
    
    pdaParams = getPda(senderKeypair.public_key, MY_PROGRAM_ID) 
    instruction = deposit(
        {
        "application_idx" : pdaParams["idx"], 
        "state_bump": pdaParams["stateBump"],
        "wallet_bump": pdaParams["escrowBump"],
        "amount": int(amount),
        },
        {
          "application_state": pdaParams["stateKey"],
          "escrow_wallet_state": pdaParams["escrowWalletKey"],
          "user_sending": senderKeypair.public_key,
          "mint_of_token_being_sent": WRAPPED_SOL_MINT,
          "wallet_to_withdraw_from": token_account_pubkey,
        },
        MY_PROGRAM_ID
    )
    transaction = Transaction().add(instruction)
    provider = Provider.local("https://api.devnet.solana.com")
    asyncio.run(provider.send(transaction, [senderKeypair]))
    return JSONEncoder().encode({'success': True})



if __name__ == '__main__':
    app.run(port=5000)