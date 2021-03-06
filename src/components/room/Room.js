import '../../App.css';

import React, { useState, useEffect, useContext, useRef } from "react";
import { Container, Row, Col, Form, ListGroup, Navbar, Button, ProgressBar } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import { AppContext } from '../../App';
import { SocketContext, socket } from '../../context/socket';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlayCircle, faPauseCircle, faStepForward, faSearch, faPlusCircle } from '@fortawesome/fontawesome-free-solid'

const initialState = {
    users: [],
    queue: [],
    device_id: null,
    searchResults: []
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
    const playingRef = useRef();
    playingRef.current = playing;

    const appContext = React.useContext(AppContext);

    const username = appContext.state.username;
    const room = appContext.state.room;

    let track = React.useRef();
    let trackSearch = React.useRef();

    let history = useHistory();

    const access_token = sessionStorage.getItem("spotify_access_token");

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
                ...stateRef.current,
                users: users
            });

            setState({
                ...stateRef.current,
                users: users,
            })

            // Get metadata for the tracks in the queue
            getQueueMetadata(roomObj.queue);

            // dispatch({
            //     type: "SET_USERS",
            //     payload: users
            // })

            // dispatch({
            //     type: "SET_QUEUE",
            //     payload: roomObj.queue
            // })

            // setUsers(users);

            setPlaying(roomObj.playing);
            // setQueue(roomObj.queue);
        })


        socket.on('pauseMsg', playingState => {
            setPlaying(playingState);
            //if they are the host - send API to play/pause
            if (appContext.state.hosting) {
                let path = null;
                if (playingState) {
                    console.log("playing from server is true, we will play spotify")
                    path = 'play';
                } else {
                    console.log("playing from server is false, we will pause spotify")
                    path = 'pause';
                }
                fetch(`https://api.spotify.com/v1/me/player/${path}?device_id=` + stateRef.current.device_id, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${access_token}`
                    },
                });
            }
        });

        // Track added/removed from queue (message from server)
        socket.on('queueUpdate', newQueue => {

            // playing logic for room - only run by the host
            if (appContext.state.hosting) {
                //check if first item in new queue is not the one that's currently playing
                if (stateRef.current.queue[0]?.uri != newQueue[0] && newQueue.length > 0) {
                    playTrack(newQueue[0]);
                }

                if (newQueue.length > 0) {
                    if (stateRef.current.queue.length == 0) { //if queue is empty and a new track is added, start playing
                        socket.emit('pauseToggle', playingRef.current); //send back play
                        console.log("queue is empty and a new track is added");
                    } else if (!playingRef.current && stateRef.current.queue.length > newQueue.length) { //if paused and next track is clicked
                        socket.emit('pauseToggle', false); //send back play
                        console.log("paused and next track is clicked");
                    } else if (!playingRef.current && stateRef.current.queue.length < newQueue.length) { //if paused and new track added
                        socket.emit('pauseToggle', true); //send back pause (i.e. keep it paused)
                        console.log("paused and new track added")
                    }
                }
                // if new queue is empty, server should send back playing false
                if (newQueue.length == 0) {
                    socket.emit('pauseToggle', true);
                }
            }

            // Get metadata for the tracks in the newQueue, and set state
            getQueueMetadata(newQueue);

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
        //only load if hosting
        if (appContext.state.hosting) {
            loadSpotifyScript(spotifySDKCallback)
        }
    });

    const spotifySDKCallback = () => {
        window.onSpotifyWebPlaybackSDKReady = () => {
            console.log("Init spotify");
            let { Player } = window.Spotify;
            const spotifyPlayer = new Player({
                name: 'Jukebox: ' + room,
                getOAuthToken: cb => { cb(access_token); }
            });

            // Error handling
            spotifyPlayer.addListener('initialization_error', ({ message }) => { console.error(message); });
            spotifyPlayer.addListener('authentication_error', ({ message }) => { console.error(message); });
            spotifyPlayer.addListener('account_error', ({ message }) => { console.error(message); });
            spotifyPlayer.addListener('playback_error', ({ message }) => { console.error(message); });

            // Playback status updates
            spotifyPlayer.addListener('player_state_changed', state => {
                //check if song has ended (position will be at 0 and player will be paused)

                //check if the uri is the same as the track currently playing AND it is paused AND at position 0
                if (stateRef.current.queue[0]?.uri == state.track_window.current_track.uri && state.position == 0 && state.paused == true && state.loading == false) {
                    socket.emit('nextTrack');
                    console.log("track ended");
                }

                console.log('Spotify player state:', state);

                // if(state.paused == playingRef.current){ //if Spotify is paused but app is playing
                //     socket.emit('pauseToggle', playingRef.current);
                //     console.log('Spotify is paused but app is playing')
                // }
            });

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

    const queueAdd = (uri) => {
        if (typeof uri === 'object') {
            socket.emit('queueAdd', track.current.value);
            track.current.value = '';
        } else {
            socket.emit('queueAdd', uri);
        }
    }

    const pauseToggle = () => {
        if (state.queue.length > 0) {
            socket.emit('pauseToggle', playing);
        }
    }

    const nextTrack = () => {
        if (state.queue.length > 0) {
            socket.emit('nextTrack');
        }
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
                        'Authorization': `Bearer ${access_token}`
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

    // Search for track
    const searchForTrack = () => {
        if (trackSearch.current.value.length > 0) {
            fetch('https://api.spotify.com/v1/search?q=' + trackSearch.current.value.replace(/\s+/g, '+') + '&type=track&market=IE&limit=5', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`
                },
            })
                .then(response => response.json())
                .then(data => {
                    if (data.tracks) {
                        setState({
                            ...state,
                            searchResults: data.tracks.items
                        });
                    }
                });
        } else {
            setState({
                ...state,
                searchResults: []
            });
        }
    }

    const getQueueMetadata = (newQueue) => {
        // Get the track metadata if newQueue contains tracks
        if (newQueue.length > 0) {
            fetch(`https://api.spotify.com/v1/tracks?ids=` + newQueue.map(track => { return track.replace('spotify:track:', '') }).join(), { // removes spotify:track: to give just the ID
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${access_token}`
                },
            })
                .then(response => response.json())
                .then(data => {
                    //set queue state to be an array of objects containing 'uri' and 'name'
                    let queueArray = [];
                    newQueue.map((track, index) => {
                        let newTrack = {
                            uri: track,
                            name: data.tracks[index].artists[0].name + ' - ' + data.tracks[index].name
                        }
                        queueArray.push(newTrack)
                    })
                    return queueArray;
                })
                .then((queueArray) => {
                    setState(state => ({
                        ...state,
                        queue: queueArray
                    }))
                })
        } else { // if newQueue is empty then set local queue state to empty array
            setState(state => ({
                ...state,
                queue: []
            }))
        }
    }

    return (
        <SocketContext.Provider value={socket}>
            <Container fluid className='bg'>
                <Row>
                    <Col md={4} style={{ borderRight: "1px solid #8f8f8f", backgroundColor: "#1e1f21" }}>
                        <Row>
                            <Col sm={12} className="d-grid">
                                <Button variant="danger" className="mt-3 btn-sm" onClick={() => history.push("/")}>LEAVE</Button><br />
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={6}>
                                <Form.Label style={{ fontWeight: "bold" }}><h3>Room</h3></Form.Label>
                                <ListGroup.Item style={{ backgroundColor: "#282c34", color: "#fff", letterSpacing: "4px" }}>{room}</ListGroup.Item>
                                <span style={{ color: "#70dc70", fontSize: "14px" }}>share this code with your friends!</span>
                            </Col>
                            <Col xs={6}>
                                <Form.Label style={{ fontWeight: "bold" }}><h3>Users</h3></Form.Label>

                                {state.users !== null &&
                                    // <Form.Select multiple readOnly aria-label="Default select example">
                                    //     {state.users.map((user, index) => (
                                    //         (index == 0 ?
                                    //             <option style={{ color: "red" }}>{user.username}{' '}</option>
                                    //             :
                                    //             <option>{user.username}{' '}</option>
                                    //         )
                                    //     ))}
                                    // </Form.Select>

                                    <ListGroup variant="flush">
                                        {state.users.map((user, index) => (
                                            (index == 0 ?
                                                <ListGroup.Item style={{ backgroundColor: "#282c34" }}><span style={{ color: "red", fontWeight: "bold" }}>{user.username}{' '}</span><span style={{ color: "gray", float: "right" }}>(host)</span></ListGroup.Item>
                                                :
                                                <ListGroup.Item><>{user.username}{' '}</></ListGroup.Item>
                                            )
                                        ))}
                                    </ListGroup>
                                }
                            </Col>
                        </Row>
                        <br />
                        <Row>
                            <Col sm={12} className="d-grid">
                                <h3>Queue <span className="text-muted">{playing ? '(playing)' : '(paused)'}</span></h3>
                                <ListGroup className="queue-list">
                                    {state.queue.length === 0 ?
                                        <ListGroup.Item className="light-text" style={{ backgroundColor: "#282c34" }}>There are no tracks in the queue</ListGroup.Item>
                                        :
                                        stateRef.current.queue.map((track, index) => (
                                            (index === 0 ?
                                                <ListGroup.Item key={index} style={{ color: "#70dc70", fontWeight: "bold", backgroundColor: "#282c34" }}>{track.name}</ListGroup.Item>
                                                :
                                                <ListGroup.Item key={index} className="light-text" style={{ backgroundColor: "#282c34" }}>{track.name}</ListGroup.Item>
                                            )
                                        ))
                                    }
                                </ListGroup>
                            </Col>
                        </Row>

                    </Col>
                    <Col md={8}>
                        <Row >
                            <Row className="mt-4 mb-4">
                                <Col xl={7} lg={5} sm={12} >
                                    {/* <FontAwesomeIcon icon={faSearch} style={{ color: "white" }} /> */}
                                    <Form.Control name="tracksearch" type="search" placeholder="Search" ref={trackSearch} onChange={searchForTrack} />
                                </Col>
                                <Col style={{ float: "right" }}>
                                    <div key={`inline-checkbox`} className="mt-3" style={{ float: "right" }}>
                                        <Form.Check
                                            inline
                                            checked="checked"
                                            label="Spotify"
                                            name="group1"
                                            type="checkbox"
                                            id={`inline-checkbox-1`}
                                        />
                                        <Form.Check
                                            inline
                                            disabled
                                            label="SoundCloud"
                                            name="group1"
                                            type="checkbox"
                                            id={`inline-checkbox-2`}
                                        />
                                        <Form.Check
                                            inline
                                            disabled
                                            label="YouTube"
                                            type="checkbox"
                                            id={`inline-checkbox-3`}
                                        />
                                    </div>
                                </Col>
                                {/* <hr style={{ color: "white", backgroundColor: "white" }} /> */}
                                {/* <hr style={{ backgroundColor: "white", opacity: "1" }}/> */}
                            </Row>
                            <Row>
                                <ul className="search-results">
                                    {state.searchResults.length > 0 &&
                                        <ListGroup style={{ marginBottom: "80px" }}>
                                            {
                                                state.searchResults.map((track, index) => (
                                                    <ListGroup.Item key={index} className="search-results-track" style={{ backgroundColor: "#282c34", marginTop: "12px" }} onClick={() => queueAdd(track.uri)}>
                                                        <img src={track.album.images[2].url} style={{ marginRight: "12px", float: "left" }} />
                                                        <FontAwesomeIcon icon={faPlusCircle} size="2x" style={{ color: "#70dc70", float: "right", marginTop: "16px", cursor: "pointer" }} />

                                                        <div className="align-middle" >
                                                            <span className="ml-1 pl-4 pr-3 mr-3 light-text">{track.name}</span><br />
                                                            <span className="ml-4 pl-4 pr-3 mr-3" style={{ color: "#8f8f8f" }}>{track.artists[0].name}</span>
                                                        </div>
                                                    </ListGroup.Item>
                                                ))}
                                        </ListGroup>
                                    }
                                </ul>
                            </Row>
                        </Row>
                    </Col>
                </Row>
                {appContext.state.hosting &&
                    <Navbar fixed="bottom" expand="lg" variant="dark" style={{ backgroundColor: "#121212" }} className="justify-content-center text-center m-auto align-items-center">
                        <FontAwesomeIcon disabled icon={playing ? faPauseCircle : faPlayCircle} size="3x" style={{ color: "white", marginRight: "20px", cursor: "pointer" }} onClick={pauseToggle} />
                        <FontAwesomeIcon icon={faStepForward} size="lg" style={{ color: "white", cursor: "pointer" }} onClick={nextTrack} />
                        {/* <ProgressBar now="90" label="2:46" /> */}
                    </Navbar>
                }
                <script src="https://sdk.scdn.co/spotify-player.js"></script>
            </Container>
        </SocketContext.Provider>
    );
}

export default Room;