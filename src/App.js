import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [useDefaultTemplate, setUseDefaultTemplate] = useState(true);
    const [templateFile, setTemplateFile] = useState(null);
    const [contractFile, setContractFile] = useState(null);
    const [parsedData, setParsedData] = useState(null);

    const handleTemplateChange = (e) => {
        setTemplateFile(e.target.files[0]);
    };

    const handleContractChange = (e) => {
        setContractFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        if (!useDefaultTemplate && templateFile) {
            formData.append('template', templateFile);
        }
        if (contractFile) {
            formData.append('contract', contractFile);
        } else {
            alert("Please upload a contract file.");
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setParsedData(response.data);
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    return (
      <div className='body'>
        <div className="App">
            <h1 className='head1'>Business Contract Highlighter</h1>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className='defaulttemp' >Use Default Template:</label>
                    <input
                        type="checkbox"
                        checked={useDefaultTemplate}
                        onChange={(e) => setUseDefaultTemplate(e.target.checked)}
                    />
                </div>
                {!useDefaultTemplate && (
                    <div className="form-group">
                        <label>Upload Contract Template:</label>
                        <input type="file" onChange={handleTemplateChange} />
                    </div>
                )}
                <div className="form-group">
                    <label>Upload Contract File:</label>
                    <input type="file" onChange={handleContractChange}  />
                    
                </div>
                <button type="submit" className="choose">Upload</button>
            </form>
            {parsedData && (
              
                <div className="parsed-data">
                  <div className='hilight' >
                    <h2 className='hilighttext'>Highlighted Contract</h2>
                    <ul>
                    <div dangerouslySetInnerHTML={{ __html: parsedData.highlighted_contract_text }} />
                    </ul>
                </div>
                    <div className='parsed'>
                      <h2 className='parsedtext'>Parsed Clauses</h2>
                    <ul>
                        {parsedData.parsed_clauses.map((clause, index) => (
                            <li key={index}>
                                {clause.text} - <strong>Keywords:</strong> {clause.keywords.join(', ')}
                            </li>
                        ))}
                    </ul>
                    </div>
                    {/* <h2>Deviations</h2>
                    <ul>
                        {parsedData.deviations.map((clause, index) => (
                            <li key={index}>
                                {clause.text} - <strong>Keywords:</strong> {clause.keywords.join(', ')}
                            </li>
                        ))}
                    </ul> */}
                    <div className='table_glass'>
                    <h2 className='entitytext'>Entities Detected</h2>
                    <table className="entities-table">
                        <thead>
                            <tr>
                                <th>Entity</th>
                                <th>Label</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {parsedData.entities.map((entity, index) => (
                                <tr key={index}>
                                    <td>{entity.text}</td>
                                    <td>{entity.label}</td>
                                    <td>{entity.score}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}
        </div>
        </div>
    );
}

export default App;
