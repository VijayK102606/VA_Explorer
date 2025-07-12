import React, {useState} from 'react'
import '../App.css';

export default function MyBegin() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch('http://localhost:5000/api/upload', {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();

      if (res.ok) {
        setMessage("File uploaded, File ID:" + data.fileID);
      } else {
        setMessage("Upload failed:" + data.message )
      }
    } catch (error) {
      setMessage("Error uploading file:" + error.message);
    }
  };

  return (
    <div className="begin-page">
      <h1>Upload your data. Please see our formatting rules below.</h1>
      <p>Add requirements.</p>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange}/>
        <button type="submit">Upload</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  )
}
