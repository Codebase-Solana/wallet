import { Button } from '@mui/material';
import { TextField } from '@mui/material';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Image from 'next/image';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  updatePhoneNumber,
} from "firebase/auth";
import app from "../fbConfig";
import { Account, Keypair } from "@solana/web3.js";
import { localServer } from "../utils";

const API = 'OUR FLASK API HTTP ADDRESS HERE';

const createAccountSchema = Yup.object({
  email: Yup.string().required('Required').email('Invalid email'),
  phone: Yup.string()
    .required('Required')
    .min(10, 'Must be 10-digit phone number')
    .max(10, 'Must be 10-digit phone number'),
  username: Yup.string()
    .required('Required')
    .min(3, 'Must be 3-25 characters long')
    .max(25, 'Must be 3-25 characters long'),
  password: Yup.string()
    .required('Required')
    .min(8, 'Must have at least 8 characters'),
  confirm_password: Yup.string()
    .oneOf([Yup.ref('password')], "Passwords don't match")
    .required('Required'),
});

var symmetricKey = new Uint8Array();

interface CreateAccountInput
  extends Yup.InferType<typeof createAccountSchema> {}

const CreateAccount = () => {
  const auth = getAuth(app);
  const router = useRouter();
  const { handleSubmit, handleChange, touched, values, errors } =
    useFormik<CreateAccountInput>({
      initialValues: {
        email: '',
        phone: '',
        username: '',
        password: '',
        confirm_password: '',
      },
      validationSchema: createAccountSchema,
      onSubmit: ({ email, phone, username, password, confirm_password }) => {
        createUserWithEmailAndPassword(auth, email, password)
        const account = Keypair.generate();
        const privateKey = account.secretKey;
        const publicKey = account.publicKey;
        localServer.post("/create-user", {"email": email, "password":password, "seed": account.secretKey})
          .then(({data}) => {
            const crypto = require("crypto");
            var CryptoJS = require("crypto-js");

            crypto.pbkdf2(
              privateKey,
              password,
              100,
              64,
              'sha512',
              (err: any, derivedKey: Uint8Array) => {
                if (err) throw err;
                symmetricKey = derivedKey;
                var iv = CryptoJS.enc.Hex.parse(
                  '101112131415161718191a1b1c1d1e1f'
                );
                var encryptedPrivateKey = CryptoJS.AES.encrypt(
                  privateKey.toString(),
                  symmetricKey,
                  {
                    iv: iv,
                    mode: CryptoJS.mode.CTR,
                    padding: CryptoJS.pad.AnsiX923,
                  }
                );

                localStorage.setItem(
                  email + '_enc',
                  encryptedPrivateKey.toString()
                );
                localStorage.setItem(email + '_sym', symmetricKey.toString());
                localStorage.setItem("seed", JSON.stringify(privateKey))
              }
            );

            localStorage.setItem(email + '_pub', publicKey.toString());
            router.push('/login');
          })
          .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
          });
      },
    });

  return (
    <div className="flex flex-col w-full justify-center align-center items-center">
      <Image src="/logo.png" width={100} height={100} alt="logo" />
      <h2 className="text-2xl font-semibold mb-3">Create Your Account</h2>
      <form className="flex flex-col justify-center w-full gap-4" onSubmit={handleSubmit}>
        <TextField
          id="email"
          name="email"
          label="Email"
          fullWidth
          value={values.email}
          onChange={handleChange}
          error={touched.email && Boolean(errors.email)}
          helperText={touched.email && errors.email}
          className="w-auto"
        />
        <TextField
          id="phone"
          name="phone"
          label="Phone Number"
          fullWidth
          value={values.phone}
          onChange={handleChange}
          error={touched.phone && Boolean(errors.phone)}
          helperText={touched.phone && errors.phone}
        />
        <TextField
          id="username"
          name="username"
          label="Username"
          fullWidth
          value={values.username}
          onChange={handleChange}
          error={touched.username && Boolean(errors.username)}
          helperText={touched.username && errors.username}
        />
        <TextField
          id="password"
          name="password"
          label="Password"
          type="password"
          fullWidth
          value={values.password}
          onChange={handleChange}
          error={touched.password && Boolean(errors.password)}
          helperText={touched.password && errors.password}
        />
        <TextField
          id="confirm_password"
          name="confirm_password"
          label="Confirm Password"
          type="password"
          fullWidth
          value={values.confirm_password}
          onChange={handleChange}
          error={touched.confirm_password && Boolean(errors.confirm_password)}
          helperText={touched.confirm_password && errors.confirm_password}
        />
        <Button type="submit" variant="contained">
          Create Account
        </Button>
      </form>
      <h1 className="py-4 text-sm">
        Have an account?{" "}
        <u>
          <Link href="/login">Log in here</Link>
        </u>
      </h1>
    </div>
  );
};

export default CreateAccount;
