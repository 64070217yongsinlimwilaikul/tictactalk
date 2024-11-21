import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import { Alert, TextField } from '@mui/material';
import { useUserAuth } from '../context/UserAuthContext';
import { motion } from 'framer-motion';

const Register = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signUp } = useUserAuth();

  const togglePasswordVisibility = () => {
    setPasswordVisible((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signUp(email, password);
    } catch (err) {
      switch (err.code) {
        case "auth/invalid-email":
          setError("Invalid email address");
          break;
        case "auth/weak-password":
          setError("Password should be at least 8 characters");
          break;
        case "auth/email-already-in-use":
          setError("Email address is already in use");
          break;
        default:
          setError("Something went wrong. Please try again.");
          break;
      }
      console.log(err);
    }
  };

  return (
    <div>
        {error && <Alert severity="error" variant="filled" className='my-3'>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4 relative">
            <TextField type='text'
              label="Email"
              variant="standard"
              className='w-full'
              onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="mb-4 relative">
            <TextField type={passwordVisible ? 'text' : 'password'}
              label="Password"
              variant="standard"
              className='w-full'
              onChange={(e) => setPassword(e.target.value)} />
            <div
              className="absolute top-5 right-0 pr-2 flex items-center cursor-pointer"
              onClick={togglePasswordVisibility}
            >
              <FontAwesomeIcon icon={passwordVisible ? faEye : faEyeSlash} id="eyeIcon" style={{ color: "#999999" }} />
            </div>
          </div>
          <button type="submit" className="float-right w-32 p-2 rounded mb-2" style={{ backgroundColor: "#A1EEBD", color: "#0B6C2E" }}>
            Register
          </button>
        </form>
    </div>
  );
};

export default Register;
