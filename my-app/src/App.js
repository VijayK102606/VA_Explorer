import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import VadeSideBar from './components/VadeSideBar.js';
import VadeExplorer from './components/VadeExplorer.js';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import { startTransition } from 'react';


function App() {
  return (
    <VadeExplorer/>
  );
}

export default App;
