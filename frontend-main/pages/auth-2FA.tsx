import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Image from "next/image";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { CardActionArea } from "@mui/material";

import { useRouter } from "next/router";

const Auth2FA = () => {
  const router = useRouter();
  const [authCode, setAuthCode] = React.useState("");

  const handleCodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuthCode(e.target.value);
  };
  const handleCancel = () => {
    router.push("/");
  };

  const handleConfirm = () => {
    // do authentication
    router.push("/");
  };

  return (
    <>
      <div className="flex flex-col gap-5 align-center items-center p-4">
        <div>
          <Image
            src="/logo.png"
            alt="app icon"
            width={200}
            height={200}
          ></Image>
        </div>

        <div>
          <Card sx={{ maxWidth: 345 }}>
            <CardActionArea>
              <CardContent>
                <Typography gutterBottom variant="h5" component="div" align = "center">
                  Authentication Code
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  You are violating a set of constraint: ex. trasnsaction over x
                  amount Enter 6 digit authentification code sent to your
                  personal device via SMS to confirm the transaction
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </div>

        <div>
          <TextField
            type="text"
            label="SMS Authentication Code"
            variant="outlined"
            onChange={handleCodeInput}
          ></TextField>
        </div>

        <div className="flex flex-col gap-4">
          <Button
            size="large"
            variant="contained"
            onClick={handleCancel}
            className="bg-fuchsia-700 hover:bg-fuchsia-900"
          >
            Cancel
          </Button>
          <Button
            size="large"
            variant="contained"
            onClick={handleConfirm}
            className="bg-fuchsia-700 hover:bg-fuchsia-900"
          >
            Confirm
          </Button>
        </div>
      </div>
    </>
  );
};

export default Auth2FA;
