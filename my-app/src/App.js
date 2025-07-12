import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import MyNavbar from './components/MyNavbar'
import MyHome from './components/MyHome';
import MyBegin from './components/MyBegin';
import MyAbout from './components/MyAbout';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';

function App() {
  return (
    <Router>
      <MyNavbar/>
      <Routes>
        <Route path="/" element={<MyHome/>}/>
        <Route path="/about" element={<MyAbout/>}/>
        <Route path="/begin" element={<MyBegin/>}/>
      </Routes>
    </Router>
  );
}

export default App;
