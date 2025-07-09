"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, updateProfile } from "firebase/auth";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyC-bWuU39I3Evg--AVm5jcRYboheSQlOjY",
  authDomain: "laundrylink-33ee0.firebaseapp.com",
  projectId: "laundrylink-33ee0",
  storageBucket: "laundrylink-33ee0.appspot.com",
  messagingSenderId: "149437762807",
  appId: "1:149437762807:web:9ea9d40f3614995d9997f2",
  measurementId: "G-NTLD2LRFZF",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
  }, []);

  const sendOtp = () => {
    if (!phone) return;

    signInWithPhoneNumber(auth, phone, window.recaptchaVerifier)
      .then((confirmationResult) => {
        setConfirmationResult(confirmationResult);
        alert("OTP sent!");
      })
      .catch((error) => {
        console.error(error);
        alert("Error sending OTP");
      });
  };

  const verifyOtp = () => {
    if (!otp || !confirmationResult) return;

    confirmationResult
      .confirm(otp)
      .then(async (result) => {
        const user = result.user;

        // ✅ Add name to user profile
        await updateProfile(user, {
          displayName: name,
        });

        // ✅ Save to backend (Customer)
        await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firebaseUid: user.uid,
            name,
            phone,
            email,
          }),
        });

        // ✅ Save Address
        await fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            addressLine: address,
          }),
        });

        alert("Registration complete!");
        router.push("/account/profile");
      })
      .catch((error) => {
        console.error(error);
        alert("Invalid OTP");
      });
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white shadow-md rounded-md">
      <h1 className="text-2xl mb-6">Register</h1>

      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />

      <input
        type="text"
        placeholder="Phone (+973...)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />

      <input
        type="text"
        placeholder="Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />

      {!confirmationResult ? (
        <button onClick={sendOtp} className="w-full bg-blue-600 text-white p-2 rounded">
          Send OTP
        </button>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
          />

          <button onClick={verifyOtp} className="w-full bg-green-600 text-white p-2 rounded">
            Verify OTP and Complete Registration
          </button>
        </>
      )}

      <div id="recaptcha-container"></div>
    </div>
  );
}
