import React from 'react';
import resume from '../resume.pdf';

function Resume() {
  return (
    <div className="resume-container">
      <object
        data={resume}
        type="application/pdf"
        width="100%"
        height="100%"
        style={{ zIndex: 1000 }}
      >
        <p>
          Your browser doesn't support PDFs.
          <a href={resume} download>Download the PDF</a>
        </p>
      </object>
    </div>
  );
}

export default Resume; 