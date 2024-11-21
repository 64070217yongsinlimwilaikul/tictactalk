import React, { useEffect, useRef, useState } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Collapse } from '@mui/material';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db, storage } from '../firebase';
import { Edit } from '@mui/icons-material';
import { updateProfile } from 'firebase/auth';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

function HomepageLogging() {
    const [roomCode, setRoomCode] = useState('');
    const { logOut, user } = useUserAuth();
    const navigate = useNavigate();
    const [iserror, setIsError] = useState(false);
    const [error, setError] = useState("");
    const [open, setOpen] = useState(true);
    const [socket, setSocket] = useState(null);
    const [username, setUserName] = useState({
        displayName: user.displayName,
    });
    const [findRoom, setFindRoom] = useState(false);
    const [findTeamRoom, setFindTeamRoom] = useState(false);
    const [countup, setCountup] = useState({ minutes: 0, seconds: 0 });
    const [selectedMode, setSelectedMode] = useState(null);


    const [selectedFile, setSelectedFile] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInputVisible, setIsInputVisible] = useState(false);

    useEffect(() => {

        if (socket) {
            return;
        }
        // const newSocket = io('https://tictactalk.as.r.appspot.com/', {
        //     transports: ['websocket'],
        //     autoConnect: true,
        //     cors: {
        //         origin: '*',
        //     },
        // });
        const newSocket = io('http://localhost:8080', {
            transports: ['websocket'],
            autoConnect: true,
            cors: {
                origin: '*',
            },
        });
        setSocket(newSocket);

        return () => {
            if (newSocket) {
                newSocket.close();
            }
        };
    }, []);
    useEffect(() => {
        setUserName({
            displayName: user.displayName,
        });

        setImageUrl(user.photoURL)
    }, [user.displayName, user.photoURL]);

    useEffect(() => {
        if (!socket) return;
    }, [socket]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username.displayName.trim()) {
            setIsError(true);
            setError("Username cannot be blank");
            setOpen(true);
            return;
        }

        try {
            // Update user profile in Firebase Authentication
            await updateProfile(auth.currentUser, {
                displayName: username.displayName,
            });

            // Update user document in Firestore
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                username: username.displayName,
            });

            // Reset error state
            setIsError(false);
            setError("Username changed successfully");
        } catch (error) {
            setIsError(true);
            setError(error.message);
        }

        // Ensure the alert is open
        setOpen(true);
    };


    const handleLogout = async () => {
        const confirmLogout = window.confirm("Are you sure you want to log out?");
        if (confirmLogout) {
            try {
                await logOut();
                navigate('/');
            } catch (err) {
                console.log(err.message);
            }
        }
    };

    async function generateRoomCode() {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let roomCode = "";

        let checkRoomCode = false;

        for (let i = 0; i < 5; i++) {
            roomCode += letters[Math.floor(Math.random() * letters.length)];
        }
        const roomsCollectionRef = collection(db, 'rooms');
        const querySnapshot = await getDocs(roomsCollectionRef)
        querySnapshot.forEach((doc) => {
            if (roomCode === doc.id) {
                checkRoomCode = true;
            }
        })
        if (checkRoomCode === true) {
            return generateRoomCode();
        } else {
            return roomCode;
        }
    }
    useEffect(() => {
        if (!socket) return;

        socket.on('matchFound', ({ roomCode }) => {
            navigate(`/roomgame?&roomCode=${encodeURIComponent(roomCode)}`);
        });
        socket.on('matchTeamFound', ({ roomCode }) => {
            navigate(`/roomgameTeam?&roomCode=${encodeURIComponent(roomCode)}`);
        });
    }, [socket, roomCode]);
    useEffect(() => {
        let timer;
        if (findRoom || findTeamRoom) {
            timer = setInterval(() => {
                // Increase seconds by 1
                setCountup(prevCountup => {
                    let updatedSeconds = prevCountup.seconds + 1;
                    let updatedMinutes = prevCountup.minutes;

                    // Check if seconds reach 60 and adjust minutes accordingly
                    if (updatedSeconds >= 60) {
                        updatedMinutes += 1;
                        updatedSeconds = 0;
                    }

                    return { minutes: updatedMinutes, seconds: updatedSeconds };
                });
            }, 1000); // Increase count-up every second
        }
        return () => {
            setCountup({ minutes: 0, seconds: 0 });
            clearInterval(timer); // Clear timer when component unmounts
        };


    }, [findRoom, findTeamRoom]);
    const formattedTime = `${countup.minutes.toString().padStart(2, '0')}:${countup.seconds.toString().padStart(2, '0')}`;

    const handleFindRoom = () => {
        if (findRoom) return;
        setFindRoom(true);
        socket.emit('waitingPlayer', { user });
        setIsInputVisible(false);
    }
    const handleFindTeamRoom = () => {
        if (findTeamRoom) return;
        setFindTeamRoom(true);
        socket.emit('waitingTeamPlayer', { user });
        setIsInputVisible(false);
    }
    const cancelFindRoom = () => {
        setFindRoom(false);
        socket.emit('cancelWaiting');
    }
    const cancelFindTeamRoom = () => {
        setFindTeamRoom(false);
        socket.emit('cancelTeamWaiting');

    }
    const handleCreateRoom = async () => {
        if (findRoom || findTeamRoom) return;
        const newRoomCode = await generateRoomCode();
        navigate(`/roomgame?&roomCode=${encodeURIComponent(newRoomCode)}`);
    };
    const handleJoinRoom = async (e) => {
        const roomsCollectionRef = collection(db, 'rooms');
        const querySnapshot = await getDocs(roomsCollectionRef)
        querySnapshot.forEach((doc) => {
            if (roomCode.toUpperCase() === doc.id) {
                navigate(`/roomgame?&roomCode=${encodeURIComponent(roomCode.toUpperCase())}`);
            }
        })
    };
    const handleRoomCodeChange = (event) => {
        setRoomCode(event.target.value);
    };
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setSelectedFile(file);
        console.log(file);
        setImageUrl(URL.createObjectURL(file));
    };
    const setImg = async () => {
        if (!selectedFile) return;
        const storageRef = ref(storage, `${user.uid}/profile.jpg`);
        console.log(storageRef);
        await uploadBytes(storageRef, selectedFile).then(() => {
            console.log('Uploaded a blob or file!');
        });

        getDownloadURL(ref(storage, `${user.uid}/profile.jpg`))
            .then((url) => {
                updateProfile(auth.currentUser, {
                    photoURL: url,
                });
            })
        setIsModalOpen(false);
    }

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserName((prevValues) => ({ ...prevValues, [name]: value }));
    };
    const handleButtonClick = () => {
        if (findRoom || findTeamRoom) return;
        setIsInputVisible(true);
    };
    const handleInputBlur = () => {
        setIsInputVisible(false);
    };
    const handleCreateTeamRoom = async () => {
        if (findRoom || findTeamRoom) return;
        const newRoomCode = await generateRoomCode();
        navigate(`/roomgameTeam?&roomCode=${encodeURIComponent(newRoomCode)}`);
    }
    const handleJoinTeamRoom = async () => {
        const roomsCollectionRef = collection(db, 'rooms');
        const querySnapshot = await getDocs(roomsCollectionRef)
        querySnapshot.forEach((doc) => {
            if (roomCode.toUpperCase() === doc.id) {
                navigate(`/roomgameTeam?&roomCode=${encodeURIComponent(roomCode.toUpperCase())}`);
            }
        })
    }
    const handleSingleMode = () => {
        setSelectedMode('single');
    }
    const handleTeamMode = () => {
        setSelectedMode('team');
    }
    const handleToSelectMode = () => {
        setSelectedMode(null);
    }
    const handleScoreboard = () => {
        navigate('/scoreboard');
    }
    return (
        <div className="text-center w-screen flex flex-col justify-center">
            <motion.h1 className="text-5xl sm:text-7xl font-thin" initial={{ scale: 0 }} animate={{ scale: 1 }}>Tic Tac Talk</motion.h1>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                {user.photoURL ? (
                    <img src={imageUrl} alt="" className='w-10 h-10 rounded-full mx-auto my-5' style={{ cursor: 'pointer' }} onClick={openModal} />
                ) : (
                    <AccountCircleIcon sx={{ fontSize: 40 }} className='mx-auto my-5' style={{ cursor: 'pointer' }} onClick={openModal}></AccountCircleIcon>
                )}
            </motion.div>
            <div className='flex flex-col justify-center w-full text-center'>
                {error && <Collapse in={open}>
                    <Alert onClose={() => { setOpen(false); }} severity={iserror ? "error" : "success"} variant="filled" className='my-3 w-80 mx-auto'>{error}</Alert>
                </Collapse>}
                <motion.form onSubmit={handleSubmit} initial={{ scale: 0 }} animate={{ scale: 1 }} className='w-full'>
                    <div className='flex justify-center items-center'>
                        <p>
                            Welcome,
                        </p>
                        <input
                            type="text"
                            name="displayName"
                            className='mx-1 w-32 bg-transparent px-1 focus:outline-none'
                            placeholder='Name?'
                            onChange={handleChange}
                            value={username.displayName}
                            autoComplete="off"
                            maxLength={8}
                        />
                        <motion.button whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}>
                            <Edit></Edit>
                        </motion.button>
                    </div>
                </motion.form>
                {selectedMode && (
                    <motion.div className='text-3xl mt-2'>
                        <p>{selectedMode === 'single' ? 'Single Mode' : 'Team Mode'}</p>
                    </motion.div>
                )}
                <Box mt={2} className="gap-2 grid w-56 m-auto relative">
                    {!selectedMode &&
                        <>
                            <motion.button className="h-14 w-full bg-fuchsia-600 hover:bg-fuchsia-400
                text-white font-thin py-2 px-4 border-b-4 
                border-fuchsia-700 hover:border-fuchsia-500 rounded
                 text-2xl" whileTap={{ transform: "translateY(5px)" }}
                                onClick={handleSingleMode} initial={{ scale: 0 }}
                                animate={{ scale: 1 }}>
                                Single Mode
                            </motion.button>
                            <motion.button className="h-14 w-full bg-amber-500 hover:bg-amber-300
                text-white font-thin py-2 px-4 border-b-4 
                border-amber-600 hover:border-amber-400 rounded
                 text-2xl" whileTap={{ transform: "translateY(5px)" }}
                                onClick={handleTeamMode} initial={{ scale: 0 }}
                                animate={{ scale: 1 }}>
                                Team Mode
                            </motion.button>
                            <motion.button className="h-14 w-full bg-indigo-500 hover:bg-indigo-400
                text-white font-thin py-2 px-4 border-b-4 
                border-indigo-600 hover:border-indigo-500 rounded
                 text-2xl" whileTap={{ transform: "translateY(5px)" }}
                                onClick={handleScoreboard} initial={{ scale: 0 }}
                                animate={{ scale: 1 }}>
                                Scoreboard
                            </motion.button>
                            <motion.button
                                className="bg-transparent h-14 w-full 
                                hover:bg-red-500 
                            text-red-700 font-thin 
                            hover:text-white py-2 px-4 border border-red-500 
                            hover:border-transparent rounded
                            text-2xl" onClick={handleLogout} initial={{ scale: 0 }}
                                animate={{ scale: 1 }}>
                                Log out
                            </motion.button>
                        </>
                    }
                    {selectedMode === 'single' &&
                        <>
                            <motion.button className="h-14 w-full bg-orange-600 hover:bg-orange-400
                text-white font-thin py-2 px-4 border-b-4 bottom-1/3
                border-orange-700 hover:border-orange-500 rounded
                 text-2xl" whileTap={{ transform: "translateY(5px)" }}
                                onClick={handleFindRoom} initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                {findRoom ? `${formattedTime}` : 'Find Match'}
                            </motion.button>
                            {findRoom && (
                                <motion.button className="absolute left-full ml-2 h-14 w-2/4 bg-orange-600 hover:bg-orange-400
                text-white font-thin py-2 border-b-4
                border-orange-700 hover:border-orange-500 rounded
                 text-2xl" whileTap={{ transform: "translateY(5px)" }}
                                    onClick={cancelFindRoom} initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                    Cancel
                                </motion.button>
                            )}
                            <motion.button className="h-14 w-full bg-green-500 hover:bg-green-400 
                text-white font-thin py-2 px-4 border-b-4 
                border-green-700 hover:border-green-500 rounded
                 text-2xl" whileTap={{ transform: "translateY(5px)" }}
                                onClick={handleCreateRoom} initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                Create Room
                            </motion.button>
                            {isInputVisible ? (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                    <input
                                        className='bg-gray-50 border border-gray-300 text-gray-900 
                                text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block 
                                w-full p-2.5 uppercase'
                                        id='roomCode'
                                        type="text"
                                        value={roomCode}
                                        onChange={handleRoomCodeChange}
                                        placeholder="Room Code?"
                                        maxLength={5}
                                    />
                                    <div className='flex'>
                                        <button
                                            className="h-14 w-2/5 bg-green-500 hover:bg-green-400 
                                text-white font-thin
                                border-b-4 border-green-700  hover:border-green-500
                                rounded text-2xl mt-1 mx-auto"
                                            onClick={handleJoinRoom}
                                        >
                                            Join
                                        </button>
                                        <button
                                            className="h-14 w-2/5 bg-red-600 hover:bg-red-400 
                                text-white font-thin 
                                border-b-4 border-red-700 hover:border-red-500
                                rounded text-2xl mt-1 mx-auto"
                                            onClick={handleInputBlur}
                                        >
                                            Back
                                        </button>
                                    </div>
                                </motion.div>

                            ) : (
                                <motion.button
                                    className="h-14 w-full bg-green-500 hover:bg-green-400 
                            text-white font-thin py-2 px-4 border-b-4 border-green-700 
                            hover:border-green-500 rounded text-2xl"
                                    onClick={handleButtonClick} initial={{ scale: 0 }} animate={{ scale: 1 }}
                                >
                                    Join Room
                                </motion.button>
                            )}
                            <motion.button
                                className="bg-transparent h-14 w-full 
                                        hover:bg-red-500 
                                    text-red-700 font-thin 
                                    hover:text-white py-2 px-4 border border-red-500 
                                        hover:border-transparent rounded
                                        text-2xl" onClick={handleToSelectMode} initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                Back
                            </motion.button>
                        </>
                    }
                    {selectedMode === 'team' &&
                        <>

                            <motion.button className="h-14 w-full bg-orange-600 hover:bg-orange-400
                text-white font-thin py-2 px-4 border-b-4 
                border-orange-700 hover:border-orange-500 rounded
                 text-2xl" whileTap={{ transform: "translateY(5px)" }}
                                onClick={handleFindTeamRoom} initial={{ scale: 0 }}
                                animate={{ scale: 1 }}>
                                {findTeamRoom ? `${formattedTime}` : 'Find Match'}
                            </motion.button>
                            {findTeamRoom && (
                                <motion.button className="absolute left-full ml-2 h-14 w-2/4 bg-orange-600 hover:bg-orange-400
                                text-white font-thin py-2 border-b-4
                                border-orange-700 hover:border-orange-500 rounded
                                text-2xl" whileTap={{ transform: "translateY(5px)" }}
                                    onClick={cancelFindTeamRoom} initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}>
                                    Cancel
                                </motion.button>
                            )}
                            <motion.button className="h-14 w-full bg-green-500 hover:bg-green-400 
                text-white font-thin py-2 px-4 border-b-4 
                border-green-700 hover:border-green-500 rounded
                 text-2xl" whileTap={{ transform: "translateY(5px)" }}
                                onClick={handleCreateTeamRoom} initial={{ scale: 0 }}
                                animate={{ scale: 1 }}>
                                Create Room
                            </motion.button>
                            {isInputVisible ? (
                                <>
                                    <motion.input
                                        className='bg-gray-50 border border-gray-300 text-gray-900 
                                text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block 
                                w-full p-2.5 uppercase'
                                        id='roomCode'
                                        type="text"
                                        value={roomCode}
                                        onChange={handleRoomCodeChange}
                                        placeholder="Room Code?"
                                        maxLength={5}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                    />
                                    <motion.div className='flex' initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}>
                                        <button
                                            className="h-14 w-2/5 bg-green-500 hover:bg-green-400 
                                text-white font-thin
                                border-b-4 border-green-700  hover:border-green-500
                                rounded text-2xl mt-1 mx-auto"
                                            onClick={handleJoinTeamRoom}
                                        >
                                            Join
                                        </button>
                                        <button
                                            className="h-14 w-2/5 bg-red-600 hover:bg-red-400 
                                text-white font-thin 
                                border-b-4 border-red-700 hover:border-red-500
                                rounded text-2xl mt-1 mx-auto"
                                            onClick={handleInputBlur}>
                                            Back
                                        </button>
                                    </motion.div>

                                </>
                            ) : (
                                <motion.button
                                    className="h-14 w-full bg-green-500 hover:bg-green-400 
                            text-white font-thin py-2 px-4 border-b-4 border-green-700 
                            hover:border-green-500 rounded text-2xl"
                                    onClick={handleButtonClick}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}>
                                    Join Room
                                </motion.button>
                            )}
                            <motion.button
                                className="bg-transparent h-14 w-full 
                                        hover:bg-red-500 
                                    text-red-700 font-thin 
                                    hover:text-white py-2 px-4 border border-red-500 
                                        hover:border-transparent rounded
                                        text-2xl" onClick={handleToSelectMode}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}>
                                Back
                            </motion.button>
                        </>
                    }
                    {isModalOpen && (
                        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
                            <div className="bg-white p-8 rounded-lg">
                                <input type="file" accept="image/*" onChange={handleFileChange} className="mt-3" />
                                <button onClick={closeModal} className="bg-red-500 text-white px-4 py-2 rounded mt-4">Close</button>
                                {imageUrl && (
                                    <>
                                        <img src={imageUrl} alt="" className='w-40 h-40 rounded-full mx-auto my-5' />
                                        <button className='bg-green-600 text-white px-4 py-2 rounded' onClick={setImg}>Choose this!</button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </Box>
            </div>
        </div>

    );
}

export default HomepageLogging;
