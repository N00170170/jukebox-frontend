import '../App.css';

import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Card } from 'react-bootstrap';
import { Redirect, useHistory } from 'react-router-dom';
import { AppContext } from '../App';

const NicknameModal = (props) => {

    const appContext = React.useContext(AppContext);

    let history = useHistory();

    const accessToken = React.useRef();

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
        // if yes
        if(accessToken.current.value){
            sessionStorage.setItem("spotify_access_token", accessToken.current.value)
        }
        history.push("/room");
        // if no, show user error. prompt them to create a new room instead?
    }

    const createRoom = () => {
        if(accessToken.current.value){
            sessionStorage.setItem("spotify_access_token", accessToken.current.value)
        }
        appContext.setState({
            ...appContext.state,
            room: null
        });
        history.push("/room")
    }

    return (
        <>
            <Modal show={props.show} onHide={props.handleClose} className="justify-content-center text-center m-auto align-items-center">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {appContext.state.hosting ?
                            <>Create Room</>
                            :
                            <>
                                Join Room <span style={{ fontStyle: "italic" }}>{appContext.state.room}</span>
                            </>
                        }
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Please enter your nickname</p>
                    <Form.Control name="username" type="text" value={appContext.state.username} placeholder="NICKNAME" className="text-center" onChange={handleChange} />
                    <br />
                    <p>Please authorise your Spotify account <a href="https://developer.spotify.com/documentation/web-playback-sdk/quick-start/" target="blank" onClick={() => {window.open('https://developer.spotify.com/documentation/web-playback-sdk/quick-start/','popup','width=600,height=600'); return false;}}>here</a></p>
                    {/* <Button variant="success">Authorise Spotify</Button> */}
                    <Form.Control name="access_token" as="textarea" placeholder="Access Token" ref={accessToken} className="text-center"  onChange={handleChange}/>

                    <br />
                    <br />
                    <div className="d-grid gap-2">
                        {appContext.state.hosting ?
                            <Button variant="primary" size="lg" onClick={createRoom} disabled={!appContext.state.username || !appContext.state.access_token }>Create Room</Button>
                            :
                            <Button variant="primary" size="lg" onClick={joinRoom} disabled={!appContext.state.username || !appContext.state.access_token }>Join Room</Button>
                        }
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default NicknameModal;
