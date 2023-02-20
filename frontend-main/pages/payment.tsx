import * as React from "react";
import Button from "@mui/material/Button";
import SendIcon from "@mui/icons-material/Send";
import SettingsIcon from "@mui/icons-material/Settings";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Image from "next/image";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { getAuth } from "firebase/auth";
import app from "../fbConfig";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { useRouter } from "next/router";
import { localServer } from "../utils";

var CryptoJS = require("crypto-js");

const Payment = () => {
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [mfaOpen, setMfaOpen] = React.useState(false);
  const [securityCode, setSecurityCode] = React.useState("");
  const [wrongCode, setWrongCode] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [recipientAddress, setrecipientAddress] = React.useState("");

  const auth = getAuth(app);
  const currentUser = auth.currentUser;

  const handleClickOpen = () => {
    setConfirmationOpen(true);
  };
  const handleClose = () => {
    setConfirmationOpen(false);
  };

  const handleMfaClose = () => {
    setMfaOpen(false);
    setWrongCode(false);
    setSecurityCode("");
  };

  const router = useRouter();

  const handlerecipientAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setrecipientAddress(e.target.value);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleSend = async () => {
    if (currentUser) {
      try {
        let parsed = JSON.parse(localStorage.getItem("seed")!);
        let seed = Object.keys(parsed).map((key) => parsed[key]);

        const data = {
          email: currentUser.email,
          code: securityCode,
          seed: seed,
          amount: (parseFloat(amount) * 10 ** 9).toString(),
          recipient_address: recipientAddress,
        };
        const sendTransactionRes = await localServer.post(
          "/send-transaction",
          data
        );
        if (sendTransactionRes.data.is_valid) {
          setWrongCode(false);
          alert(`Successfully sent ${amount} SOL to ${recipientAddress}`);
          router.push("/dashboard");
        } else if (!sendTransactionRes.data.is_valid) {
          setWrongCode(true);
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  const handleConfirmationEmail = () => {
    if (currentUser) {
      localServer
        .post("/send-email", { email: currentUser.email })
        .then((resp) => {
          setMfaOpen(true);
          setConfirmationOpen(false);
        })
        .catch((error) => console.log(error));
    }
  };

  const verifySecurityCode = () => {
    if (currentUser) {
      localServer
        .post("/verify-code", {
          code: securityCode,
          email: currentUser.email,
        })
        .then((resp) => {
          setWrongCode(!resp.data.is_valid);
          if (resp.data.is_valid) {
            setMfaOpen(false);
            setSecurityCode("");
            alert("Transaction confirmed!");
          }
        })
        .catch((error) => console.log(error));
    }
  };

  return (
    <div className="flex flex-col w-full gap-5 align-center items-center p-4">

      <div>
        <Image src="/logo.png" alt="app icon" width={150} height={150}></Image>
        <h2 className="text-3xl font-semibold pt-1">Send SOL</h2>
      </div>

      <div className="flex flex-col gap-5 w-full">
        <TextField
          type="text"
          label="Recipient Wallet Address"
          variant="outlined"
          multiline
          maxRows={2}
          fullWidth
          onChange={handlerecipientAddressChange}
        />
        <TextField
          type="text"
          label="Amount"
          variant="outlined"
          fullWidth
          InputProps={{
            endAdornment: <InputAdornment position="end">SOL</InputAdornment>,
          }}
          onChange={handleAmountChange}
        />
      </div>

      <div className="flex flex-row gap-4 w-full">
        <Button
          size="large"
          variant="contained"
          fullWidth
          onClick={handleCancel}
          className="bg-zinc-800 hover:bg-zinc-900"
        >
          Cancel
        </Button>
        <Button
          size="large"
          variant="contained"
          fullWidth
          endIcon={<SendIcon />}
          onClick={handleClickOpen}
          // className="bg-fuchsia-700 hover:bg-fuchsia-900"
        >
          Send
        </Button>
      </div>

      <div>
        <Dialog open={mfaOpen} onClose={handleMfaClose}>
          <DialogTitle>Verify Transaction</DialogTitle>
          <DialogContent>
            <DialogContentText className="pb-4">
              To confirm this transaction, please enter the 6-digit security
              code sent to your email.
            </DialogContentText>
            <TextField
              fullWidth
              autoFocus
              id="securityCode"
              label="Security Code"
              value={securityCode}
              onChange={(event) => setSecurityCode(event.target.value)}
            />
            <div className="text-red-600 text-sm">
              {wrongCode && "Wrong code"}
            </div>
          </DialogContent>
          <DialogActions className="p-4">
            <Button variant="contained" onClick={handleSend}>
              Verify
            </Button>
          </DialogActions>
        </Dialog>
      </div>

      <div>
        <ConfirmationDialog title="Confirm Send" isOpen={confirmationOpen} handleClose={handleClose} handleConfirm={handleConfirmationEmail}>
          Sending <b>{amount} SOL</b> from Defender escrow wallet to recipient <b>{recipientAddress}</b>:
        </ConfirmationDialog>
      </div>
    </div>
  );
};

export default Payment;
