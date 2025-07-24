import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import MyNavbar from './components/MyNavbar'
import MyHome from './components/MyHome';
import MyBegin from './components/MyBegin';
import MyAbout from './components/MyAbout';
import VadeSideBar from './components/VadeSideBar';
import VadeExplorer from './components/VadeExplorer';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import { startTransition } from 'react';


function App() {
  return (
    <VadeExplorer/>
    /*
    <Router>
      <MyNavbar/>
      <VadeSideBar/>
      <Routes>
        <Route path="/" element={<MyHome/>}/>
        <Route path="/about" element={<MyAbout/>}/>
        <Route path="/begin" element={<MyBegin/>}/>
      </Routes>
    </Router>
    */
  );
}

export default App;
