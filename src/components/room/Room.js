import logo from '../../logo.svg';
import '../../App.css';

import React, { useState, useEffect, useContext } from "react";
import { AppContext } from '../../App';
import { SocketContext, socket } from '../../context/socket';

const ENDPOINT = "http://127.0.0.1:3001";

const initialState = {
    users: [],
    queue: []
  };

const Room = () => {

    const [state, setState] = React.useState(initialState);

    const [users, setUsers] = React.useState([]);
    const [queue, setQueue] = React.useState([]);
    const [playing, setPlaying] = React.useState(true);

    const appContext = React.useContext(AppContext);

    const username = appContext.state.username;
    const room = appContext.state.room;

    let track = React.useRef();

    // on app load, make socketio connection
    // useEffect(() => {

    //     var socket = socketIOClient(ENDPOINT);

    //     //emit join room message with hardcoded values
    //     socket.emit('joinRoom', { username, room });

    //     //Get room and users
    //     socket.on('roomUsers', ({ room, users }) => {

    //         appContext.setState({
    //             ...appContext.state,
    //             room: room
    //         });

    //         appContext.setState({
    //             ...appContext.state,
    //             users: users
    //         });

    //         console.log(users);
    //     })
    //     socketClient = socket;

    //     return () => socket.disconnect();

    // }, []);

    //on app load, make socketio connection
    useEffect(() => {


        //emit join room message with hardcoded values
        if(room){
            socket.emit('joinRoom', { username, room });
        } else {
            socket.emit('createRoom', username);
        }

        //Get room and users
        socket.on('roomUsers', ({ room, users }) => {

            appContext.setState({
                ...appContext.state,
                room: room
            });

            // setState({
            //     ...state,
            //     users: users
            // });

            setUsers(users);

            console.log('users', users);
        })


        socket.on('pauseMsg', playingState => {
            setPlaying(playingState);
        });

        // Track added/removed from queue (message from server)
        socket.on('queueUpdate', queue => {
            //check if first item in new queue is not the one that's currently playing
            // if (queueArray[0] != queue[0]) {
            //     playTrack(queue[0]);
            // }
            setQueue(queue);
        })


        socket.on('message', message => {
            console.log(message);
        })

        return () => socket.disconnect();

    }, [socket]);

    const queueAdd = (e) => {
        socket.emit('queueAdd', track.current.value);
        track.current.value = '';
    }

    const pauseToggle = () => {
        socket.emit('pauseToggle', playing);
        // togglePlayingState();
    }

    const nextTrack = () => {
        socket.emit('nextTrack');
    }

    return (
        <SocketContext.Provider value={socket}>
            <div className="App">
                <header className="App-header">
                    <p>Room: {room}</p>
                    <p>Users: {''}
                        {users !== null &&
                            users.map((user,index) => (
                                (index == 0 ?
                                    <span style={{color: "red"}}>{user.username}{' '}</span>
                                :
                                    <>{user.username}{' '}</>
                                )
                            ))
                        }
                    </p>
                    <p>State: {playing ? 'Playing' : 'Paused'}</p>
                    <h2>Queue<span id="pause" onClick={pauseToggle}>⏯︎</span> <span id="skip" onClick={nextTrack}>⏭︎</span></h2>
                    {queue.length === 0 ?
                        <p>There are no tracks in the queue</p>
                        :
                        queue.map((track, index) => (
                            (index === 0 ?
                                <p style={{color: "#70dc70", fontWeight: "bold"}}>{track}</p>
                            :
                                <p>{track}</p>
                            )
                        ))
                    }
                    <input name="track" type="text" ref={track}></input><button onClick={queueAdd}>Add</button>
                </header>
            </div>
        </SocketContext.Provider>
    );
}

export default Room;