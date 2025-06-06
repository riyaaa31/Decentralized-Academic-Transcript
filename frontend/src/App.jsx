// App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import ABI from './AcademicTranscriptRegistry.json';
import './App.css';

const CONTRACT_ADDRESS = '<0x5F9b4D87EBB454E6d94Aa30eFF3E627CC18C27C6>';

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [transcriptData, setTranscriptData] = useState(null);
  const [isInstitution, setIsInstitution] = useState(false);
  const [student, setStudent] = useState('');
  const [ipfsHash, setIpfsHash] = useState('');
  const [transcriptId, setTranscriptId] = useState('');
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractInstance = new Contract(CONTRACT_ADDRESS, ABI.abi, signer);
        setContract(contractInstance);

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);

        const adminAddress = await contractInstance.admin();
        setAdmin(adminAddress);

        const isInst = await contractInstance.isInstitution(accounts[0]);
        setIsInstitution(isInst);
      }
    };
    init();
  }, []);

  const issueTranscript = async () => {
    if (!student || !ipfsHash) return alert('Student and IPFS hash required');
    try {
      const tx = await contract.issueTranscript(student, ipfsHash);
      await tx.wait();
      alert('Transcript Issued Successfully');
    } catch (err) {
      console.error(err);
      alert('Error Issuing Transcript');
    }
  };

  const getTranscript = async () => {
    if (!student || transcriptId === '') return alert('Student and Transcript ID required');
    try {
      const data = await contract.getTranscript(student, transcriptId);
      setTranscriptData(data);
    } catch (err) {
      console.error(err);
      alert('Error Fetching Transcript');
    }
  };

  const registerInstitution = async () => {
    if (!student) return alert('Enter address to register');
    try {
      const tx = await contract.registerInstitution(student);
      await tx.wait();
      alert('Institution Registered');
    } catch (err) {
      console.error(err);
      alert('Registration Failed');
    }
  };

  return (
    <div className="app-container gradient-bg">
      <h1 className="main-title">📚 Academic Transcript Registry</h1>
      <p className="account-info">🔗 Connected: {account}</p>

      {account === admin && (
        <div className="card admin-card">
          <h2>Admin Panel 🛠️</h2>
          <input placeholder="Institution Address" value={student} onChange={e => setStudent(e.target.value)} />
          <button onClick={registerInstitution}>Register Institution</button>
        </div>
      )}

      {isInstitution && (
        <div className="card institution-card">
          <h2>Issue Transcript ✍️</h2>
          <input placeholder="Student Address" value={student} onChange={e => setStudent(e.target.value)} />
          <input placeholder="IPFS Hash" value={ipfsHash} onChange={e => setIpfsHash(e.target.value)} />
          <button onClick={issueTranscript}>Issue</button>
        </div>
      )}

      <div className="card view-card">
        <h2>View Transcript 🔍</h2>
        <input placeholder="Student Address" value={student} onChange={e => setStudent(e.target.value)} />
        <input placeholder="Transcript ID" value={transcriptId} onChange={e => setTranscriptId(e.target.value)} />
        <button onClick={getTranscript}>Fetch</button>

        {transcriptData && (
          <div className="transcript-details">
            <p><strong>Issued By:</strong> {transcriptData.issuedBy}</p>
            <p><strong>Issued At:</strong> {new Date(transcriptData.issuedAt * 1000).toLocaleString()}</p>
            <p><strong>IPFS Hash:</strong> <a href={`https://ipfs.io/ipfs/${transcriptData.ipfsHash}`} target="_blank" rel="noopener noreferrer">{transcriptData.ipfsHash}</a></p>
            <p><strong>Verified:</strong> {transcriptData.isVerified ? '✅ Yes' : '❌ No'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
