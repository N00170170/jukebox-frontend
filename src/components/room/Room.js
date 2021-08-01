import logo from '../../logo.svg';
import '../../App.css';

import React, { useState, useEffect, useContext, useRef } from "react";
import { AppContext } from '../../App';
import { SocketContext, socket } from '../../context/socket';

// const ENDPOINT = "http://127.0.0.1:3001";
const ENDPOINT = "http://192.168.1.13:3001";

const initialState = {
    users: [],
    queue: [],
    device_id: null
};

const reducer = (state, action) => {
    // console.log(action);
    switch (action.type) {
        case "SET_QUEUE": {
            return {
                ...state,
                queue: action.payload
            };
        }
        case "SET_USERS": {
            return {
                ...state,
                users: action.payload
            };
        }
        case "SET_DEVICEID": {
            return {
                ...state,
                device_id: action.payload
            };
        }
    }
}

const Room = () => {

    const [state, setState] = useState(initialState);
    const stateRef = useRef();
    stateRef.current = state;
    // const [state, dispatch] = React.useReducer(reducer, initialState);

    // const [users, setUsers] = React.useState([]);
    // const [queue, setQueue] = React.useState([]);
    const [playing, setPlaying] = React.useState(false);

    const appContext = React.useContext(AppContext);

    const username = appContext.state.username;
    const room = appContext.state.room;

    let track = React.useRef();

    // const access_token = 'BQDb4stQgWdymxnLBTf__cUjmVtl64rRXe1RkoxjxG_VI_P3XixlcQa8nSH690zO5igdhtuMrHQDFI06fydVthltchfX6iQ6TbehMK2f-f2LUgAQfFZXkRe9-OxF76-PKTsdro-EW7GeqLfd5SIATfYtZcEJ1jpPI0pl3AtBkXIUzGZn9yCJzYnpBDMHmN8zBVUSijMGNTrdZdz8Eg';

    //on app load, make socketio connection
    useEffect(() => {


        //emit join room message with hardcoded values
        if (room) {
            socket.emit('joinRoom', { username, room });
        } else {
            socket.emit('createRoom', username);
        }
        return () => socket.disconnect();

    }, [socket]);

    //Socket IO listen events
    useEffect(() => {

        //Get room and users - occurs when someone joins/leaves
        socket.on('roomUsers', ({ roomObj, room, users, playing }) => {

            appContext.setState({
                ...appContext.state,
                room: room
            });

            setState({
                ...state,
                users: users
            });

            setState(state => ({
                ...state,
                users: users,
                queue: roomObj.queue
            }))

            // dispatch({
            //     type: "SET_USERS",
            //     payload: users
            // })

            // dispatch({
            //     type: "SET_QUEUE",
            //     payload: roomObj.queue
            // })

            // setUsers(users);

            console.log('roomObj:', roomObj);

            setPlaying(roomObj.playing);
            // setQueue(roomObj.queue);

            console.log('users', users);
        })


        socket.on('pauseMsg', playingState => {
            setPlaying(playingState);
            //if they are the host - send API to play/pause
            let path = null;
            if(playingState){
                path = 'play';
            } else {
                path = 'pause';
            }
            fetch(`https://api.spotify.com/v1/me/player/${path}?device_id=` + stateRef.current.device_id, {
                method: 'PUT',
                // body: JSON.stringify({ uris: [spotify_uri] }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.REACT_APP_SPOTIFY_TOKEN}`
                },
            });
        });

        // Track added/removed from queue (message from server)
        socket.on('queueUpdate', newQueue => {

            //check if first item in new queue is not the one that's currently playing
            if (stateRef.current.queue[0] != newQueue[0] && newQueue.length > 0) {
                playTrack(newQueue[0]);
                console.log('play:',newQueue[0])
            }

            if(stateRef.current.queue.length == 0){
                socket.emit('pauseToggle', playing);
            }

            setState(state => ({
                ...state,
                queue: newQueue
            }))

            // dispatch({
            //     type: "SET_QUEUE",
            //     payload: newQueue
            // })

        })
        socket.on('message', message => {
            console.log(message);
        })
    }, []);

    //on load init Spotify player
    useEffect(() => {
        loadSpotifyScript(spotifySDKCallback)
    });

    const spotifySDKCallback = () => {
        window.onSpotifyWebPlaybackSDKReady = () => {
            console.log("Init spotify");
            let { Player } = window.Spotify;
            const spotifyPlayer = new Player({
                name: 'Jukebox: ' + room,
                getOAuthToken: cb => { cb(process.env.REACT_APP_SPOTIFY_TOKEN); }
            });

            // Error handling
            spotifyPlayer.addListener('initialization_error', ({ message }) => { console.error(message); });
            spotifyPlayer.addListener('authentication_error', ({ message }) => { console.error(message); });
            spotifyPlayer.addListener('account_error', ({ message }) => { console.error(message); });
            spotifyPlayer.addListener('playback_error', ({ message }) => { console.error(message); });

            // Playback status updates
            spotifyPlayer.addListener('player_state_changed', state => { console.log(state); });

            // Ready
            spotifyPlayer.addListener('ready', ({ device_id }) => {
                // playTrack(device_id);
                setState(state => ({
                    ...state,
                    device_id: device_id
                }))
                console.log('Ready with Device ID', device_id);
            });

            // Not Ready
            spotifyPlayer.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
            });

            // Connect to the player!
            spotifyPlayer.connect();
        };
    }

    const loadSpotifyScript = (callback) => {
        const existingScript = document.getElementById('spotify');
        if (!existingScript) {
            const script = document.createElement('script');
            script.src = 'https://sdk.scdn.co/spotify-player.js';
            script.id = 'spotify';
            document.body.appendChild(script);
            script.onload = () => {
                if (callback) callback();
            };
        }
        if (existingScript && callback) callback();
    };

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

    const playTrack = (spotifyUri) => {
        if (spotifyUri) {
            const play = ({
                spotify_uri,
                // playerInstance: {
                //   _options: {
                //     getOAuthToken,
                //     id
                //   }
                // }
            }) => {
                fetch(`https://api.spotify.com/v1/me/player/play?device_id=` + stateRef.current.device_id, {
                    method: 'PUT',
                    body: JSON.stringify({ uris: [spotify_uri] }),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.REACT_APP_SPOTIFY_TOKEN}`
                    },
                });
            };

            play({
                // playerInstance: new Spotify.Player({ name: "..." }),
                // spotify_uri: 'spotify:track:7xGfFoTpQ2E7fRF5lN10tr',
                spotify_uri: spotifyUri,

            });
        } else {
            alert("Please enter a Spotify Track URI")
        }

    }

    return (
        <SocketContext.Provider value={socket}>
            <div className="App">
                <header className="App-header">
                    <p>Room: {room}</p>
                    <p>Users: {''}
                        {state.users !== null &&
                            state.users.map((user, index) => (
                                (index == 0 ?
                                    <span style={{ color: "red" }}>{user.username}{' '}</span>
                                    :
                                    <>{user.username}{' '}</>
                                )
                            ))
                        }
                    </p>
                    <p>State: {playing ? 'Playing' : 'Paused'}</p>
                    <h2>Queue<span id="pause" onClick={pauseToggle}>⏯︎</span> <span id="skip" onClick={nextTrack}>⏭︎</span></h2>
                    {stateRef.current.queue.length === 0 ?
                        <p>There are no tracks in the queue</p>
                        :
                        stateRef.current.queue.map((track, index) => (
                            (index === 0 ?
                                <p style={{ color: "#70dc70", fontWeight: "bold" }}>{track}</p>
                                :
                                <p>{track}</p>
                            )
                        ))
                    }
                    <input name="track" type="text" ref={track}></input><button onClick={queueAdd}>Add</button>
                </header>
                <script src="https://sdk.scdn.co/spotify-player.js"></script>
            </div>
        </SocketContext.Provider>
    );
}

export default Room;