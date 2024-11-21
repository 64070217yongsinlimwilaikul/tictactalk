import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import './tictactoe.css';
import ChooseO from "./ChooseO";
import ChooseX from "./ChooseX";
import DrawXO from "./DrawXO";
import queryString from "query-string";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Spinner from "./Spinner";
import { useUserAuth } from "../context/UserAuthContext";
import { auth } from "../firebase";
import Chat from "./Chat";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Button from "./Button";

function Tictactoe() {
    const navigate = useNavigate();
    const [squares, setSquares] = useState(Array(9).fill(""));
    const [sizeSquares, setSizeSquares] = useState(Array(9).fill(-1));
    const [turn, setTurn] = useState("x");
    const [winner, setWinner] = useState(null);
    const [role, setRole] = useState("x");

    const [xAvailableSizes, setXAvailableSize] = useState([3, 3, 3]);
    const [oAvailableSizes, setOAvailableSize] = useState([3, 3, 3]);

    const [xSize, setXSize] = useState(1);
    const [oSize, setOSize] = useState(1);

    const [socket, setSocket] = useState(null);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [player2Name, setPlayer2Name] = useState("");
    const location = useLocation();
    const { roomCode } = queryString.parse(location.search);

    const { user } = useUserAuth();
    const uid = auth.currentUser?.uid;

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
        if (!socket) return;
        socket.emit('joinRoom', { roomCode, user });
        socket.on('gameStart', ({ currentPlayer, anotherPlayer }) => {
            setRole(currentPlayer.email === user.email ? currentPlayer.role : anotherPlayer.role);
            setIsMyTurn(currentPlayer.email === user.email);
            setPlayer2Name(currentPlayer.email === user.email ? anotherPlayer.name : currentPlayer.name);
            setIsGameStarted(true);
        });

        socket.on('updateBoard', ({ squares, nextPlayer, pieceSizes, playerTurn, winner, xAvailableSizes, oAvailableSizes }) => {
            setTurn(playerTurn);
            setSizeSquares(pieceSizes);
            setSquares(squares);
            setWinner(winner);
            setIsMyTurn(nextPlayer === user.email ? true : false);
            setXAvailableSize(xAvailableSizes);
            setOAvailableSize(oAvailableSizes);
        });
    }, [socket, roomCode, user]);


    const checkEndTheGame = () => {
        for (let square of squares) {
            if (!square) return false;
        }
        return true;
    };

    useEffect(() => {
        if (!winner || !socket) return;
        winner === role ? socket.emit('updateWin', { user }) :
            winner === 'draw' ? socket.emit('updateDraw', { user }) : socket.emit('updateLose', { user });
        socket.emit('updateNotPlaying', { user });
    }, [winner])

    useEffect(() => {
        if (winner || !socket) return;
        socket.emit('updatePlaying', { user, roomCode });
    }, [winner])

    const checkWinner = () => {
        const combos = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];

        for (let combo of combos) {
            const [a, b, c] = combo;
            if (
                squares[a] &&
                squares[a] === squares[b] &&
                squares[a] === squares[c]
            ) {
                return squares[a];
            }
        }
        return null;
    };
    const canReplace = (ind) => {
        const currentSize = turn === "x" ? xSize : oSize;
        const availableSize = turn === "x" ? xAvailableSizes : oAvailableSizes;

        if (availableSize[currentSize] < 1) return false;
        if (squares[ind] && sizeSquares[ind] < currentSize) return true;
        if (!squares[ind]) return true;
        return false;
    };

    const updateSquares = (ind) => {
        if (!canReplace(ind) || winner) return;
        if (isGameStarted && !isMyTurn) return;
        const s = squares;
        let sizeAvailables = turn === "x" ? xAvailableSizes : oAvailableSizes
        let setSizeAvailables = turn === "x" ? setXAvailableSize : setOAvailableSize
        let setSize = turn === "x" ? setXSize : setOSize;
        let size = turn === "x" ? xSize : oSize

        s[ind] = turn;
        sizeSquares[ind] = size;
        sizeAvailables[size] = sizeAvailables[size] - 1;

        setSquares(s);
        setSizeSquares(sizeSquares);
        setSizeAvailables(sizeAvailables)
        const newBoard = squares;
        const pieceSizes = sizeSquares;
        newBoard[ind] = turn;
        setIsMyTurn(false);

        const W = checkEndTheGame() ? "draw" : checkWinner();

        setTurn(turn === "x" ? "o" : "x");

        if (sizeAvailables[size] < 1)
            setSize(getMaxSelectableSize(turn === "x" ? xAvailableSizes : oAvailableSizes))

        socket.emit('playerMove', {
            roomCode: roomCode, newBoard: newBoard, pieceSizes: pieceSizes, winner: W,
            xAvailableSizes: xAvailableSizes, oAvailableSizes: oAvailableSizes
        });
    };

    const getMaxSelectableSize = (availableSize) => {
        for (let index = availableSize.length - 1; index > -1; index--) {
            const size = availableSize[index];
            if (size > 0) return index;
        }

        return -1;
    }

    const resetGame = () => {
        // setSquares(Array(9).fill(""));
        // setSizeSquares(Array(9).fill(-1));
        // setXAvailableSize([3, 3, 3]);
        // setOAvailableSize([3, 3, 3]);
        // setWinner(null);
        const newBoard = Array(9).fill("");
        const pieceSizes = Array(9).fill(-1);
        socket.emit('playerMove', {
            roomCode: roomCode, newBoard: newBoard, pieceSizes: pieceSizes,
            winner: null, xAvailableSizes: [3, 3, 3], oAvailableSizes: [3, 3, 3]
        });
    };


    const getCurrentAvailableSize = () => {
        return oAvailableSizes;
    }
    const getCurrentAvailableSizeX = () => {
        return xAvailableSizes;
    }

    const greeting = () => {
        const greetings = [`Hello, ${user.displayName}`, `How are you to day ${user.displayName}?`,
        `Will you win ${user.displayName}?`, `Hope you win ${user.displayName}.`, `Hope you enjoy ${user.displayName}.`,
        `We are looking players for you, ${user.displayName}.`]
        return greetings[Math.floor(Math.random() * greetings.length)];
    }
    const backtoHomepage = () => {
        navigate("/");
    }

    const renderGameContent = () => {
        if (!isGameStarted && winner === null) {
            return (
                <div className='flex flex-col justify-center items-center gap-6'>
                    <h1 className='text-4xl font-bold text-white text-center'>TicTacTalk</h1>
                    <div className='flex flex-col justify-center items-center gap-4 mb-4'>
                        <span className='text-xl font-semibold'>{greeting()}</span>
                        <span className='text-xl font-semibold'>Room Code : {roomCode}</span>
                        <CopyToClipboard text={roomCode}>
                            <button className=" bg-green-400 hover:bg-green-300 p-2 rounded-xl">Copy Code</button>
                        </CopyToClipboard>
                    </div>
                    <Spinner text='Waiting Player...' />
                    <button
                        className="h-14 w-2/5 bg-red-600 hover:bg-red-400 
                                text-white font-thin 
                                border-b-4 border-red-700 hover:border-red-500
                                rounded text-2xl mt-1 mx-auto"
                        onClick={() => navigate('/')}
                    >
                        Back
                    </button>
                </div>
            );
        }

        if (isGameStarted) {
            return (
                <div className='grid lg:grid-cols-2 grid-cols-1 grid-rows-2 lg:grid-rows-1 justify-center gap-6 lg:w-3/4 w-full'>
                    <div className='flex flex-col justify-center items-center gap-6'>
                        <div className='flex flex-col justify-center items-center gap-4 mb-4'>
                            {/* <h3 className='text-2xl font-bold text-gray-300'>You are {role}</h3>
                            <h3 className='text-2xl font-bold text-gray-300'>{user.displayName} vs {player2Name}</h3> */}
                        </div>
                        <div className="tictactoe">
                            {/* <Button resetGame={resetGame} /> */}
                            <div className="game">
                                {squares.map((_, ind) => (
                                    <DrawXO
                                        key={ind}
                                        ind={ind}
                                        updateSquares={updateSquares}
                                        clsName={squares[ind]}
                                        turn={turn}
                                        size={sizeSquares[ind]}
                                    />
                                ))}
                            </div>
                            <div className={`turn ${turn === "x" ? "left" : "right"}`}>
                                <motion.svg
                                    width="100"
                                    height="100"
                                    viewBox="-25 0 200 200"
                                    initial="hidden"
                                    animate="visible"
                                >
                                    <motion.line
                                        x1="5"
                                        y1="30"
                                        x2="145"
                                        y2="170"
                                        stroke="#ffff"
                                        className="draw"
                                    />
                                    <motion.line
                                        x1="5"
                                        y1="170"
                                        x2="145"
                                        y2="30"
                                        stroke="#ffff"
                                        className="draw"
                                    />
                                </motion.svg>
                                <motion.svg
                                    width="100"
                                    height="100"
                                    viewBox="-25 0 200 200"
                                    initial="hidden"
                                    animate="visible"
                                >
                                    <motion.circle
                                        cx="75"
                                        cy="95"
                                        r="70"
                                        stroke="black"
                                        className="draw"
                                    />
                                </motion.svg>
                            </div>
                            <div className='grid grid-cols-3 gap-1 my-2'>
                                {
                                    [
                                        [0, 1, 2].map((valueSize, ind) => {
                                            if (xAvailableSizes[valueSize] < 1) return undefined;
                                            if (role === 'x') {
                                                return <div key={ind} className={"sizeBtn square " + (xSize === valueSize ? "enableSizeBtn" : "")}>
                                                    <ChooseX
                                                        clsName={turn}
                                                        ind={ind}
                                                        updateSquares={(idx) => {
                                                            let setSizeAvailables = setXSize;
                                                            setSizeAvailables(valueSize);
                                                        }}
                                                        size={valueSize}
                                                        customText={getCurrentAvailableSizeX()[valueSize]}
                                                    />
                                                </div>
                                            } else {
                                                return <div key={ind} className={"sizeBtn square " + (oSize === valueSize ? "enableSizeBtn" : "")}>
                                                    <ChooseO
                                                        clsName={turn}
                                                        updateSquares={(idx) => {
                                                            let setSizeAvailables = setOSize;
                                                            setSizeAvailables(valueSize)
                                                        }}
                                                        size={valueSize}
                                                        customText={getCurrentAvailableSize()[valueSize]}
                                                    />
                                                </div>
                                            }
                                        })
                                    ]
                                }
                            </div>
                            <AnimatePresence>
                                {winner && (
                                    <motion.div
                                        key={"parent-box"}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="winner z-50"
                                    >
                                        <motion.div
                                            key={"child-box"}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className="text"
                                        >
                                            <motion.h2
                                                initial={{ scale: 0, y: 100 }}
                                                animate={{
                                                    scale: 1,
                                                    y: 0,
                                                    transition: {
                                                        y: { delay: 0.7 },
                                                        duration: 0.7,
                                                    },
                                                }}
                                            >
                                                {winner === "x | o"
                                                    ? "No Winner :/"
                                                    : "Win !!"}
                                            </motion.h2>
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{
                                                    scale: 1,
                                                    transition: {
                                                        delay: 1.3,
                                                        duration: 0.2,
                                                    },
                                                }}
                                                className="win w-fit h-fit"
                                            >
                                                {winner === "x | o" ? (
                                                    <>
                                                        <ChooseX
                                                            clsName={turn}
                                                            size={2}
                                                        />
                                                        <ChooseO
                                                            clsName={turn}
                                                            size={2}
                                                        />
                                                    </>
                                                ) : (
                                                    <>
                                                        <DrawXO
                                                            updateSquares={updateSquares}
                                                            clsName={winner}
                                                            size={1}
                                                        />
                                                    </>
                                                )}
                                            </motion.div>
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{
                                                    scale: 1,
                                                    transition: { delay: 1.5, duration: 0.3 },
                                                }}
                                            >
                                                <div className="flex">
                                                    <button onClick={backtoHomepage}>Back to Homepage</button>
                                                    <Button resetGame={resetGame} />
                                                </div>
                                            </motion.div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    <div className="mx-auto h-2/3 lg:w-9/12 w-11/12 md:w-8/12 relative">
                        <h3 className='text-2xl font-bold'>You are {role}</h3>
                        <h3 className='text-2xl font-bold'>{user.displayName} vs {player2Name}</h3>
                        <Chat socket={socket} roomCode={roomCode} user={user}></Chat>
                    </div>

                </div>

            );
        }
    };
    return (
        <div className='container flex justify-center items-center text-center w-screen mx-auto min-h-screen'>
            {renderGameContent()}
        </div>
    );
}

export default Tictactoe;
