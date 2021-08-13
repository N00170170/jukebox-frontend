
import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Spinner, CloseButton } from 'react-bootstrap';
import { Redirect, useHistory } from 'react-router-dom';
import { AppContext } from '../App';
import base64url from "base64url";
import crypto from "crypto-browserify";
import '../App.css';


const NicknameModal = (props) => {

    const appContext = React.useContext(AppContext);

    let history = useHistory();

    const [authToken, setAuthToken] = React.useState(null);
    const [authenticating, setAuthenticating] = React.useState(false);


    const handleChange = (e) => {
        const target = e.target;
        const field = target.name;
        const value = (target.type === 'checkbox') ? target.checked : target.value;
        appContext.setState({
            ...appContext.state,
            [field]: value
        });
    }

    const authSpotify = () => {
        setAuthenticating(true);

        // generate code verifier
        const code_verifier = base64url(crypto.pseudoRandomBytes(32)); //creates random 43 char long string

        appContext.setState({
            ...appContext.state,
            code_verifier: code_verifier
        });

        // generate code challenge
        const code_challenge = base64url(crypto.createHash("sha256").update(code_verifier).digest()); // hashes code_verifier, then encodes the hash to base64

        // construct authorisation url
        const auth_url = "https://accounts.spotify.com/authorize?response_type=code&client_id=" + process.env.REACT_APP_SPOTIFY_CLIENT_ID + "&redirect_uri=" + encodeURIComponent(process.env.REACT_APP_SPOTIFY_CALLBACK) + (appContext.state.hosting ? "&scope=streaming%20user-read-email%20user-read-private" : "") + "&code_challenge=" + code_challenge + "&code_challenge_method=S256"

        window.open(auth_url, 'popup', 'width=500,height=800')

    }

    //listen for change in storage - when auth code gets added to storage by SpotifyCallback
    window.addEventListener("storage", () => {
        if (localStorage.getItem("spotify_auth_code")) {
            setAuthenticating(false);
            setAuthToken(localStorage.getItem("spotify_auth_code"));
        }
    });

    //exchanges auth code for an access token and then joins/creates room
    const joinRoom = () => {
        if (localStorage.getItem("spotify_auth_code")) {

            //exchange auth code for access token from Spotify
            const body = {
                client_id: process.env.REACT_APP_SPOTIFY_CLIENT_ID,
                grant_type: 'authorization_code',
                code: localStorage.getItem("spotify_auth_code"),
                redirect_uri: process.env.REACT_APP_SPOTIFY_CALLBACK,
                code_verifier: appContext.state.code_verifier
            }

            fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                body: new URLSearchParams(Object.entries(body)).toString(), //convert to x-www-form-urlencoded
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            })
                .then(response => response.json())
                .then(data => {
                    sessionStorage.setItem("spotify_access_token", data.access_token)
                    sessionStorage.setItem("spotify_exchange", JSON.stringify(data))
                    if (appContext.state.hosting) {
                        appContext.setState({
                            ...appContext.state,
                            room: null
                        });
                    }
                    history.push("/room")
                    localStorage.clear();
                });
        }
    }

    return (
        <>
            <Modal show={props.show} onHide={props.handleClose} className="justify-content-center text-center m-auto align-items-center" centered>
                <Modal.Header>
                    <Modal.Title>
                        {appContext.state.hosting ?
                            <>Create Room</>
                            :
                            <>
                                Join Room <span style={{ fontStyle: "italic" }}>{appContext.state.room}</span>
                            </>
                        }
                    </Modal.Title>
                    <CloseButton variant="white" onClick={props.handleClose}/>

                </Modal.Header>
                <Modal.Body>
                    <p>Please enter your nickname</p>
                    <Form.Control name="username" type="text" value={appContext.state.username} placeholder="nickname" className="text-center" style={{ fontWeight: "bold", fontSize: "18px" }} onChange={handleChange} />
                    <br />
                    <p className="mb-0 pb-0">Please authorise your Spotify account</p>
                    {appContext.state.hosting && <><span className="text-muted" style={{ fontSize: "13px", paddingBottom: "0px" }}>(Spotify Premium is required to host a room)</span><br /></>}
                    <br />
                    <Button variant="success" onClick={authSpotify}>{authenticating ? <Spinner animation="border" size="sm" /> : (authToken ? 'Spotify Authorised' : 'Authorise Spotify')}</Button><br></br>
                    <br />
                    <br />
                    <div className="d-grid gap-2">
                        <Button variant="primary" size="lg" onClick={joinRoom} disabled={!appContext.state.username || !authToken}>{appContext.state.hosting ? 'Create' : 'Join'} Room</Button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default NicknameModal;
