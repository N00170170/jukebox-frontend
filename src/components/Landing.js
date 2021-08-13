import '../App.css';

import React, { useState, useEffect } from "react";
import { Container, Col, Row, Form, Button, Card, Image } from 'react-bootstrap';
import { AppContext } from '../App';
import NicknameModal from './NicknameModal';

const Landing = () => {
  const appContext = React.useContext(AppContext);
  const [show, setShow] = useState(false);
  // const [hosting, setHosting] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = (hosting) => {
    appContext.setState({
      ...appContext.state,
      hosting: hosting
    });
    // setHosting(hosting);
    setShow(true);
  }

  const handleChange = (e) => {
    const target = e.target;
    const field = target.name;
    let value = (target.type === 'checkbox') ? target.checked : target.value;
    value = value.toUpperCase();
    appContext.setState({
      ...appContext.state,
      [field]: value
    });
  }

  return (
    <Container fluid className='bg'>
      <Col lg={3} md={6} xs={9} className="justify-content-center text-center m-auto align-items-center" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
        <h1 style={{ fontWeight: "bold" }}>JUKEBOX APP</h1>
        <p style={{ fontStyle: "italic", color: "#8f8f8f" }}>A collaborative Jukebox music streaming application</p>

        <Form>
          <Card body style={{ padding: "8px", backgroundColor: "#282c34" }}>
            <Form.Control name="room" type="text" value={appContext.state.room} placeholder="Room Code" className="text-center" maxlength="4" style={{ fontWeight: "bold", fontSize: "18px", letterSpacing: "1px" }} onChange={handleChange} />
            <br />
            <div className="d-grid gap-2">
              <Button variant="primary" size="lg" onClick={() => handleShow(false)} disabled={!appContext.state.room}>Join</Button>
            </div>
          </Card>
          <br />
          <span style={{ fontWeight: "bold" }}>OR</span>
          <br />
          <br />
          <div className="d-grid gap-2">
            <Button variant="primary" size="lg" onClick={() => handleShow(true)}>Host</Button>
          </div>
        </Form>
        <br />
        <br />
        <span style={{ fontSize: "14px" }} >Powered by</span><br />
        <Image fluid src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_CMYK_Green.png" style={{ maxHeight: "150px", maxWidth: "150px" }} />
      </Col>
      <NicknameModal show={show} handleClose={handleClose} />
    </Container>
  );
};

export default Landing;
