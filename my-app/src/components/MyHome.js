import React from 'react';
import '../App.css';
import { Container } from 'react-bootstrap';

export default function MyHome() {
  return (
    <div className = "home-page">
      <header>
        <h1>Welcome!</h1>
      </header>
      <main>
        <h6>
          VA explorer is a data tool that allows users to easily upload 
          their VA data and receive insightful summaries and interactive visualizations. 
          Whether you're looking to analyze trends or gain a deeper understanding of your data, 
          VA Explorer provides intuitive charts and reports to help you make sense of your 
          information quickly and effectively.
        </h6>
      </main>
    </div>
  )
}
