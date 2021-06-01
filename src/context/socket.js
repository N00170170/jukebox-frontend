import socketio from "socket.io-client";
import React from "react";
// import { SOCKET_URL } from "config";

// const ENDPOINT = "http://127.0.0.1:3001";
const ENDPOINT = "http://192.168.1.13:3001";

export const socket = socketio.connect(ENDPOINT);
export const SocketContext = React.createContext();