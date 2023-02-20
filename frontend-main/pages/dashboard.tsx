import * as React from "react";
import Button from "@mui/material/Button";
import IconButton from '@mui/material/IconButton';
import SendIcon from "@mui/icons-material/Send";
import SettingsIcon from "@mui/icons-material/Settings";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import Image from "next/image";
import { useRouter } from "next/router";
import { getAuth } from "firebase/auth";
import { localServer } from "../utils";
import app from "../fbConfig";

const Dashboard = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [escrowBalance, setEscrowBalance] = React.useState("0.0000");
  const [walletBalance, setWalletBalance] = React.useState("0.0000");
  const open = Boolean(anchorEl);
  const router = useRouter();
  const auth = getAuth(app);
  const currentUser = auth.currentUser;

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSend = () => {
    router.push("/payment");
  };

  const handleDeposit = () => {
    router.push("/deposit");
  };

  const handleWithdraw = () => {
    router.push("/withdraw");
  };

  const handleBalance = () => {
    if (currentUser) {
      const userPublicKey = localStorage.getItem(currentUser.email + "_pub");
      const pubKey = { public_key: userPublicKey };
      localServer
        .post("/get-balance", pubKey)
        .then(({ data }) => {
          console.log(data["escrow_balance"]);
          setEscrowBalance(data["escrow_balance"].toFixed(4).toString());
          setWalletBalance(data["wallet_balance"].toFixed(4).toString());
        })
        .catch((error) => {
          console.log(error.code);
        });
    }
  };

  React.useEffect(() => {
    handleBalance();
  }, []);

  return (
    <div className="flex flex-col gap-4 w-full justify-center align-center items-center p-4">
      <div className="flex flex-row w-full mt-2">
        <IconButton
          id="basic-button"
          // aria-controls={open ? "basic-menu" : undefined}
          // aria-haspopup="true"
          // aria-expanded={open ? "true" : undefined}
          onClick={(event) => {
            setAnchorEl(event.currentTarget);
          }}
          // variant="contained"
          className="hover:bg-zinc-800"
        >
          <SettingsIcon />
        </IconButton>
      </div>

      <div>
        <Image src="/logo.png" alt="app icon" width={150} height={150}></Image>
      </div>

      <Card className="p-4">
        <div className="text-5xl pb-2 font-semibold">
          {escrowBalance} SOL
        </div>
        <div className="text-sm pt-2">
          Undeposited Funds: {walletBalance} SOL
        </div>
      </Card>

      <div>
        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            "aria-labelledby": "basic-button",
          }}
        >
          <MenuItem onClick={handleClose}>Set Constraints</MenuItem>
          <MenuItem
            onClick={() => {
              router.push("/");
              handleClose();
            }}
          >
            Logout
          </MenuItem>
        </Menu>
      </div>
      <div className="flex flex-col gap-4">
        <Button
          size="large"
          variant="contained"
          fullWidth
          endIcon={<SendIcon />}
          onClick={handleSend}
          // className="bg-violet-700 hover:bg-violet-900"
        >
          Send
        </Button>
        <Button
          size="large"
          variant="contained"
          fullWidth
          onClick={handleDeposit}
          // className="bg-violet-700 hover:bg-violet-900"
        >
          Deposit
        </Button>
        <Button
          size="large"
          variant="contained"
          fullWidth
          onClick={handleWithdraw}
          // className="bg-violet-700 hover:bg-violet-900"
        >
          Withdraw
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
