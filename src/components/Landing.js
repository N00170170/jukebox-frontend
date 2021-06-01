import logo from '../logo.svg';
import '../App.css';

import React, { useState, useEffect } from "react";
import { Redirect, useHistory } from 'react-router-dom';
import { AppContext } from '../App';

const Landing = () => {

  const appContext = React.useContext(AppContext);

  let history = useHistory();

  //on app load, make socketio connection
  useEffect(() => {

  }, []);

  const handleChange = (e) => {
    const target = e.target;
    const field = target.name;
    const value = (target.type === 'checkbox') ? target.checked : target.value;
    appContext.setState({
        ...appContext.state,
        [field]: value
    });
  }

  const joinRoom = () => {
    //check if room exists - rest API?
    history.push("/room");
  }

  const createRoom = () => {
    history.push("/room")
  }

  return (
    <div className="App">
      <header className="App-header">
        <input name="username" type="text" value={appContext.state.username} onChange={handleChange} />
        <input name="room" type="text" value={appContext.state.room} onChange={handleChange} /><button onClick={joinRoom}>Join</button>
        <span>OR</span>
        <button onClick={createRoom}>Host</button>
      </header>
    </div>
  );
};

export default Landing;
