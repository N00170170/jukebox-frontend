import socketio from "socket.io-client";
import React from "react";

export const socket = socketio.connect(process.env.REACT_APP_SOCKETIO_ENDPOINT);
export const SocketContext = React.createContext();