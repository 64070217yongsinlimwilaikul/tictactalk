import React from 'react';
import { useUserAuth } from './context/UserAuthContext';
import HomePage from './components/HomePage';
import HomepageLogging from './components/HomepageLogging';
import './App.css';

const App = () => {
  const { user } = useUserAuth();

  return (
    <div className='h-screen flex flex-col'>
      <div className="flex items-center justify-center w-screen flex-1" >
        {user ? (
          <HomepageLogging></HomepageLogging>
        ) : (
          <HomePage></HomePage>
        )}
      </div>
    </div>
  );
}

export default App;
