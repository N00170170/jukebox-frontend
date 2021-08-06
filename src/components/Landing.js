import '../App.css';

import React, { useState, useEffect } from "react";
import { Container, Col, Form, Button, Card } from 'react-bootstrap';
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
    const value = (target.type === 'checkbox') ? target.checked : target.value;
    appContext.setState({
      ...appContext.state,
      [field]: value
    });
  }

  return (
    <Container fluid className='bg'>
      <Col lg={3} sm={6} className="justify-content-center text-center m-auto align-items-center" style={{position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)'}}>
        <h2>LOGO</h2>
        <p style={{fontStyle: "italic"}}>A collaborative Jukebox music streaming application</p>

        <Form>
        <Card body>
          <Form.Control name="room" type="text" value={appContext.state.room} placeholder="ROOM CODE" className="text-center" onChange={handleChange} />
          <br />
          <div className="d-grid gap-2">
            <Button variant="primary" size="lg" onClick={() => handleShow(false)} disabled={!appContext.state.room}>Join</Button>
          </div>
        </Card>
          <br />
          <span style={{fontWeight: "bold"}}>OR</span>
          <br />
          <br />
          <div className="d-grid gap-2">
            <Button variant="primary" size="lg" onClick={() => handleShow(true)}>Host</Button>
          </div>
        </Form>
      </Col>
      <NicknameModal show={show} handleClose={handleClose}/>
    </Container>
  );
};

export default Landing;
