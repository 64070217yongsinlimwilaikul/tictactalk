import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { SlActionUndo } from "react-icons/sl";

function Scoreboard() {
    const [userData, setUserData] = useState(Array);
    const [userTeamData, setUserTeamData] = useState(Array);
    const navigate = useNavigate();
    useEffect(() => {
        getUsersData();
    }, [])
    const getUsersData = async () => {
        const q = query(collection(db, "users"), orderBy("scores", "desc"));
        const q2 = query(collection(db, "users"), orderBy("TScores", "desc"));
        const querySnapshot = await getDocs(q);
        const querySnapshot2 = await getDocs(q2);
        const sortedData = querySnapshot.docs.map(doc => doc.data());
        const sortedData2 = querySnapshot2.docs.map(doc => doc.data());
        setUserData(sortedData);
        setUserTeamData(sortedData2);
    }

    return (
        <div>
            <div className='top-2 left-2 relative'>
                <button onClick={() => { navigate('/') }} className=' text-2xl'>
                    <SlActionUndo size={50}></SlActionUndo>
                </button>
            </div>
            <div className="container flex flex-col gap-5 p-2 mx-auto justify-center lg:flex-row">
                <div className='flex-grow'>
                    <h1 className="text-2xl font-bold my-4 text-center">Single Match Scoreboard</h1>
                    <table className="table-auto w-full">
                        <thead>
                            <tr>
                                <th className="px-2 py-2">Email</th>
                                <th className="px-2 py-2">Win</th>
                                <th className="px-2 py-2">Draw</th>
                                <th className="px-2 py-2">Lose</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userData.map((player, index) => index < 10 && (
                                <tr key={index}>
                                    <td className="border px-2 py-2"style={{ maxWidth: "180px", wordWrap: "break-word" }}>{player.email}</td>
                                    <td className="border px-2 py-2 text-center">{(player.wins ? player.wins : 0)}</td>
                                    <td className="border px-2 py-2 text-center">{(player.draws ? player.draws : 0)}</td>
                                    <td className="border px-2 py-2 text-center">{(player.losses ? player.losses : 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className='flex-grow'>
                    <h1 className="text-2xl font-bold my-4 text-center">Team Match Scoreboard</h1>
                    <table className="table-auto w-full">
                        <thead>
                            <tr>
                                <th className="px-2 py-2">Email</th>
                                <th className="px-2 py-2">Win</th>
                                <th className="px-2 py-2">Draw</th>
                                <th className="px-2 py-2">Lose</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userTeamData.map((team, index) => index < 10 && (
                                <tr key={index}>
                                    <td className="border px-2 py-2">{team.email}</td>
                                    <td className="border px-2 py-2 text-center">{(team.TWins ? team.TWins : 0)}</td>
                                    <td className="border px-2 py-2 text-center">{(team.TDraws ? team.TDraws : 0)}</td>
                                    <td className="border px-2 py-2 text-center">{(team.TLosses ? team.TLosses : 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>


        </div>
    );
}

export default Scoreboard;
