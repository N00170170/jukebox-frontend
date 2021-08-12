import logo from './logo.svg';
import './App.css';

import { Switch, Route } from 'react-router-dom';
import React, { useState, useEffect } from "react";

import Landing from './components/Landing';
import Room from './components/room/Room';
import SpotifyCallback from './components/SpotifyCallback';

require('dotenv').config()

const AppContext = React.createContext();

function App() {

  const initialState = {
    username: '',
    room: '',
    hosting: false,
    access_token: '',
    code_verifier: ''
  };

  const [state, setState] = React.useState(initialState);

  return (
    <AppContext.Provider value={{
      state, setState
    }}>
      <Switch>
        <Route exact path="/" component={Landing} />
        <Route path="/room" component={Room} />
        <Route path="/callback" component={SpotifyCallback} />
      </Switch>
    </AppContext.Provider>
  );
}

export default App;
export { AppContext };