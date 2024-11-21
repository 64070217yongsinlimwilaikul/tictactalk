import React, { useState } from 'react';
import Login from './Login'; // Import your Login component
import Register from './Register'; // Import your Register component
import { motion } from 'framer-motion';
import './Auth.css';
import GoogleButton from 'react-google-button';
import { useUserAuth } from '../context/UserAuthContext';

const AuthPage = ({ LoginSet }) => {
    const [login, setLogin] = useState(LoginSet);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { googleSignUp } = useUserAuth();

    const setTrue = () => {
        setLogin(true);
    };
    const setfalse = () => {
        setLogin(false);
    };
    const googlePopup = () => {
        googleSignUp()
    }
    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };
    return (
        <div className="items-center justify-center relative grid h-screen">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="p-8 shadow-md sm:w-96 w-72 mx-auto my-auto grid rounded-xl" style={{ backgroundColor: "#F6D6D6", border: "solid 2px #F6F7C4"}}>
                <div className={`LoginToggle ${login === true ? "left" : "right"}`}>
                    <button className='h-12 w-full z-10 text-center' onClick={setTrue}>
                        <span>Login</span>
                    </button>
                    <button className='h-12 w-full z-10 text-center' onClick={setfalse}>
                        <span>Register</span>
                    </button>
                </div>
                {login ? (
                    <Login keepEmail={email} keepPassword={password} onEmailChange={handleEmailChange} onPasswordChange={handlePasswordChange} />
                ) : (
                    <Register keepEmail={email} keepPassword={password} onEmailChange={handleEmailChange} onPasswordChange={handlePasswordChange} />
                )}
                <div className='flex justify-center items-center gap-2 my-3'>
                    <hr className="h-px border-0 bg-neutral-500 m-auto w-3/4"></hr>
                    <span>OR</span>
                    <hr className="h-px border-0 bg-neutral-500  m-auto w-3/4"></hr>
                </div>
                <GoogleButton
                    onClick={() => googlePopup()}
                    className='m-auto'
                />
            </motion.div>
        </div>
    );
};

export default AuthPage;
