import * as React from "react";
import Button from "@mui/material/Button";
import SendIcon from "@mui/icons-material/Send";
import SettingsIcon from "@mui/icons-material/Settings";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/router";
import { localServer } from "../utils";
import ConfirmationDialog from "../components/ConfirmationDialog";

const Deposit = () => {
  // const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  // const [mfaOpen, setMfaOpen] = React.useState(false);
  // const [securityCode, setSecurityCode] = React.useState("");
  // const [wrongCode, setWrongCode] = React.useState(false);
  // const [recipientAddress, setrecipientAddress] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const router = useRouter();

  // const handleClickOpen = () => {
  //     setConfirmationOpen(true);
  //   };
  //   const handleClose = () => {
  //     setConfirmationOpen(false);
  //   };

  //   const handleMfaClose = () => {
  //     setMfaOpen(false);
  //     setWrongCode(false);
  //     setSecurityCode("");
  //   };

  //   const handlerecipientAddressChange = (
  //     e: React.ChangeEvent<HTMLInputElement>
  //   ) => {
  //     setrecipientAddress(e.target.value);
  //   };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleClose = () => {
    setDialogOpen(false);
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  const handleDeposit = async () => {
    // let secret_key_enc = localStorage.getItem("rajhataj@gmail.com" + '_enc');
    // let sym_key = localStorage.getItem("rajhataj@gmail.com" + '_sym');
    // let decryptedPrivateKey = CryptoJS.AES.decrypt(secret_key_enc, sym_key);
    // console.log(decryptedPrivateKey.toString());
    let parsed = JSON.parse(localStorage.getItem("seed")!);
    let seed = Object.keys(parsed).map((key) => parsed[key]);
    console.log("seed", seed);
    const res = await localServer.post("/deposit", {
      seed: seed,
      amount: (parseFloat(amount) * 10 ** 9).toString(),
    });
    console.log("DEPOSIT RES: ", res);
    alert(`${amount} SOL deposited!`);
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-col gap-5 justify-center items-center w-full p-4">
      {/* <div className="flex flex-row gap-5 w-full"></div> */}

      <div className="flex flex-col justify-center">
        <Image
          src="/logo.png"
          alt="app icon"
          width={150}
          height={150}
          className="self-center"
        />
        <h1 className="text-2xl font-semibold pt-1">Deposit Into Escrow</h1>
      </div>

      <div>
        <TextField
          type="number"
          label="Amount"
          variant="outlined"
          InputProps={{
            endAdornment: <InputAdornment position="end">SOL</InputAdornment>,
          }}
          value={amount}
          onChange={handleAmountChange}
        />
      </div>

      <div className="flex flex-row gap-4">
        <Button
          size="large"
          variant="contained"
          onClick={handleCancel}
          className="bg-zinc-800 hover:bg-zinc-900"
        >
          Cancel
        </Button>
        <Button
          size="large"
          variant="contained"
          endIcon={<SendIcon />}
          onClick={() => {
            setDialogOpen(true);
          }}
          // className="bg-fuchsia-700 hover:bg-fuchsia-900"
        >
          Deposit
        </Button>
      </div>

      <div>
        <ConfirmationDialog
          title="Confirm Deposit"
          isOpen={dialogOpen}
          handleClose={handleClose}
          handleConfirm={handleDeposit}
        >
          Confirm your deposit of <b>{amount} SOL</b> from personal wallet into
          your Defender escrow wallet:
        </ConfirmationDialog>
      </div>
    </div>
  );
};

export default Deposit;
