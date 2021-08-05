import '../App.css';

import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Card } from 'react-bootstrap';
import { Redirect, useHistory } from 'react-router-dom';
import { AppContext } from '../App';

const NicknameModal = (props) => {

    const appContext = React.useContext(AppContext);

    let history = useHistory();

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
        history.push("/room");
        // if no, show user error. prompt them to create a new room instead?
    }

    const createRoom = () => {
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
                        {props.hosting ?
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
                    <p>Please authorise your Spotify account</p>
                    <Button variant="success">Authorise Spotify</Button>
                    <br />
                    <br />
                    <div className="d-grid gap-2">
                        {props.hosting ?
                            <Button variant="primary" size="lg" onClick={createRoom}>Create Room</Button>
                            :
                            <Button variant="primary" size="lg" onClick={joinRoom}>Join Room</Button>
                        }
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default NicknameModal;
