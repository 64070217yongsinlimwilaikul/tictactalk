import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import { Link } from 'react-router-dom';
import { Alert, TextField } from '@mui/material';
import { useUserAuth } from '../context/UserAuthContext';

const Login = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { logIn } = useUserAuth();

  const togglePasswordVisibility = () => {
    setPasswordVisible((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await logIn(email, password);
    } catch (err) {
      switch (err.code) {
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/user-not-found':
          setError('User not found');
          break;
        case 'auth/wrong-password':
          setError('Invalid email or password');
          break;
        default:
          setError('Something went wrong. Please try again.');
          break;
      }
    }
  };

  return (
    <div>
      {error && <Alert severity="error" variant="filled" className='my-3'>{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4 relative">
          <TextField type='email'
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

        <Link to="/Register" className="text-sm text-blue-500 block mb-4 float-start">
          Forgot Password?
        </Link>
        <button type="submit" className="float-right w-32 p-2 rounded mb-2" style={{ backgroundColor: "#A1EEBD", color: "#0B6C2E" }}>
          Log In
        </button>
      </form>

    </div>
  );
};

export default Login;
