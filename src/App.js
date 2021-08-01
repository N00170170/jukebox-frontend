import logo from './logo.svg';
import './App.css';

import { Switch, Route } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import socketIOClient from "socket.io-client";

import Landing from './components/Landing';
import Room from './components/room/Room';

require('dotenv').config()

const ENDPOINT = "http://127.0.0.1:3001";

const AppContext = React.createContext();

function App() {

  const initialState = {
    username: 'test',
    room: 'JS'
  };

  const [state, setState] = React.useState(initialState);

  return (
    <AppContext.Provider value={{
      state, setState
    }}>
      <Switch>
        <Route exact path="/" component={Landing} />
        <Route path="/room" component={Room} />
      </Switch>
    </AppContext.Provider>
  );
}

export default App;
export { AppContext };