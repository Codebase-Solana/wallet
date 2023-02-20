import type { NextPage } from "next";
import { Button } from "@mui/material";
import { TextField } from "@mui/material";
import React from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import app from "../fbConfig";
import { API } from "./api";
import { localServer } from "../utils";

const Login: NextPage = () => {
  const router = useRouter();
  const LoginSchema = Yup.object({
    email: Yup.string().required("Required").email("Invalid email"),
    password: Yup.string().required("Required"),
  });
  const auth = getAuth(app);
  const [loginError, setLoginError] = React.useState("");

  const { handleSubmit, handleChange, touched, values, errors } = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: LoginSchema,
    onSubmit: ({ email, password }) => {
      signInWithEmailAndPassword(auth, email, password)
      localServer.post("/login-user", {"email": email, "password":password})
        .then(({data}) => {
          console.log(data["success"]);
          router.push("/dashboard");
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.log(errorCode);
          switch (errorCode) {
            case "auth/user-not-found":
              setLoginError("User not found.");
              break;
            case "auth/wrong-password":
              setLoginError("Wrong password.");
              break;
            case "auth/too-many-requests":
              setLoginError("Too many login requests.");
            default:
              setLoginError(errorMessage);
          }
        });
    },
  });

  return (
    <div className="flex flex-col justify-center align-center items-center">
      <Image src="/logo.png" width={150} height={150} alt="logo" />
      <h1 className="my-2 text-3xl font-semibold">Defender</h1>
      <form className="flex flex-col justify-center w-full gap-4 py-4" onSubmit={handleSubmit}>
        <TextField
          id="email"
          label="Email"
          fullWidth
          value={values.email}
          onChange={handleChange}
          error={touched.email && Boolean(errors.email)}
          helperText={touched.email && errors.email}
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          fullWidth
          value={values.password}
          onChange={handleChange}
          error={touched.password && Boolean(errors.password)}
          helperText={touched.password && errors.password}
        />
        <Button type="submit" variant="contained">
          Login
        </Button>
        <div className="text-red-600 text-sm">
          {loginError ? loginError : null}
        </div>
      </form>
      <h1 className="py-4">
        Don&apos;t have an account?{" "}
        <u>
          <Link href="/create-account">Sign up here</Link>
        </u>
      </h1>
    </div>
  );
};

export default Login;
