import React from 'react';
import '../App.css';
import { Navbar, Nav, Container} from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function MyNavbar() {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="/">VA Explorer</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav"/>
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as = {Link} to ="/">Home</Nav.Link>
            <Nav.Link as = {Link} to = "/begin">Begin</Nav.Link>
            <Nav.Link as = {Link} to = "/about">About us</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
